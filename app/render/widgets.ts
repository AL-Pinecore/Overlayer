import { getWidgetDefinition } from '~/widgets/registry'
import type { Panel, WidgetData, OverlayStoreContext } from '~/models/widgets'

type Ctx = CanvasRenderingContext2D

export function drawWidget(ctx: Ctx, w: WidgetData, store: OverlayStoreContext, pressed = false) {
    if (!w.isVisible) return

    const def = getWidgetDefinition(w.type)
    if (!def) {
        if (import.meta.dev) {
            console.warn(`[render] no renderer for widget type "${w.type}" — did you call registerBuiltinWidgets() in this window?`)
        }
        return
    }

    ctx.save()
    ctx.translate(w.x, w.y)
    if (w.rotation !== 0) ctx.rotate((w.rotation * Math.PI) / 180)
    try {
        def.draw(ctx, w, store, pressed)
    } catch (e) {
        // One broken widget must not kill the whole frame / render loop
        console.error(`[render] draw failed for widget "${w.type}" (${w.id})`, e)
    }
    ctx.restore()
}

export function drawPanel(ctx: Ctx, panel: Panel, store: OverlayStoreContext) {
    if (!panel.isVisible) return
    ctx.save()
    ctx.translate(panel.x, panel.y)
    for (const w of [...panel.widgets].sort((a, b) => a.zIndex - b.zIndex)) {
        drawWidget(ctx, w, store)
    }
    ctx.restore()
}