/*
 * Type declaration for watermark-svg.mjs. The .mjs is plain JavaScript so
 * the batch script (scripts/process-images.mjs) can import it without the
 * TypeScript compiler. This .d.ts is the header the .ts files type-check against.
 * watermarkSvg returns SVG bytes whose letters are outlines, not font references.
 * applyWatermark draws that mark over a JPEG and returns the marked JPEG.
 * markDifference measures how much the mark changed the band it sits in.
 */
export function watermarkSvg(credit: string, width: number, height: number): Buffer;
export function applyWatermark(plain: Buffer, credit: string): Promise<Buffer>;
export function markDifference(plain: Buffer, marked: Buffer): Promise<number>;
