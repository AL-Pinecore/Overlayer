import type { RGBA } from '~/models/Color'

export interface OverlayStoreContext {
    isKeyPressed: (keyCode: number) => boolean
    getCurrentKPS: () => number
}

interface WidgetBase {
    id: string
    x: number
    y: number
    rotation: number
    zIndex: number
    isVisible: boolean
}

export interface TextWidget extends WidgetBase {
    type: 'text'
    content: string
    font: string
    fontSize: number
    color: RGBA
}

export interface KeyTextWidget extends WidgetBase {
    type: 'keyText'
    content: string
    pressedContent: string
    font: string
    fontSize: number
    color: RGBA
    pressedColor: RGBA
}

export interface CountWidget extends WidgetBase {
    type: 'count'
    count: number
    font: string
    fontSize: number
    color: RGBA
    pressedColor: RGBA
}

export interface KeyWidget extends WidgetBase {
    type: 'key'
    width: number
    height: number
    keyBinding: number
    countWidget: CountWidget // relative to parent
    label: KeyTextWidget // relative to parent
    backgroundColor: RGBA
    pressedBackgroundColor: RGBA
    radius: number
    borderSize: number
    borderColor: RGBA
    pressedBorderColor: RGBA
}

export type Widget = TextWidget | KeyTextWidget | CountWidget | KeyWidget

export interface Panel {
    name: string // unique
    isVisible: boolean
    x: number
    y: number
    widgets: Widget[]
}

const baseDefaults = (): WidgetBase => ({
    id: crypto.randomUUID(),
    x: 0, y: 0, rotation: 0, zIndex: 1, isVisible: true,
})

export function createCountWidget(o: Partial<CountWidget> = {}): CountWidget {
    return {
        ...baseDefaults(), type: 'count', count: 0,
        font: '', fontSize: 12,
        pressedColor: { color: '#000000', alpha: 1 },
        color: { color: '#FFFFFF', alpha: 1 },
        ...o,
    }
}

export function createKeyTextWidget(o: Partial<KeyTextWidget> = {}): KeyTextWidget {
    return {
        ...baseDefaults(), type: 'keyText',
        content: '', pressedContent: '', font: '', fontSize: 18,
        pressedColor: { color: '#000000', alpha: 1 },
        color: { color: '#FFFFFF', alpha: 1 },
        ...o,
    }
}

export function createKeyWidget(o: Partial<KeyWidget> = {}): KeyWidget {
    return {
        ...baseDefaults(), type: 'key',
        width: 50, height: 50, keyBinding: 65,
        countWidget: createCountWidget(),
        label: createKeyTextWidget(),
        pressedBackgroundColor: { color: '#FFFFFF', alpha: 0.5 },
        backgroundColor: { color: '#000000', alpha: 0.5 },
        radius: 3, borderSize: 1,
        borderColor: { color: '#FFFFFF', alpha: 1 },
        pressedBorderColor: { color: '#FFFFFF', alpha: 1 },
        ...o,
    }
}

export function createPanel(name: string, o: Partial<Panel> = {}): Panel {
    return { name, isVisible: true, x: 0, y: 0, widgets: [], ...o }
}
