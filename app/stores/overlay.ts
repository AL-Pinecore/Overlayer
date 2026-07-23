import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitTo, listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { createPanel as createPanelData, type Panel } from '~/models/widgets'

interface GlobalKeyStatePayload {
    code: number
    down: boolean
}

export const useOverlayStore = defineStore('overlay', () => {
    // ==================== State ====================
    const isEnabled = ref(false)
    const panels = ref<Panel[]>([])
    const activePanelId = ref<string | null>('')

    const activeKeysSet = new Set<number>()
    const keyClickTimestamps: number[] = []
    const keyCounts = ref<Record<string, number>>({}) // key: countWidget.id
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

    // ==================== Cross-window Sync ====================
    function otherWindow(): string {
        return getCurrentWindow().label === 'main' ? 'overlay' : 'main'
    }

    async function syncPanelsToOtherWindows() {
        const cleanData = JSON.parse(JSON.stringify(panels.value))
        await emitTo(otherWindow(), 'panels-updated', cleanData)
    }

    async function syncKeyCountsToOtherWindows() {
        await emitTo(otherWindow(), 'key-counts-updated', { ...keyCounts.value })
    }

    async function listenForPanelUpdates() {
        await listen<Panel[]>('panels-updated', (event) => {
            panels.value = event.payload
        })
    }

    async function listenForKeyCountUpdates() {
        await listen<Record<string, number>>('key-counts-updated', (event) => {
            keyCounts.value = event.payload
        })
    }

    // 主窗口：监听 Overlay 发来的“请求初始数据”信号
    async function initMainSyncListener() {
        await listen('request-initial-panels', () => {
            syncPanelsToOtherWindows()
            syncKeyCountsToOtherWindows() // 读盘恢复的计数也一并给 overlay
        })
    }

    // Overlay 窗口：挂载时主动要一次数据
    async function requestInitialPanels() {
        await emitTo('main', 'request-initial-panels')
    }

    // ==================== Persistence (Save / Load) ====================
    function exportPanelsForSave(): Panel[] {
        const data: Panel[] = JSON.parse(JSON.stringify(panels.value))
        for (const p of data) {
            for (const w of p.widgets) {
                if (w.type === 'key') {
                    w.countWidget.count = getKeyCount(w.countWidget.id)
                }
            }
        }
        return data
    }

    function importPanelsFromSave(data: Panel[]) {
        const restored: Record<string, number> = {}
        for (const p of data) {
            for (const w of p.widgets) {
                if (w.type === 'key') {
                    if (typeof w.countWidget.count === 'number') {
                        restored[w.countWidget.id] = w.countWidget.count
                    }
                    delete w.countWidget.count
                }
            }
        }
        panels.value = data
        keyCounts.value = restored
        syncPanelsToOtherWindows()
        syncKeyCountsToOtherWindows()
    }

    // ==================== Key Listener & KPS Actions ====================
    async function initGlobalKeyEventListener(): Promise<void> {
        if (unlistenFn) return // 避免重复注册

        unlistenFn = await listen<GlobalKeyStatePayload>(
            'global-key-state',
            (event) => {
                const { code, down } = event.payload

                if (down) {
                    // ignore repeated KeyDown events
                    if (!activeKeysSet.has(code)) {
                        activeKeysSet.add(code)
                        keyClickTimestamps.push(Date.now())

                        let changed = false
                        for (const panel of panels.value) {
                            for (const w of panel.widgets) {
                                if (w.type === 'key' && w.keyBinding === code) {
                                    keyCounts.value[w.countWidget.id] =
                                        (keyCounts.value[w.countWidget.id] ?? 0) + 1
                                    changed = true
                                }
                            }
                        }
                        if (changed) {
                            syncKeyCountsToOtherWindows() // 让主窗口随时持有最新计数以便存盘
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

    function getKeyCount(id: string): number {
        return keyCounts.value[id] ?? 0
    }

    function resetKeyCounts(): void {
        keyCounts.value = {}
        syncKeyCountsToOtherWindows()
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
        getKeyCount,
        resetKeyCounts,
        getCurrentKPS,
        listenForPanelUpdates,
        listenForKeyCountUpdates,
        syncPanelsToOtherWindows,
        syncKeyCountsToOtherWindows,
        initMainSyncListener,
        requestInitialPanels,
        exportPanelsForSave,
        importPanelsFromSave,
    }
})