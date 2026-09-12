import { MediaKind, type MediaSource } from '../types'

let uid = 0
export const makeMediaId = () => `m-${Date.now().toString(36)}-${++uid}`

export function mediaSrc(m: MediaSource): string {
  return typeof m.url === 'string' ? m.url : m.url.src
}

export function mediaFilter(m: MediaSource): string | undefined {
  return typeof m.url === 'object' ? m.url.filter : undefined
}

/** Accept attribute for file pickers. */
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif'
export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,video/x-matroska'

export function kindFromFile(file: File): MediaKind | null {
  if (file.type.startsWith('image/')) return MediaKind.Image
  if (file.type.startsWith('video/')) return MediaKind.Video
  return null
}

function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`))
    img.src = src
  })
}

function loadVideoMeta(src: string, crossOrigin: boolean): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    if (crossOrigin) v.crossOrigin = 'anonymous'
    v.preload = 'metadata'
    v.muted = true
    v.onloadedmetadata = () => resolve(v)
    v.onerror = () => reject(new Error(`Failed to load video: ${src.slice(0, 80)}`))
    v.src = src
  })
}

/** Create a MediaSource from a user-selected File via object URL. */
export async function mediaFromFile(file: File): Promise<MediaSource> {
  const kind = kindFromFile(file)
  if (!kind) throw new Error(`Unsupported file type: ${file.name}`)
  const url = URL.createObjectURL(file)
  try {
    if (kind === MediaKind.Image) {
      const img = await loadImage(url, false)
      return {
        id: makeMediaId(),
        kind,
        url,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        duration: null,
        crossOrigin: false,
      }
    }
    const v = await loadVideoMeta(url, false)
    return {
      id: makeMediaId(),
      kind,
      url,
      name: file.name,
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration || null,
      crossOrigin: false,
    }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

/** Resolve real dimensions for remote example media (declared sizes may be wrong). */
export async function hydrateMediaDimensions(m: MediaSource): Promise<MediaSource> {
  const src = mediaSrc(m)
  if (m.kind === MediaKind.Image) {
    const img = await loadImage(src, m.crossOrigin)
    return { ...m, width: img.naturalWidth, height: img.naturalHeight }
  }
  const v = await loadVideoMeta(src, m.crossOrigin)
  return {
    ...m,
    width: v.videoWidth || m.width,
    height: v.videoHeight || m.height,
    duration: v.duration || m.duration,
  }
}

export function revokeMedia(m: MediaSource | null) {
  if (!m || m.isExample) return
  if (typeof m.url === 'string') URL.revokeObjectURL(m.url)
}
