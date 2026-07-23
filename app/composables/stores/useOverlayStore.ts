import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitTo, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
    createPanel as createPanelData,
    type Panel,
    type OverlayStoreContext,
} from '~/models/widgets'
import { getWidgetDefinition, walkWidgets } from '~/widgets/registry'

interface GlobalKeyStatePayload {
    code: number
    down: boolean
}

export const useOverlayStore = defineStore('overlay', () => {
    // ==================== State ====================
    const isEnabled = ref(false)
    const panels = ref<Panel[]>([])
    const activePanelId = ref<string | null>('')

    // Runtime state: a generic KV indexed by widget id.
    // Not part of panel sync (it has its own dedicated channel).
    const activeKeysSet = new Set<number>()
    const keyClickTimestamps: number[] = []
    const runtimeState = ref<Record<string, unknown>>({})
    let unlistenFn: UnlistenFn | null = null

    // ==================== Computeds ====================
    const activePanel = computed(() => {
        return panels.value.find((p) => p.name === activePanelId.value) || null
    })

    const visiblePanels = computed(() => {
        return panels.value.filter((p) => p.isVisible)
    })

    // ==================== Panel Actions ====================
    function isNameExists(name: string): boolean {
        return panels.value.some((p) => p.name === name)
    }

    function getUniqueName(baseName: string): string {
        let uniqueName = baseName
        let counter = 1

        while (isNameExists(uniqueName)) {
            uniqueName = `${baseName} (${counter})`
            counter++
        }

        return uniqueName
    }

    function createPanel(requestedName: string = 'Panel'): Panel {
        const finalName = getUniqueName(requestedName)
        const newPanel = createPanelData(finalName)

        panels.value.push(newPanel)
        activePanelId.value = newPanel.name
        syncPanelsToOtherWindows()
        return newPanel
    }

    function addPanel(panel: Panel): void {
        panel.name = getUniqueName(panel.name)
        panels.value.push(panel)
        syncPanelsToOtherWindows()
    }

    function renamePanel(oldName: string, newName: string): boolean {
        if (oldName === newName) return true

        if (isNameExists(newName)) {
            console.warn(`Failed to rename: "${newName}" exists`)
            return false
        }

        const panel = panels.value.find((p) => p.name === oldName)
        if (panel) {
            panel.name = newName
            if (activePanelId.value === oldName) {
                activePanelId.value = newName
            }
            syncPanelsToOtherWindows()
            return true
        }

        return false
    }

    function removePanel(name: string): void {
        panels.value = panels.value.filter((p) => p.name !== name)
        if (activePanelId.value === name) {
            activePanelId.value = panels.value[0]?.name || null
        }
        syncPanelsToOtherWindows()
    }

    function togglePanelVisibility(name: string): void {
        const panel = panels.value.find((p) => p.name === name)
        if (panel) {
            panel.isVisible = !panel.isVisible
        }
        syncPanelsToOtherWindows()
    }

    // ==================== Runtime State (generic KV) ====================
    function getRuntimeState<T>(id: string): T | undefined {
        return runtimeState.value[id] as T | undefined
    }

    let runtimeSyncScheduled = false
    function setRuntimeState(id: string, value: unknown): void {
        runtimeState.value[id] = value
        // Microtask-level batching: multiple writes within the same tick sync only once
        if (!runtimeSyncScheduled) {
            runtimeSyncScheduled = true
            queueMicrotask(() => {
                runtimeSyncScheduled = false
                syncRuntimeStateToOtherWindows()
            })
        }
    }

    function resetRuntimeState(): void {
        runtimeState.value = {}
        syncRuntimeStateToOtherWindows()
    }

    // Context object passed to WidgetDefinition callbacks and renderers
    const storeContext: OverlayStoreContext = {
        isKeyPressed,
        getCurrentKPS,
        getRuntimeState,
        setRuntimeState,
    }

    // ==================== Cross-window Sync ====================
    function otherWindow(): string {
        return getCurrentWindow().label === 'main' ? 'overlay' : 'main'
    }

    async function syncPanelsToOtherWindows() {
        const cleanData = JSON.parse(JSON.stringify(panels.value))
        await emitTo(otherWindow(), 'panels-updated', cleanData)
    }

    async function syncRuntimeStateToOtherWindows() {
        await emitTo(otherWindow(), 'runtime-state-updated', { ...runtimeState.value })
    }

    async function listenForPanelUpdates() {
        await listen<Panel[]>('panels-updated', (event) => {
            panels.value = event.payload
        })
    }

    async function listenForRuntimeStateUpdates() {
        await listen<Record<string, unknown>>('runtime-state-updated', (event) => {
            runtimeState.value = event.payload
        })
    }

    // Main window: respond to the overlay's "request initial data" signal
    async function initMainSyncListener() {
        await listen('request-initial-panels', () => {
            syncPanelsToOtherWindows()
            syncRuntimeStateToOtherWindows()
        })
    }

    // Overlay window: actively request data once on mount
    async function requestInitialPanels() {
        await emitTo('main', 'request-initial-panels')
    }

    // ==================== Persistence (Save / Load) ====================
    /**
     * Export a snapshot for saving: runtime state is written back into each
     * widget's `runtime` field, keyed by widget id.
     * Call this in the window that holds up-to-date runtime state
     * (main window must be kept in sync via listenForRuntimeStateUpdates).
     */
    function exportPanelsForSave(): Panel[] {
        const data: Panel[] = JSON.parse(JSON.stringify(panels.value))
        for (const p of data) {
            walkWidgets(p.widgets, (w) => {
                if (w.id in runtimeState.value) {
                    w.runtime = runtimeState.value[w.id]
                }
            })
        }
        return data
    }

    /**
     * Restore from saved data: extract `runtime` fields into runtimeState,
     * keeping panels as pure configuration.
     */
    function importPanelsFromSave(data: Panel[]) {
        const restored: Record<string, unknown> = {}
        for (const p of data) {
            walkWidgets(p.widgets, (w) => {
                if (w.runtime !== undefined) {
                    restored[w.id] = w.runtime
                    delete w.runtime
                }
            })
        }
        panels.value = data
        runtimeState.value = restored
        syncPanelsToOtherWindows()
        syncRuntimeStateToOtherWindows()
    }

    // ==================== Key Listener & KPS Actions ====================
    async function initGlobalKeyEventListener(): Promise<void> {
        if (unlistenFn) return // Avoid duplicate registration

        unlistenFn = await listen<GlobalKeyStatePayload>(
            'global-key-state',
            (event) => {
                const { code, down } = event.payload

                if (down) {
                    // Ignore repeated KeyDown events
                    if (!activeKeysSet.has(code)) {
                        activeKeysSet.add(code)
                        keyClickTimestamps.push(Date.now())

                        // Dispatch to every widget (including children) that declares onGlobalKeyDown
                        for (const panel of panels.value) {
                            walkWidgets(panel.widgets, (w) => {
                                getWidgetDefinition(w.type)?.onGlobalKeyDown?.(
                                    w, code, storeContext
                                )
                            })
                        }
                    }
                } else {
                    activeKeysSet.delete(code)
                }
            }
        )
    }

    function isKeyPressed(keyCode: number): boolean {
        return activeKeysSet.has(keyCode)
    }

    function getCurrentKPS(): number {
        const oneSecondAgo = Date.now() - 1000

        while (
            keyClickTimestamps[0] !== undefined &&
            keyClickTimestamps[0] < oneSecondAgo
            ) {
            keyClickTimestamps.shift()
        }

        return keyClickTimestamps.length
    }

    return {
        isEnabled,
        panels,
        activePanelId,
        activePanel,
        visiblePanels,
        createPanel,
        addPanel,
        renamePanel,
        removePanel,
        togglePanelVisibility,
        isNameExists,
        activeKeysSet,
        initGlobalKeyEventListener,
        isKeyPressed,
        getRuntimeState,
        setRuntimeState,
        resetRuntimeState,
        getCurrentKPS,
        listenForPanelUpdates,
        listenForRuntimeStateUpdates,
        syncPanelsToOtherWindows,
        syncRuntimeStateToOtherWindows,
        initMainSyncListener,
        requestInitialPanels,
        exportPanelsForSave,
        importPanelsFromSave,
    }
})