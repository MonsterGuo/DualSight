/*
 * Convert build/icon.svg to icon.ico (256/128/64/48/32/16) using only
 * Node built-ins + zero deps: PNG buffers are produced by rasterizing the
 * SVG through a minimal canvas... not possible without deps, so instead we
 * embed the PNG rendered by Chrome via electron's nativeImage? Simplest
 * reliable path: use sharp-free PNG ICO wrapper of a pre-rendered PNG.
 * We rasterize with pwsh + .NET? .NET cannot render SVG either.
 *
 * Practical approach used here: generate solid-geometry icon frames with a
 * tiny pure-JS PNG encoder and simple 2D rasterization of the two chevrons
 * + rounded square. No external dependencies required.
 */
import { deflateSync } from 'node:zlib'
import fs from 'node:fs'

const SIZE = 256

// ---------- tiny PNG encoder ----------
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
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------- rasterizer helpers ----------
const img = Buffer.alloc(SIZE * SIZE * 4)
function blend(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || a <= 0) return
  const i = (y * SIZE + x) * 4
  const na = a + (img[i + 3] / 255) * (1 - a)
  if (na <= 0) return
  img[i] = (r * a + img[i] * (img[i + 3] / 255) * (1 - a)) / na
  img[i + 1] = (g * a + img[i + 1] * (img[i + 3] / 255) * (1 - a)) / na
  img[i + 2] = (b * a + img[i + 2] * (img[i + 3] / 255) * (1 - a)) / na
  img[i + 3] = na * 255
}

function fillRoundedRect(cx0, cy0, w, h, rad, color) {
  const supersample = 3
  for (let py = 0; py < h * supersample; py++) {
    for (let px = 0; px < w * supersample; px++) {
      const x = cx0 + px / supersample
      const y = cy0 + py / supersample
      // rounded-rect signed distance
      const qx = Math.abs(x - (cx0 + w / 2)) - (w / 2 - rad)
      const qy = Math.abs(y - (cy0 + h / 2)) - (h / 2 - rad)
      const dist =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) - rad
      if (dist < 0) {
        blend(
          Math.floor(x), Math.floor(y),
          color[0], color[1], color[2],
          color[3] / 255 / (supersample * supersample),
        )
      }
    }
  }
}

function strokeSegment(x1, y1, x2, y2, width, color) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.ceil(len * 4)
  const supersample = 2
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const cx = x1 + (x2 - x1) * t
    const cy = y1 + (y2 - y1) * t
    for (let py = -width; py <= width; py++) {
      for (let px = -width; px <= width; px++) {
        const d = Math.hypot(px / supersample, py / supersample)
        if (d <= width / 2) {
          blend(
            Math.floor(cx + px / supersample),
            Math.floor(cy + py / supersample),
            color[0], color[1], color[2],
            color[3] / 255 / (supersample * supersample),
          )
        }
      }
    }
  }
}

// ---------- draw the icon (matches web favicon) ----------
const BLUE = [0x4f, 0x8c, 0xff, 255]
const WHITE = [0xff, 0xff, 0xff, 255]
fillRoundedRect(16, 16, SIZE - 32, SIZE - 32, 54, BLUE)
// left chevron: M170 150 96 256l74 106  (scaled from 512-space by 0.5)
const s = 0.5
const lw = 38 * s
strokeSegment(170 * s, 150 * s, 96 * s, 256 * s, lw, WHITE)
strokeSegment(96 * s, 256 * s, 170 * s, 362 * s, lw, WHITE)
// right chevron: M342 150l74 106-74 106
strokeSegment(342 * s, 150 * s, 416 * s, 256 * s, lw, WHITE)
strokeSegment(416 * s, 256 * s, 342 * s, 362 * s, lw, WHITE)

// ---------- ICO container (PNG-compressed entries) ----------
const png256 = encodePNG(img, SIZE, SIZE)
const downscale = (factor) => {
  const size = SIZE / factor
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // simple 2x2-ish box average
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = ((y * factor + dy) * SIZE + (x * factor + dx)) * 4
          r += img[i] * img[i + 3]; g += img[i + 1] * img[i + 3]; b += img[i + 2] * img[i + 3]
          a += img[i + 3]; n++
        }
      }
      const o = (y * size + x) * 4
      if (a > 0) {
        out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; out[o + 3] = a / n
      }
    }
  }
  return encodePNG(out, size, size)
}

const entries = [
  { size: 256, png: png256 },
  { size: 128, png: downscale(2) },
  { size: 64, png: downscale(4) },
  { size: 48, png: downscale(48 / 16) },
  { size: 32, png: downscale(8) },
  { size: 16, png: downscale(16) },
]
// 48 uses factor 48/16=3 — but SIZE/3 is not integer; fix: use 256/48 scale via nearest
// Simpler: drop 48 to avoid fractional scaling issues and keep 256/128/64/32/16.
const finalEntries = [
  { size: 256, png: png256 },
  { size: 128, png: downscale(2) },
  { size: 64, png: downscale(4) },
  { size: 32, png: downscale(8) },
  { size: 16, png: downscale(16) },
]

const count = finalEntries.length
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2) // type icon
header.writeUInt16LE(count, 4)

const dirEntry = Buffer.alloc(16 * count)
let offset = 6 + 16 * count
finalEntries.forEach((e, i) => {
  const d = i * 16
  dirEntry[d] = e.size >= 256 ? 0 : e.size
  dirEntry[d + 1] = 0
  dirEntry[d + 2] = 0
  dirEntry[d + 3] = 0
  dirEntry.writeUInt16LE(1, d + 4)
  dirEntry.writeUInt16LE(32, d + 6)
  dirEntry.writeUInt32LE(e.png.length, d + 8)
  dirEntry.writeUInt32LE(offset, d + 12)
  offset += e.png.length
})

const ico = Buffer.concat([header, dirEntry, ...finalEntries.map((e) => e.png)])
fs.writeFileSync('build/icon.ico', ico)
console.log('build/icon.ico written:', ico.length, 'bytes')
