export interface OverlayStoreContext {
    isKeyPressed: (keyCode: number) => boolean
    getCurrentKPS: () => number
    /** Read runtime state (e.g. key press count) by widget id */
    getRuntimeState: <T>(id: string) => T | undefined
    /** Write runtime state by widget id; core handles cross-window sync & persistence */
    setRuntimeState: (id: string, value: unknown) => void
}

export interface WidgetData<P = Record<string, unknown>> {
    id: string
    type: string // Open string; plugins can register their own types
    x: number
    y: number
    rotation: number
    zIndex: number
    isVisible: boolean
    props: P // Type-specific configuration
    /** Only present in persisted snapshots; at runtime the store's runtimeState is authoritative */
    runtime?: unknown
}

export interface Panel {
    name: string // unique
    isVisible: boolean
    x: number
    y: number
    widgets: WidgetData[]
}

export function createPanel(name: string, o: Partial<Panel> = {}): Panel {
    return { name, isVisible: true, x: 0, y: 0, widgets: [], ...o }
}