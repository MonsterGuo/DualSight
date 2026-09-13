import { useCallback, useEffect, useRef } from 'react'

import {
  BackgroundKind,
  CompareMode,
  SlotId,
  type MediaSource,
  type ViewTransform,
} from '../types'
import type { MediaElement } from '../lib/mediaElement'
import type { Rect, Size } from '../lib/geometry'
import { clamp, pointInRect, screenToStage } from '../lib/geometry'
import { MediaView } from './MediaView'
import { EmptyState } from './EmptyState'
import { Loupe, type LoupeFrame } from './Loupe'
import { ChevronsIcon, MiniChevronsIcon } from './icons'

interface CanvasStageProps {
  size: Size
  mediaA: MediaSource | null
  mediaB: MediaSource | null
  elA: MediaElement | null
  elB: MediaElement | null
  mode: CompareMode
  background: BackgroundKind
  fit: Rect
  /** Pane-local fit for Side by Side (each pane contains the full media). */
  fitSbs: Rect
  tA: ViewTransform
  tB: ViewTransform
  syncPan: boolean
  syncCursor: boolean
  divider: number
  fade: number
  flickerShowA: boolean
  loupeSize: number
  cursor: { x: number; y: number } | null
  dragActive: boolean
  onCursor: (p: { x: number; y: number } | null) => void
  onPan: (dx: number, dy: number, slot: SlotId | null) => void
  onZoomAt: (factor: number, x: number, y: number, slot: SlotId | null) => void
  onDivider: (v: number) => void
  onRegisterEl: (slot: SlotId, el: MediaElement | null) => void
  onOpenPicker: () => void
  onExampleImages: () => void
  onExampleVideos: () => void
}

const BG_STYLE: Record<BackgroundKind, React.CSSProperties> = {
  [BackgroundKind.Dark]: { backgroundColor: '#1e1e1e' },
  [BackgroundKind.Light]: { backgroundColor: '#f2f2f2' },
  [BackgroundKind.Checker]: {},
}

function Badge({ label, style }: { label: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="pointer-events-none absolute z-20 grid h-[22px] min-w-[22px] place-items-center rounded-md bg-black/80 px-1.5 text-[12px] font-bold text-white"
      style={style}
    >
      {label}
    </div>
  )
}

export function CanvasStage(props: CanvasStageProps) {
  const {
    size,
    mediaA,
    mediaB,
    elA,
    elB,
    mode,
    background,
    fit,
    fitSbs,
    tA,
    tB,
    syncPan,
    syncCursor,
    divider,
    fade,
    flickerShowA,
    loupeSize,
    cursor,
    dragActive,
    onCursor,
    onPan,
    onZoomAt,
    onDivider,
    onRegisterEl,
    onOpenPicker,
    onExampleImages,
    onExampleVideos,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const regA = useCallback(
    (el: MediaElement | null) => onRegisterEl(SlotId.A, el),
    [onRegisterEl],
  )
  const regB = useCallback(
    (el: MediaElement | null) => onRegisterEl(SlotId.B, el),
    [onRegisterEl],
  )
  const dragState = useRef<
    | { type: 'pan'; startX: number; startY: number; slot: SlotId | null }
    | { type: 'divider' }
    | null
  >(null)

  const bothLoaded = !!mediaA && !!mediaB
  // Side by Side is a fixed 50/50 split (no draggable divider); only Slider
  // uses the divider state.
  const splitX = (mode === CompareMode.SideBySide ? 0.5 : divider) * size.w

  /* ---------------- wheel zoom (non-passive) ---------------- */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!bothLoaded) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      let slot: SlotId | null = null
      if (mode === CompareMode.SideBySide && !syncPan) {
        slot = x < size.w / 2 ? SlotId.A : SlotId.B
      }
      onZoomAt(factor, x, y, slot)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [bothLoaded, mode, syncPan, size.w, onZoomAt])

  /* ---------------- pointer interaction ---------------- */
  const localPoint = (e: React.PointerEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const paneAt = (x: number): SlotId => (x < splitX ? SlotId.A : SlotId.B)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!bothLoaded || e.button !== 0) return
    const target = e.target as HTMLElement
    const p = localPoint(e)
    containerRef.current?.setPointerCapture(e.pointerId)
    if (target.closest('[data-action="divider"]')) {
      dragState.current = { type: 'divider' }
      return
    }
    let slot: SlotId | null = null
    if (mode === CompareMode.SideBySide && !syncPan) slot = paneAt(p.x)
    dragState.current = { type: 'pan', startX: p.x, startY: p.y, slot }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const p = localPoint(e)
    const inside = p.x >= 0 && p.y >= 0 && p.x <= size.w && p.y <= size.h
    if (inside) onCursor(p)
    else onCursor(null)

    const drag = dragState.current
    if (!drag) return
    if (drag.type === 'divider') {
      onDivider(clamp(p.x / size.w, 0.03, 0.97))
    } else {
      onPan(p.x - drag.startX, p.y - drag.startY, drag.slot)
      drag.startX = p.x
      drag.startY = p.y
    }
  }

  const endDrag = () => {
    dragState.current = null
  }

  /* ---------------- stage building blocks ---------------- */
  const mediaBox = (
    slot: SlotId,
    media: MediaSource,
    box: Rect,
    left: number,
  ): React.ReactNode => (
    <div
      className="absolute"
      style={{ left, top: box.y, width: box.w, height: box.h }}
    >
      <MediaView media={media} registerRef={slot === SlotId.A ? regA : regB} muted />
    </div>
  )

  const transformedLayer = (
    t: ViewTransform,
    originX: number,
    children: React.ReactNode,
    extraStyle: React.CSSProperties = {},
  ) => (
    <div
      className="absolute inset-0"
      style={{
        transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
        transformOrigin: `${originX}px ${size.h / 2}px`,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  )

  /* ---------------- loupe geometry ---------------- */
  let loupe: React.ReactNode = null
  if (bothLoaded && syncCursor && cursor && mediaA && mediaB) {
    let offset = 0
    let paneW = size.w
    let t = tA
    let fitLocal = fit
    if (mode === CompareMode.SideBySide) {
      const slot = paneAt(cursor.x)
      if (slot === SlotId.B) {
        offset = splitX
        t = syncPan ? tA : tB
      } else {
        t = tA
      }
      paneW = slot === SlotId.A ? splitX : size.w - splitX
      fitLocal = fitSbs
    }
    const localX = cursor.x - offset
    const stageP = screenToStage(localX, cursor.y, { w: paneW, h: size.h }, t)
    if (pointInRect(stageP.x, stageP.y, fitLocal)) {
      const originX = (fitLocal.x - paneW / 2) * t.scale + paneW / 2 + t.x
      const originY = (fitLocal.y - size.h / 2) * t.scale + size.h / 2 + t.y
      const frame: LoupeFrame = {
        px: localX - originX,
        py: cursor.y - originY,
        renderedW: fitLocal.w * t.scale,
        renderedH: fitLocal.h * t.scale,
      }
      const half = loupeSize / 2
      const lx = clamp(cursor.x + 18, half + 8, size.w - half - 8)
      const ly = clamp(cursor.y + 18, half + 8, size.h - half - 8)
      loupe = (
        <Loupe
          size={loupeSize}
          x={lx}
          y={ly}
          frameA={frame}
          frameB={frame}
          elA={elA}
          elB={elB}
          mediaA={mediaA}
          mediaB={mediaB}
        />
      )
    }
  }

  const cursorStyle = dragState.current?.type === 'divider' ? 'col-resize' : 'grab'

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${
        bothLoaded && background === BackgroundKind.Checker ? 'bg-checker' : ''
      } ${dragActive ? 'ring-2 ring-inset ring-brand/60' : ''}`}
      style={{
        // The Dark/Light/Checker backdrop only applies behind loaded media;
        // before that the stage follows the application chrome (theme).
        ...(bothLoaded ? BG_STYLE[background] : {}),
        cursor: bothLoaded ? cursorStyle : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => onCursor(null)}
      onClick={(e) => {
        if (!bothLoaded && !(e.target as HTMLElement).closest('button')) onOpenPicker()
      }}
    >
      {!bothLoaded ? (
        <EmptyState onExampleImages={onExampleImages} onExampleVideos={onExampleVideos} />
      ) : (
        <>
          {/*
            Layers A and B stay mounted in fixed tree positions across all
            modes — only clip/opacity/visibility change per mode. This keeps
            the <video> elements alive so playback position survives mode
            switches instead of resetting to the first frame.
          */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={
              mode === CompareMode.SideBySide
                ? { clipPath: `inset(0 ${size.w - splitX}px 0 0)` }
                : undefined
            }
          >
            {transformedLayer(
              tA,
              mode === CompareMode.SideBySide ? splitX / 2 : size.w / 2,
              mediaBox(
                SlotId.A,
                mediaA!,
                mode === CompareMode.SideBySide ? fitSbs : fit,
                mode === CompareMode.SideBySide ? fitSbs.x : fit.x,
              ),
            )}
          </div>
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath:
                mode === CompareMode.SideBySide
                  ? `inset(0 0 0 ${splitX}px)`
                  : mode === CompareMode.Slider
                    ? `inset(0 0 0 ${divider * 100}%)`
                    : undefined,
              opacity: mode === CompareMode.Fade ? fade : 1,
              visibility:
                mode === CompareMode.Flicker && flickerShowA ? 'hidden' : 'visible',
            }}
          >
            {transformedLayer(
              mode === CompareMode.SideBySide ? (syncPan ? tA : tB) : tA,
              mode === CompareMode.SideBySide
                ? splitX + (size.w - splitX) / 2
                : size.w / 2,
              mediaBox(
                SlotId.B,
                mediaB!,
                mode === CompareMode.SideBySide ? fitSbs : fit,
                mode === CompareMode.SideBySide ? splitX + fitSbs.x : fit.x,
              ),
            )}
          </div>

          {mode === CompareMode.SideBySide ? (
            <>
              <Badge label="A" style={{ left: 14, top: 12 }} />
              <Badge label="B" style={{ right: 14, top: 12 }} />
              {/* Static visual separator (Side by Side is not draggable) */}
              <div className="pointer-events-none absolute inset-y-0 z-20 -translate-x-1/2" style={{ left: splitX }}>
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#555555]" />
                <div className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-[#2c2c2c]/95 text-muted">
                  <MiniChevronsIcon size={12} />
                </div>
              </div>
            </>
          ) : mode === CompareMode.Slider ? (
            <>
              <Badge label="A" style={{ left: 14, top: 12 }} />
              <Badge label="B" style={{ right: 14, top: 12 }} />
              <div
                data-action="divider"
                className="absolute inset-y-0 z-20 w-10 -translate-x-1/2 cursor-col-resize"
                style={{ left: splitX }}
              >
                <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/80" />
                <div className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black/70 shadow-lg">
                  <ChevronsIcon size={15} />
                </div>
              </div>
            </>
          ) : mode === CompareMode.Fade ? (
            <Badge label="A → B" style={{ left: 14, top: 12 }} />
          ) : (
            <Badge label={flickerShowA ? 'A' : 'B'} style={{ left: 14, top: 12 }} />
          )}
          {loupe}
        </>
      )}
    </div>
  )
}
