class RGBColor {
    public r: number;
    public g: number;
    public b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    public static fromDataView(buf: DataView): RGBColor {
        return new RGBColor(
            buf.getUint8(0),
            buf.getUint8(1),
            buf.getUint8(2)
        )
    }

    public toDataView(): DataView {
        const dataView = new DataView(new ArrayBuffer(3));
        dataView.setUint8(0, this.r);
        dataView.setUint8(1, this.g);
        dataView.setUint8(2, this.b);
        return dataView;
    }

    public static fromHex(hex: string | number): RGBColor {
        if (typeof hex === "number") {
            hex = this.formatHexString((hex >> 16 & 0xFF), (hex >> 8 & 0xFF), (hex & 0xFF))
        }
        const [r, g, b] = hex.replaceAll(/#|0x/g, "").match(/.{2}/g)!;
        return new RGBColor(
            parseInt(r, 16),
            parseInt(g, 16),
            parseInt(b, 16),
        )
    }

    public toHex(withHash = true): string {
        return `${withHash ? "#" : ""}${RGBColor.formatHexString(this.r, this.g, this.b)}`
    }

    private static formatHexString(r: number, g: number, b: number) {
        return `${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    }
}

export default RGBColor  