import { rgbaToString } from '~/models/color'
import type { Panel, Widget, KeyWidget, TextWidget, KeyTextWidget, CountWidget } from '~/models/widgets'
import type { OverlayStoreContext } from '~/models/widgets'

type Ctx = CanvasRenderingContext2D

function drawText(ctx: Ctx, w: TextWidget) {
    ctx.font = `${w.fontSize}px ${w.font || 'sans-serif'}`
    ctx.fillStyle = rgbaToString(w.color)
    ctx.fillText(w.content, 0, 0)
}

function drawKeyText(ctx: Ctx, w: KeyTextWidget, _s: OverlayStoreContext, pressed: boolean) {
    ctx.font = `${w.fontSize}px ${w.font || 'sans-serif'}`
    ctx.fillStyle = rgbaToString(pressed ? w.pressedColor : w.color)
    ctx.fillText(pressed ? w.pressedContent : w.content, 0, 0)
}

function drawCount(ctx: Ctx, w: CountWidget, store: OverlayStoreContext, pressed: boolean) {
    ctx.font = `${w.fontSize}px ${w.font || 'sans-serif'}`
    ctx.fillStyle = rgbaToString(pressed ? w.pressedColor : w.color)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(store.getKeyCount(w.id)), 0, 0)
}

function drawKey(ctx: Ctx, w: KeyWidget, store: OverlayStoreContext) {
    const pressed = store.isKeyPressed(w.keyBinding)

    ctx.beginPath()
    // already translated at outside layer
    ctx.roundRect(0, 0, w.width, w.height, w.radius)
    ctx.fillStyle = rgbaToString(pressed ? w.pressedBackgroundColor : w.backgroundColor)
    ctx.fill()
    ctx.lineWidth = w.borderSize
    ctx.strokeStyle = rgbaToString(pressed ? w.pressedBorderColor : w.borderColor)
    ctx.stroke()

    // relative to parent
    drawWidget(ctx, w.label, store, pressed)
    drawWidget(ctx, w.countWidget, store, pressed)
}

const RENDERERS: Record<Widget['type'], (ctx: Ctx, w: any, s: OverlayStoreContext, pressed: boolean) => void> = {
    text: drawText,
    keyText: drawKeyText,
    count: drawCount,
    key: drawKey,
}

export function drawWidget(ctx: Ctx, w: Widget, store: OverlayStoreContext, pressed = false) {
    if (!w.isVisible) return
    ctx.save()
    ctx.translate(w.x, w.y)
    if (w.rotation !== 0) ctx.rotate((w.rotation * Math.PI) / 180)
    RENDERERS[w.type](ctx, w, store, pressed)
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