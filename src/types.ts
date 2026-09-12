/** Comparison display modes. */
export enum CompareMode {
  SideBySide = 'side-by-side',
  Slider = 'slider',
  Fade = 'fade',
  Flicker = 'flicker',
}

/** Slot identity. */
export enum SlotId {
  A = 'A',
  B = 'B',
}

/** Media category, derived from file MIME. */
export enum MediaKind {
  Image = 'image',
  Video = 'video',
}

/** Sidebar media tab. */
export enum MediaTab {
  Image = 'IMG',
  Video = 'VID',
}

/** Canvas backdrop behind the compared media. */
export enum BackgroundKind {
  Dark = 'dark',
  Light = 'light',
  Checker = 'checker',
}

export interface MediaSource {
  id: string
  kind: MediaKind
  /** Object URL (local files) or remote URL (examples). */
  url:
    | string
    | {
        src: string
        /** Optional CSS filter applied to emulate an edited variant. */
        filter?: string
      }
  name: string
  width: number
  height: number
  duration: number | null
  /** True when this source must send CORS headers for canvas pixel access. */
  crossOrigin: boolean
  /** Example sources are shared remote URLs and must not be revoked. */
  isExample?: boolean
}

export interface ViewTransform {
  /** Pan offset in CSS pixels relative to the fitted position. */
  x: number
  y: number
  /** Scale multiplier where 1 = fit. */
  scale: number
}

export interface PixelPoint {
  /** Coordinates in natural media pixel space. */
  x: number
  y: number
  /** Pointer position in canvas CSS space. */
  cx: number
  cy: number
  inside: boolean
}

export interface SimilarityStats {
  similarity: number
  diffPercent: number
  psnr: number
  ssim: number
  mse: number
}

export interface SampleColor {
  hex: string
  available: boolean
}
