export function getProgressColor(value: number) {
    // Aseguramos que el valor esté entre 0 y 110
    const val = Math.max(0, Math.min(110, value));

    let r, g, b = 0;

    if (val <= 55) {

        r = Math.floor((val / 55) * 255);
        g = 255;
    } else {

        r = 255;
        g = Math.floor(255 - ((val - 55) / 55) * 255);
    }


    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
