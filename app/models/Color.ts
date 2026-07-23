export type RGBA = {
    color: string, // #RRGGBB in hex
    alpha: number // 0-1
}

export function rgbaToString(rgba: RGBA): string {
    let hex = rgba.color.replace('#', '');

    if (hex.length === 3) {
        hex = hex.split('').map((char) => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    return `rgba(${r}, ${g}, ${b}, ${rgba.alpha})`;
}