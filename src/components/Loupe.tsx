import { useEffect, useRef } from 'react'
import type { MediaSource } from '../types'
import type { MediaElement } from '../lib/mediaElement'
import { mediaFilter } from '../lib/media'

const RADIUS = 70
const SIZE = RADIUS * 2
const ZOOM = 4

export interface LoupeFrame {
  /** Pointer position relative to the rendered media top-left (CSS px). */
  px: number
  py: number
  /** Rendered media size on screen (CSS px). */
  renderedW: number
  renderedH: number
}

interface LoupeProps {
  /** Loupe center in container coordinates. */
  x: number
  y: number
  frameA: LoupeFrame
  frameB: LoupeFrame
  elA: MediaElement | null
  elB: MediaElement | null
  mediaA: MediaSource
  mediaB: MediaSource
}

export function Loupe({ x, y, frameA, frameB, elA, elB, mediaA, mediaB }: LoupeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0

    const drawHalf = (
      el: MediaElement | null,
      filter: string | undefined,
      frame: LoupeFrame,
      clipLeft: boolean,
    ) => {
      if (!el) return
      ctx.save()
      ctx.beginPath()
      if (clipLeft) ctx.rect(0, 0, RADIUS, SIZE)
      else ctx.rect(RADIUS, 0, RADIUS, SIZE)
      ctx.clip()
      if (filter) ctx.filter = filter
      const w = frame.renderedW * ZOOM
      const h = frame.renderedH * ZOOM
      const dx = RADIUS - frame.px * ZOOM
      const dy = RADIUS - frame.py * ZOOM
      try {
        ctx.drawImage(el, dx, dy, w, h)
      } catch {
        /* frame not ready */
      }
      ctx.restore()
    }

    const render = () => {
      ctx.clearRect(0, 0, SIZE, SIZE)
      drawHalf(elA, mediaFilter(mediaA), frameA, true)
      drawHalf(elB, mediaFilter(mediaB), frameB, false)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [elA, elB, frameA.px, frameA.py, frameA.renderedW, frameA.renderedH, frameB.px, frameB.py, frameB.renderedW, frameB.renderedH, mediaA, mediaB])

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: x - RADIUS, top: y - RADIUS, width: SIZE, height: SIZE }}
    >
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="block rounded-full"
        style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 6px 24px rgba(0,0,0,0.55)' }}
      />
      {/* split line */}
      <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-white/70" />
      {/* crosshair */}
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
      {/* 4x badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/65 px-1.5 py-[1px] text-[10px] font-semibold text-white">
        4×
      </div>
    </div>
  )
}
