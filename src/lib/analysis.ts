import { mediaFilter } from './media'
import type { MediaSource, SampleColor, SimilarityStats } from '../types'
import type { MediaElement } from './mediaElement'

/** Longest edge of the downscaled analysis buffer. */
const ANALYSIS_SIZE = 256
/** Per-pixel average channel delta above which a pixel counts as "different". */
const DIFF_THRESHOLD = 14

function drawToBuffer(
  source: MediaElement,
  filter: string | undefined,
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  try {
    if (filter) ctx.filter = filter
    ctx.drawImage(source, 0, 0, w, h)
    ctx.filter = 'none'
    return { canvas, ctx }
  } catch {
    return null
  }
}

/**
 * Compute similarity metrics between the two loaded media.
 * Returns null when pixels are not readable (cross-origin, not decoded, video).
 */
export function computeStats(
  mediaA: MediaSource,
  mediaB: MediaSource,
  elA: MediaElement | null,
  elB: MediaElement | null,
): SimilarityStats | null {
  if (!elA || !elB) return null
  const aspect = mediaA.width / mediaA.height || 1
  const w = ANALYSIS_SIZE
  const h = Math.max(2, Math.round(ANALYSIS_SIZE / aspect))
  const bufA = drawToBuffer(elA, mediaFilter(mediaA), w, h)
  const bufB = drawToBuffer(elB, mediaFilter(mediaB), w, h)
  if (!bufA || !bufB) return null

  let dataA: Uint8ClampedArray
  let dataB: Uint8ClampedArray
  try {
    dataA = bufA.ctx.getImageData(0, 0, w, h).data
    dataB = bufB.ctx.getImageData(0, 0, w, h).data
  } catch {
    // Tainted canvas (cross-origin without CORS).
    return null
  }

  let sumSq = 0
  let sumAbs = 0
  let diffCount = 0
  // SSIM accumulators (global, on luma).
  let sx = 0
  let sy = 0
  const lumaA = new Float32Array(w * h)
  const lumaB = new Float32Array(w * h)
  const n = w * h

  for (let i = 0; i < n; i++) {
    const k = i * 4
    const ar = dataA[k]
    const ag = dataA[k + 1]
    const ab = dataA[k + 2]
    const br = dataB[k]
    const bg = dataB[k + 1]
    const bb = dataB[k + 2]
    const dr = ar - br
    const dg = ag - bg
    const db = ab - bb
    sumSq += dr * dr + dg * dg + db * db
    const adr = Math.abs(dr)
    const adg = Math.abs(dg)
    const adb = Math.abs(db)
    sumAbs += adr + adg + adb
    const avg = (adr + adg + adb) / 3
    if (avg > DIFF_THRESHOLD) diffCount++
    const la = 0.2126 * ar + 0.7152 * ag + 0.0722 * ab
    const lb = 0.2126 * br + 0.7152 * bg + 0.0722 * bb
    lumaA[i] = la
    lumaB[i] = lb
    sx += la
    sy += lb
  }

  const mse = sumSq / (n * 3)
  const psnr = mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse)
  const diffPercent = (diffCount / n) * 100
  // Perceptual similarity driven by average channel distance (decoupled from
  // the hard-thresholded "different pixels" count).
  const meanDelta = sumAbs / (n * 3)
  const similarity = Math.max(0, 100 * Math.exp(-meanDelta / 45))

  // Global single-window SSIM on luma channel.
  const mux = sx / n
  const muy = sy / n
  let vx = 0
  let vy = 0
  let cov = 0
  for (let i = 0; i < n; i++) {
    const dax = lumaA[i] - mux
    const day = lumaB[i] - muy
    vx += dax * dax
    vy += day * day
    cov += dax * day
  }
  vx /= n
  vy /= n
  cov /= n
  const c1 = (0.01 * 255) ** 2
  const c2 = (0.03 * 255) ** 2
  const ssim =
    ((2 * mux * muy + c1) * (2 * cov + c2)) /
    ((mux * mux + muy * muy + c1) * (vx + vy + c2))

  return {
    similarity,
    diffPercent,
    psnr,
    ssim: Math.min(1, Math.max(0, ssim)),
    mse,
  }
}

/** Sample a single natural-space pixel. Returns unavailable on tainted canvas. */
export function sampleColor(
  el: MediaElement | null,
  filter: string | undefined,
  nx: number,
  ny: number,
): SampleColor {
  const unavailable: SampleColor = { hex: '——', available: false }
  if (!el) return unavailable
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return unavailable
  try {
    if (filter) ctx.filter = filter
    ctx.drawImage(el, Math.max(0, nx - 0.5), Math.max(0, ny - 0.5), 1, 1, 0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    const hex =
      '#' +
      [d[0], d[1], d[2]]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    return { hex, available: true }
  } catch {
    return unavailable
  }
}
