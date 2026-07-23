import type { WidgetData, OverlayStoreContext } from '~/models/widgets'

export interface WidgetDefinition<P = Record<string, unknown>> {
    type: string
    displayName: string
    /** Default props for newly created widgets of this type (called lazily) */
    defaultProps: () => P
    /**
     * Render the widget. Convention: draw at (0,0); the caller has already
     * applied translate/rotate. `pressed` is passed down by the parent
     * (false at top level).
     */
    draw: (
        ctx: CanvasRenderingContext2D,
        w: WidgetData<P>,
        store: OverlayStoreContext,
        pressed: boolean
    ) => void
    /** Types with child widgets must declare this; used for recursive traversal (id regeneration, event dispatch, persistence) */
    getChildren?: (w: WidgetData<P>) => WidgetData[]
    /** Called once per effective global key press (repeats are filtered out) */
    onGlobalKeyDown?: (w: WidgetData<P>, code: number, store: OverlayStoreContext) => void
}

const registry = new Map<string, WidgetDefinition<any>>()

export function registerWidget<P>(def: WidgetDefinition<P>): void {
    if (registry.has(def.type)) {
        console.warn(`[widget-registry] type "${def.type}" already registered, overwriting`)
    }
    registry.set(def.type, def as WidgetDefinition<any>)
}

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
    return registry.get(type)
}

/** Will back the "add widget" list in the settings UI later */
export function getAllWidgetDefinitions(): WidgetDefinition[] {
    return [...registry.values()]
}

export function createWidget<P = Record<string, unknown>>(
    type: string,
    o: Partial<Omit<WidgetData, 'id' | 'type' | 'props'>> & { props?: Partial<P> } = {}
): WidgetData<P> {
    const def = registry.get(type)
    if (!def) throw new Error(`[widget-registry] unknown widget type: "${type}"`)

    const { props, ...base } = o
    return {
        id: crypto.randomUUID(),
        type,
        x: 0, y: 0, rotation: 0, zIndex: 1, isVisible: true,
        ...base,
        props: { ...def.defaultProps(), ...props } as P,
    }
}

/** Depth-first traversal over the widget tree (including children) */
export function walkWidgets(widgets: WidgetData[], fn: (w: WidgetData) => void): void {
    for (const w of widgets) {
        fn(w)
        const children = registry.get(w.type)?.getChildren?.(w)
        if (children) walkWidgets(children, fn)
    }
}

/** Assign fresh ids to a deep-copied widget tree (used when duplicating panels) */
export function regenerateWidgetIds(widgets: WidgetData[]): void {
    walkWidgets(widgets, (w) => {
        w.id = crypto.randomUUID()
    })
}