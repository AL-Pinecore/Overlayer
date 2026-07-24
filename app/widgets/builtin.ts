import { registerWidget, createWidget } from '~/widgets/registry'
import { drawWidget } from '~/render/widgets'
import { rgbaToString, type RGBA } from '~/models/color'
import type {WidgetData} from '~/models/widgets'

// Rain state keeper
interface RainBar { y: number; height: number; isHolding: boolean }
interface RainState {
    bars: RainBar[]
    currentBar: RainBar | null
    wasPressed: boolean
    lastTime: number
}
const rainStates = new Map<string, RainState>()

// ==================== Props types ====================
export type TextProps = {
    content: string
    font: string
    fontSize: number
    color: RGBA
}

export type KeyTextProps = {
    content: string
    pressedContent: string
    font: string
    fontSize: number
    color: RGBA
    pressedColor: RGBA
}

export type CountProps = {
    font: string
    fontSize: number
    color: RGBA
    pressedColor: RGBA
}

export type KeyProps = {
    width: number
    height: number
    keyBinding: number
    label: WidgetData<KeyTextProps>
    countWidget: WidgetData<CountProps>
    backgroundColor: RGBA
    pressedBackgroundColor: RGBA
    radius: number
    borderSize: number
    borderColor: RGBA
    pressedBorderColor: RGBA
}

export type KpsProps = {
    prefix: string
    font: string
    fontSize: number
    color: RGBA
}

export type RainProps = {
    width: number
    height: number
    speed: number
    keyBinding: number
    backgroundColor: RGBA
    borderSize: number
    borderColor: RGBA
    radius: number
}

// ==================== Registration ====================
let registered = false

export function registerBuiltinWidgets(): void {
    if (registered) return
    registered = true

    registerWidget<TextProps>({
        type: 'text',
        displayName: 'Text',
        defaultProps: () => ({
            content: 'Sample Text', font: '', fontSize: 16,
            color: { color: '#FFFFFF', alpha: 1 },
        }),
        draw(ctx, w) {
            ctx.font = `${w.props.fontSize}px ${w.props.font || 'sans-serif'}`
            ctx.fillStyle = rgbaToString(w.props.color)
            ctx.fillText(w.props.content, 0, 0)
        },
    })

    registerWidget<KeyTextProps>({
        type: 'keyText',
        displayName: 'Key Label',
        defaultProps: () => ({
            content: 'A', pressedContent: 'A', font: '', fontSize: 18,
            color: { color: '#FFFFFF', alpha: 1 },
            pressedColor: { color: '#000000', alpha: 1 },
        }),
        draw(ctx, w, _store, pressed) {
            ctx.font = `${w.props.fontSize}px ${w.props.font || 'sans-serif'}`
            ctx.fillStyle = rgbaToString(pressed ? w.props.pressedColor : w.props.color)
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(pressed ? w.props.pressedContent : w.props.content, 0, 0)
        },
    })

    registerWidget<CountProps>({
        type: 'count',
        displayName: 'Key Counter',
        defaultProps: () => ({
            font: '', fontSize: 12,
            color: { color: '#FFFFFF', alpha: 1 },
            pressedColor: { color: '#000000', alpha: 1 },
        }),
        draw(ctx, w, store, pressed) {
            ctx.font = `${w.props.fontSize}px ${w.props.font || 'sans-serif'}`
            ctx.fillStyle = rgbaToString(pressed ? w.props.pressedColor : w.props.color)
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(String(store.getRuntimeState<number>(w.id) ?? 0), 0, 0)
        },
    })

    registerWidget<KeyProps>({
        type: 'key',
        displayName: 'Key',
        defaultProps: () => ({
            width: 50, height: 50, keyBinding: 0,
            label: createWidget<KeyTextProps>('keyText'),
            countWidget: createWidget<CountProps>('count'),
            backgroundColor: { color: '#000000', alpha: 0.5 },
            pressedBackgroundColor: { color: '#FFFFFF', alpha: 1 },
            radius: 3, borderSize: 1,
            borderColor: { color: '#FFFFFF', alpha: 1 },
            pressedBorderColor: { color: '#FFFFFF', alpha: 1 },
        }),
        getChildren: (w) => [w.props.label, w.props.countWidget],
        draw(ctx, w, store) {
            const p = w.props
            const pressed = store.isKeyPressed(p.keyBinding)

            ctx.beginPath()
            ctx.roundRect(0, 0, p.width, p.height, p.radius)
            ctx.fillStyle = rgbaToString(pressed ? p.pressedBackgroundColor : p.backgroundColor)
            ctx.fill()
            ctx.lineWidth = p.borderSize
            ctx.strokeStyle = rgbaToString(pressed ? p.pressedBorderColor : p.borderColor)
            ctx.stroke()

            // Children are drawn relative to the parent's coordinate space
            drawWidget(ctx, p.label, store, pressed)
            drawWidget(ctx, p.countWidget, store, pressed)
        },
        onGlobalKeyDown(w, code, store) {
            if (w.props.keyBinding === code) {
                const id = w.props.countWidget.id
                store.setRuntimeState(id, (store.getRuntimeState<number>(id) ?? 0) + 1)
            }
        },
    })

    registerWidget<RainProps>({
        type: "rain",
        displayName: "Rain Generator",
        defaultProps: () => ({
            width: 50, height: 200, speed: 350, keyBinding: 0,
            backgroundColor: {color: '#FFFFFF', alpha: 1},
            borderSize: 0, borderColor: {color: '#FFFFFF', alpha: 1},
            radius: 0
        }),
        draw(ctx, w, store) {
            const p = w.props
            const pressed = store.isKeyPressed(p.keyBinding)

            const rainX = -(p.width / 2)

            let state = rainStates.get(w.id)
            if (!state) {
                state = { bars: [], currentBar: null, wasPressed: false, lastTime: performance.now() }
                rainStates.set(w.id, state)
            }

            // Frame-rate independent movement; clamp dt to survive long pauses (window hidden etc.)
            const now = performance.now()
            const dt = Math.min((now - state.lastTime) / 1000, 0.1)
            state.lastTime = now
            const step = p.speed * dt

            // Press/release edge detection
            if (pressed && !state.wasPressed) {
                const newBar: RainBar = { y: 0, height: 0, isHolding: true }
                state.bars.push(newBar)
                state.currentBar = newBar
            } else if (!pressed && state.wasPressed) {
                if (state.currentBar) {
                    state.currentBar.isHolding = false
                    state.currentBar = null
                }
            }
            state.wasPressed = pressed

            const bars = state.bars
            if (bars.length === 0) return

            const top = -p.height
            ctx.beginPath()
            const useRadius = p.radius > 0 && typeof ctx.roundRect === 'function'

            for (let i = bars.length - 1; i >= 0; i--) {
                const bar = bars[i]!

                if (bar.isHolding) {
                    bar.height += step
                    bar.y = -bar.height
                } else {
                    bar.y -= step
                }

                // Fully above the visible region: swap-remove
                if (bar.y + bar.height < top) {
                    bars[i] = bars[bars.length - 1]!
                    bars.pop()
                    continue
                }

                // Manual clamp to the region instead of ctx.clip()
                // (bars only ever exceed the top edge; bottom is always <= 0)
                const y = Math.max(bar.y, top)
                const h = bar.y + bar.height - y

                if (useRadius) {
                    ctx.roundRect(rainX, y, p.width, h, p.radius)
                } else {
                    ctx.rect(rainX, y, p.width, h)
                }
            }

            if (p.backgroundColor.alpha > 0) {
                ctx.fillStyle = rgbaToString(p.backgroundColor)
                ctx.fill()
            }

            if (p.borderSize > 0 && p.borderColor.alpha > 0) {
                ctx.lineWidth = p.borderSize
                ctx.strokeStyle = rgbaToString(p.borderColor)
                ctx.stroke()
            }
        },
    })
}