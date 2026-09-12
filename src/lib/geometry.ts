import type { ViewTransform } from '../types'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Size {
  w: number
  h: number
}

/** Fit a content box into a container box, preserving aspect ratio. */
export function fitContain(content: Size, container: Size): Rect {
  const scale = Math.min(container.w / content.w, container.h / content.h)
  const w = content.w * scale
  const h = content.h * scale
  return {
    x: (container.w - w) / 2,
    y: (container.h - h) / 2,
    w,
    h,
  }
}

export const identityTransform = (): ViewTransform => ({ x: 0, y: 0, scale: 1 })

/**
 * Convert a client-space point to pre-transform space.
 * Transform is applied with its origin at the center of the viewport.
 */
export function screenToStage(
  clientX: number,
  clientY: number,
  center: Size,
  t: ViewTransform,
): { x: number; y: number } {
  return {
    x: (clientX - center.w / 2) / t.scale + center.w / 2 - t.x,
    y: (clientY - center.h / 2) / t.scale + center.h / 2 - t.y,
  }
}

/**
 * Zoom while keeping the point under the cursor anchored.
 * Returns a new ViewTransform.
 */
export function zoomAt(
  t: ViewTransform,
  center: Size,
  clientX: number,
  clientY: number,
  nextScale: number,
): ViewTransform {
  const dx = clientX - center.w / 2
  const dy = clientY - center.h / 2
  return {
    scale: nextScale,
    x: t.x + dx * (1 / nextScale - 1 / t.scale),
    y: t.y + dy * (1 / nextScale - 1 / t.scale),
  }
}

/** Map a stage-space point to natural media pixel coordinates. */
export function stageToNatural(p: { x: number; y: number }, fit: Rect, nat: Size) {
  return {
    x: ((p.x - fit.x) / fit.w) * nat.w,
    y: ((p.y - fit.y) / fit.h) * nat.h,
  }
}

/** Inverse: natural pixel to stage-space (pre-transform) point. */
export function naturalToStage(nx: number, ny: number, fit: Rect, nat: Size) {
  return {
    x: fit.x + (nx / nat.w) * fit.w,
    y: fit.y + (ny / nat.h) * fit.h,
  }
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function pointInRect(x: number, y: number, r: Rect) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}
