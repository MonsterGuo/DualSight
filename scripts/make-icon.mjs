/*
 * Rasterize the DualSight app icon (build/icon.svg design) into a
 * multi-resolution Windows ICO using only Node built-ins.
 *
 * Design (26x26 user units):
 *   - rounded square, diagonal gradient #2d6aff -> #7b3fff
 *   - two stroked lens circles, a bridge line, two glint dots
 *
 * Pure-JS PNG encoder + 4x supersampled software rasterizer.
 * Usage: node scripts/make-icon.mjs [previewPngPath]
 */
import { deflateSync } from 'node:zlib'
import fs from 'node:fs'

const SIZE = 256
const SS = 4
const HI = SIZE * SS

// ---------- PNG encoder ----------
function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePNG(rgba, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] =8
  ihdr[9] = 6
  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------- design (26-unit space) ----------
const C0 = [0x2d, 0x6a, 0xff]
const C1 = [0x7b, 0x3f, 0xff]
const lens = { x: 8.5, y: 13, r: 5 }
const lensR = { x: 17.5, y: 13, r: 5 }
const STROKE = 1.5
const glints = [{ x: 6.8, y: 11.2, r: 1 }, { x: 15.8, y: 11.2, r: 1 }]

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

// Render at high resolution, return flat RGBA buffer at SIZE.
function rasterize() {
  const hi = Buffer.alloc(HI * HI * 4)
  const scale = HI / 26
  // All SDF math is in design units (26x26 space).
  const center = 13
  const cornerRadius = 6
  const inner = center - cornerRadius

  for (let hy = 0; hy < HI; hy++) {
    for (let hx = 0; hx < HI; hx++) {
      // sample at pixel center in 26-unit coordinates
      const ux = (hx + 0.5) / scale
      const uy = (hy + 0.5) / scale

      // rounded-rect SDF (centered at 13,13)
      const qx = Math.abs(ux - center) - inner
      const qy = Math.abs(uy - center) - inner
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      const sdf = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - cornerRadius
      if (sdf > 0) continue // outside tile, stays transparent

      // diagonal gradient
      const t = Math.max(0, Math.min(1, (ux + uy) / 52))
      let r = C0[0] + (C1[0] - C0[0]) * t
      let g = C0[1] + (C1[1] - C0[1]) * t
      let b = C0[2] + (C1[2] - C0[2]) * t

      // white foreground marks
      let fg = 0
      const ringL = Math.abs(Math.hypot(ux - lens.x, uy - lens.y) - lens.r)
      const ringR = Math.abs(Math.hypot(ux - lensR.x, uy - lensR.y) - lensR.r)
      const bridge = distToSegment(ux, uy, 11, 13, 15, 13)
      const insideStroke = STROKE / 2
      if (ringL <= insideStroke || ringR <= insideStroke || bridge <= insideStroke) fg = 0.9
      for (const gl of glints) {
        if (Math.hypot(ux - gl.x, uy - gl.y) <= gl.r) fg = 0.7
      }
      if (fg > 0) {
        r = r * (1 - fg) + 255 * fg
        g = g * (1 - fg) + 255 * fg
        b = b * (1 - fg) + 255 * fg
      }

      const i = (hy * HI + hx) * 4
      hi[i] = r
      hi[i + 1] = g
      hi[i + 2] = b
      hi[i + 3] = 255
    }
  }

  // Box-downscale HI -> SIZE with premultiplied alpha.
  const out = Buffer.alloc(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let ar = 0, ag = 0, ab = 0, aa = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * HI + (x * SS + sx)) * 4
          const a = hi[i + 3]
          ar += hi[i] * a
          ag += hi[i + 1] * a
          ab += hi[i + 2] * a
          aa += a
        }
      }
      const o = (y * SIZE + x) * 4
      const n = SS * SS
      out[o + 3] = aa / n
      if (aa > 0) {
        out[o] = ar / aa
        out[o + 1] = ag / aa
        out[o + 2] = ab / aa
      }
    }
  }
  return out
}

function downscale(src, factor) {
  const s = SIZE / factor
  const out = Buffer.alloc(s * s * 4)
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let ar = 0, ag = 0, ab = 0, aa = 0
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = ((y * factor + dy) * SIZE + (x * factor + dx)) * 4
          const a = src[i + 3]
          ar += src[i] * a
          ag += src[i + 1] * a
          ab += src[i + 2] * a
          aa += a
        }
      }
      const o = (y * s + x) * 4
      out[o + 3] = aa / (factor * factor)
      if (aa > 0) {
        out[o] = ar / aa
        out[o + 1] = ag / aa
        out[o + 2] = ab / aa
      }
    }
  }
  return encodePNG(out, s, s)
}

const rgba = rasterize()
const png256 = encodePNG(rgba, SIZE, SIZE)

const entries = [
  { size: 256, png: png256 },
  { size: 128, png: downscale(rgba, 2) },
  { size: 64, png: downscale(rgba, 4) },
  { size: 32, png: downscale(rgba, 8) },
  { size: 16, png: downscale(rgba, 16) },
]

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(entries.length, 4)
const dir = Buffer.alloc(16 * entries.length)
let offset = 6 + dir.length
entries.forEach((e, i) => {
  const d = i * 16
  dir[d] = e.size >= 256 ? 0 : e.size
  dir[d + 1] = 0
  dir.writeUInt16LE(1, d + 4)
  dir.writeUInt16LE(32, d + 6)
  dir.writeUInt32LE(e.png.length, d + 8)
  dir.writeUInt32LE(offset, d + 12)
  offset += e.png.length
})
fs.writeFileSync('build/icon.ico', Buffer.concat([header, dir, ...entries.map((e) => e.png)]))
console.log('build/icon.ico written')
if (process.argv[2]) fs.writeFileSync(process.argv[2], png256)
