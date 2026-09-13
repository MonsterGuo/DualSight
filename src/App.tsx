import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BackgroundKind,
  CompareMode,
  MediaKind,
  MediaTab,
  SlotId,
  type MediaSource,
  type SampleColor,
  type ViewTransform,
} from './types'
import {
  hydrateMediaDimensions,
  mediaFromFile,
  revokeMedia,
} from './lib/media'
import type { MediaElement } from './lib/mediaElement'
import {
  clamp,
  fitContain,
  identityTransform,
  screenToStage,
  stageToNatural,
  zoomAt,
  type Rect,
  type Size,
} from './lib/geometry'
import { computeStats, sampleColor } from './lib/analysis'
import { exampleImagePair, exampleVideoPair } from './lib/examples'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { CanvasStage } from './components/CanvasStage'
import { FadeBar } from './components/FadeBar'
import { FlickerBar } from './components/FlickerBar'
import { VideoBar } from './components/VideoBar'
import { StatusBar } from './components/StatusBar'
import { mediaFilter } from './lib/media'

const MIN_SCALE = 0.1
const MAX_SCALE = 8

interface CursorInfo {
  nat: { x: number; y: number }
  colorA: SampleColor
  colorB: SampleColor
}

export default function App() {
  /* ---------------- core UI state ---------------- */
  const [mode, setMode] = useState<CompareMode>(CompareMode.Slider)
  const [tab, setTab] = useState<MediaTab>(MediaTab.Image)
  const [background, setBackground] = useState<BackgroundKind>(BackgroundKind.Dark)
  const [syncPan, setSyncPan] = useState(true)
  const [syncCursor, setSyncCursor] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dragActive, setDragActive] = useState(false)

  /* ---------------- media state ---------------- */
  const [mediaA, setMediaA] = useState<MediaSource | null>(null)
  const [mediaB, setMediaB] = useState<MediaSource | null>(null)

  /* ---------------- view state ---------------- */
  const [tA, setTA] = useState<ViewTransform>(identityTransform())
  const [tB, setTB] = useState<ViewTransform>(identityTransform())
  const [divider, setDivider] = useState(0.5)
  const [fade, setFade] = useState(0.5)
  const [fadePlaying, setFadePlaying] = useState(false)
  const [flickerSeconds, setFlickerSeconds] = useState(0.5)
  const [flickerPlaying, setFlickerPlaying] = useState(false)
  const [showA, setShowA] = useState(true)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [cursorInfo, setCursorInfo] = useState<CursorInfo | null>(null)
  const [stats, setStats] = useState<ReturnType<typeof computeStats>>(null)

  /* ---------------- video state ---------------- */
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoTime, setVideoTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(1)

  /* ---------------- dom refs ---------------- */
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState<Size>({ w: 0, h: 0 })
  const pickerRef = useRef<HTMLInputElement>(null)
  // Media elements live in a ref; elTick only bumps when attachment truthiness
  // changes, so ref callbacks can never trigger render loops.
  const elsRef = useRef<{
    [SlotId.A]: MediaElement | null
    [SlotId.B]: MediaElement | null
  }>({ [SlotId.A]: null, [SlotId.B]: null })
  const [elTick, setElTick] = useState(0)
  const elements = elsRef.current

  const bothLoaded = !!mediaA && !!mediaB
  const bothImages = mediaA?.kind === MediaKind.Image && mediaB?.kind === MediaKind.Image
  const bothVideos = mediaA?.kind === MediaKind.Video && mediaB?.kind === MediaKind.Video

  /* ---------------- stage sizing ---------------- */
  // Measure synchronously on mount (ResizeObserver's initial callback can be
  // delayed/throttled in background tabs), then keep tracking resizes.
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = (w?: number, h?: number) => {
      const r =
        w !== undefined && h !== undefined
          ? { width: w, height: h }
          : el.getBoundingClientRect()
      setStageSize((prev) =>
        Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height },
      )
    }
    measure()
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      measure(r.width, r.height)
    })
    ro.observe(el)
    window.addEventListener('resize', handleWindowResize)
    function handleWindowResize() {
      measure()
    }
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  const fit: Rect = useMemo(() => {
    if (!bothLoaded || stageSize.w < 10) return { x: 0, y: 0, w: 0, h: 0 }
    const union = {
      w: Math.max(mediaA!.width || 1, mediaB!.width || 1),
      h: Math.max(mediaA!.height || 1, mediaB!.height || 1),
    }
    return fitContain(union, stageSize)
  }, [bothLoaded, mediaA, mediaB, stageSize])

  /** Side by Side: each pane contains the full media (fixed 50/50 split). */
  const fitSbs: Rect = useMemo(() => {
    if (!bothLoaded || stageSize.w < 10) return { x: 0, y: 0, w: 0, h: 0 }
    const union = {
      w: Math.max(mediaA!.width || 1, mediaB!.width || 1),
      h: Math.max(mediaA!.height || 1, mediaB!.height || 1),
    }
    return fitContain(union, { w: stageSize.w / 2, h: stageSize.h })
  }, [bothLoaded, mediaA, mediaB, stageSize])

  /* ---------------- media helpers ---------------- */
  const resetView = useCallback(() => {
    setTA(identityTransform())
    setTB(identityTransform())
    setDivider(0.5)
    setCursor(null)
    setCursorInfo(null)
    setFade(0.5)
    setFadePlaying(false)
    setFlickerPlaying(false)
    setShowA(true)
    setVideoPlaying(false)
    setVideoTime(0)
    setVideoDuration(0)
  }, [])

  const setSlotMedia = useCallback(
    (slot: SlotId, m: MediaSource | null) => {
      if (slot === SlotId.A) {
        setMediaA((prev) => {
          revokeMedia(prev)
          return m
        })
      } else {
        setMediaB((prev) => {
          revokeMedia(prev)
          return m
        })
      }
      resetView()
    },
    [resetView],
  )

  const clearSlot = useCallback(
    (slot: SlotId) => {
      if (elsRef.current[slot]) {
        elsRef.current[slot] = null
        setElTick((t) => t + 1)
      }
      setSlotMedia(slot, null)
    },
    [setSlotMedia],
  )

  const ingestFiles = useCallback(
    async (preferred: SlotId, files: FileList | File[]) => {
      const list = Array.from(files).slice(0, 2)
      if (!list.length) return
      try {
        const loaded = await Promise.all(list.map((f) => mediaFromFile(f)))
        const second = preferred === SlotId.A ? SlotId.B : SlotId.A
        setSlotMedia(preferred, loaded[0])
        if (loaded[1]) setSlotMedia(second, loaded[1])
      } catch (e) {
        console.error(e)
      }
    },
    [setSlotMedia],
  )

  const openPicker = useCallback(() => {
    if (!pickerRef.current) return
    pickerRef.current.value = ''
    pickerRef.current.click()
  }, [])

  /* ---------------- global drag & drop ---------------- */
  useEffect(() => {
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files')
    const onDragEnter = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault()
        setDragActive(true)
      }
    }
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault()
    }
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragActive(false)
    }
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      setDragActive(false)
      const slotEl = (e.target as HTMLElement | null)?.closest('[data-drop-slot]')
      let preferred = SlotId.A
      if (slotEl?.getAttribute('data-drop-slot') === SlotId.B) preferred = SlotId.B
      else if (!mediaA) preferred = SlotId.A
      else if (!mediaB) preferred = SlotId.B
      if (e.dataTransfer?.files?.length) void ingestFiles(preferred, e.dataTransfer.files)
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [ingestFiles, mediaA, mediaB])

  /* revoke object URLs on unmount */
  useEffect(() => {
    return () => {
      revokeMedia(mediaA)
      revokeMedia(mediaB)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------- examples ---------------- */
  const loadExamples = useCallback(
    async (kind: MediaKind) => {
      const pair =
        kind === MediaKind.Image ? exampleImagePair() : exampleVideoPair()
      setSlotMedia(SlotId.A, null)
      setSlotMedia(SlotId.B, null)
      const [a, b] = await Promise.all(
        [pair.a, pair.b].map(async (m) => {
          try {
            return await hydrateMediaDimensions(m)
          } catch {
            return m
          }
        }),
      )
      setSlotMedia(SlotId.A, a)
      setSlotMedia(SlotId.B, b)
      if (kind === MediaKind.Video) setTab(MediaTab.Video)
      else setTab(MediaTab.Image)
    },
    [setSlotMedia],
  )

  /* ---------------- element registry ---------------- */
  const registerEl = useCallback((slot: SlotId, el: MediaElement | null) => {
    const prev = elsRef.current[slot]
    if (prev === el) return
    elsRef.current[slot] = el
    if (!!prev !== !!el || (el && prev && el.tagName !== prev.tagName)) {
      setElTick((t) => t + 1)
    }
  }, [])

  /* ---------------- similarity stats ---------------- */
  useEffect(() => {
    if (!bothLoaded || !bothImages) {
      setStats(null)
      return
    }
    setStats(null)
    let cancelled = false
    let tries = 0
    const id = window.setInterval(() => {
      tries++
      const a = elements[SlotId.A] as HTMLImageElement | null
      const b = elements[SlotId.B] as HTMLImageElement | null
      const ready =
        a && b && a.tagName === 'IMG' && b.tagName === 'IMG' && a.complete && b.complete
      if (ready && mediaA && mediaB) {
        const s = computeStats(mediaA, mediaB, a, b)
        if (!cancelled) {
          setStats(s)
          window.clearInterval(id)
        }
      } else if (tries > 75) {
        window.clearInterval(id)
      }
    }, 200)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothLoaded, bothImages, mediaA, mediaB, elTick])

  /* ---------------- video playback control ---------------- */
  const videoA = bothVideos ? (elements[SlotId.A] as HTMLVideoElement | null) : null
  const videoB = bothVideos ? (elements[SlotId.B] as HTMLVideoElement | null) : null

  // True while the progress bar is being dragged; suppresses corrective
  // re-seeks in the sync loop (they would fight the user's seeks).
  const scrubbingRef = useRef(false)
  // Timestamp of the last programmatic seek issued to B, used to throttle
  // B seeks during scrubbing so its decoder is not flooded.
  const lastBSeekRef = useRef(0)
  // When > 0, B has been stuck "seeking" since this timestamp; a single
  // corrective seek is allowed as a watchdog recovery.
  const bSeekStallSinceRef = useRef(0)

  useEffect(() => {
    if (!bothVideos || !videoA || !videoB) return
    let cancelled = false
    const apply = async () => {
      // B stays silent; A is the audible master
      videoB.muted = true
      videoA.muted = muted
      videoA.volume = clamp(volume, 0, 1)
      if (videoPlaying) {
        try {
          // Start both together; Promise.all avoids delaying B until A
          // finishes its play() promise.
          await Promise.all([videoA.play(), videoB.play()])
        } catch {
          if (!cancelled) setVideoPlaying(false)
        }
      } else {
        videoA.pause()
        videoB.pause()
      }
    }
    void apply()
    return () => {
      cancelled = true
    }
  }, [bothVideos, videoA, videoB, videoPlaying, muted, volume, mediaA, mediaB])

  useEffect(() => {
    if (!bothVideos || !videoA) return
    const onMeta = () => setVideoDuration(videoA.duration || 0)
    const onEnded = () => {
      setVideoPlaying(false)
      setVideoTime(videoA.duration || 0)
    }
    videoA.addEventListener('loadedmetadata', onMeta)
    videoA.addEventListener('ended', onEnded)
    if (Number.isFinite(videoA.duration) && videoA.duration > 0) onMeta()
    return () => {
      videoA.removeEventListener('loadedmetadata', onMeta)
      videoA.removeEventListener('ended', onEnded)
    }
  }, [bothVideos, videoA])

  useEffect(() => {
    if (!bothVideos || !videoPlaying || !videoA || !videoB) return
    let raf = 0
    let lastUi = 0
    const loop = (ts: number) => {
      const aSeeking = videoA.seeking
      const bSeeking = videoB.seeking
      const drift = Math.abs(videoA.currentTime - videoB.currentTime)

      if (bSeeking) {
        // Watchdog: if B stays in "seeking" for too long (its seek queue
        // was starved), allow one corrective seek to snap it back.
        if (bSeekStallSinceRef.current === 0) bSeekStallSinceRef.current = ts
        if (ts - bSeekStallSinceRef.current > 1500) {
          videoB.currentTime = videoA.currentTime
          bSeekStallSinceRef.current = ts + 100000
        }
      } else {
        bSeekStallSinceRef.current = 0
        // Never issue corrective seeks while either video is already
        // seeking: doing so cancels the in-flight seek, and doing it every
        // frame starves B's decoder (frozen picture after rapid scrubbing).
        if (!scrubbingRef.current && !aSeeking && drift > 0.25) {
          videoB.currentTime = videoA.currentTime
        }
      }

      if (ts - lastUi > 120) {
        setVideoTime(videoA.currentTime)
        lastUi = ts
      }
      if (videoA.ended) {
        setVideoPlaying(false)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [bothVideos, videoPlaying, videoA, videoB])

  /** Continuous progress-bar drag: seek A immediately, throttle B. */
  const scrubVideo = useCallback(
    (t: number) => {
      if (!videoA) return
      scrubbingRef.current = true
      const target = clamp(t, 0, videoA.duration || 0)
      videoA.currentTime = target
      setVideoTime(target)
      if (videoB) {
        const now = performance.now()
        if (now - lastBSeekRef.current > 200) {
          videoB.currentTime = target
          lastBSeekRef.current = now
        }
      }
    },
    [videoA, videoB],
  )

  /** Committed seek (scrub release, skip buttons): exact seek on both. */
  const seekBoth = useCallback(
    (t: number) => {
      if (!videoA) return
      scrubbingRef.current = false
      const target = clamp(t, 0, videoA.duration || 0)
      videoA.currentTime = target
      if (videoB) {
        videoB.currentTime = target
        lastBSeekRef.current = performance.now()
      }
      setVideoTime(target)
    },
    [videoA, videoB],
  )

  /* ---------------- mode animations ---------------- */
  // Flicker: switch with visibility (no transition delay).
  useEffect(() => {
    if (mode !== CompareMode.Flicker || !flickerPlaying) return
    const id = window.setInterval(() => setShowA((v) => !v), flickerSeconds * 1000)
    return () => window.clearInterval(id)
  }, [mode, flickerPlaying, flickerSeconds])

  // Fade: ping-pong opacity loop.
  useEffect(() => {
    if (mode !== CompareMode.Fade || !fadePlaying) return
    let raf = 0
    let last = performance.now()
    let dir = fade >= 0.99 ? -1 : 1
    const SPEED = 1 / 1600
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setFade((v) => {
        let n = v + dir * dt * SPEED
        if (n >= 1) {
          n = 1
          dir = -1
        } else if (n <= 0) {
          n = 0
          dir = 1
        }
        return n
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, fadePlaying])

  const handleModeChange = useCallback((m: CompareMode) => {
    setMode(m)
    setFadePlaying(false)
    setFlickerPlaying(false)
  }, [])

  /* ---------------- pan / zoom intents ---------------- */
  const handlePan = useCallback(
    (dx: number, dy: number, slot: SlotId | null) => {
      const apply = (setter: React.Dispatch<React.SetStateAction<ViewTransform>>) =>
        setter((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
      if (mode === CompareMode.SideBySide && !syncPan && slot) {
        if (slot === SlotId.A) apply(setTA)
        else apply(setTB)
      } else {
        apply(setTA)
        apply(setTB)
      }
    },
    [mode, syncPan],
  )

  const handleZoomAt = useCallback(
    (factor: number, x: number, y: number, slot: SlotId | null) => {
      if (stageSize.w < 10) return
      const isSbs = mode === CompareMode.SideBySide
      // Each pane transforms around its own center; convert stage x to the
      // pane-local x first.
      const paneW = isSbs ? stageSize.w / 2 : stageSize.w
      const offsetX = isSbs && x >= stageSize.w / 2 ? stageSize.w / 2 : 0
      const next = (p: ViewTransform) =>
        zoomAt(
          p,
          { w: paneW, h: stageSize.h },
          x - offsetX,
          y,
          clamp(p.scale * factor, MIN_SCALE, MAX_SCALE),
        )
      if (isSbs && !syncPan && slot) {
        if (slot === SlotId.A) setTA(next)
        else setTB(next)
      } else {
        setTA(next)
        setTB(next)
      }
    },
    [mode, syncPan, stageSize],
  )

  const handleFit = useCallback(() => {
    setTA(identityTransform())
    setTB(identityTransform())
  }, [])

  const handleZoomButton = useCallback(
    (factor: number) => {
      // In Side by Side both panes share size, so pane-A center works for both.
      const cx =
        mode === CompareMode.SideBySide ? stageSize.w / 4 : stageSize.w / 2
      handleZoomAt(factor, cx, stageSize.h / 2, null)
    },
    [handleZoomAt, mode, stageSize],
  )

  const handleActualSize = useCallback(() => {
    if (!fit.w || !mediaA) return
    const unionW = Math.max(mediaA.width || 1, mediaB?.width || 1)
    const baseW =
      mode === CompareMode.SideBySide && fitSbs.w ? fitSbs.w : fit.w
    const scale = clamp(unionW / baseW, MIN_SCALE, MAX_SCALE)
    setTA({ x: 0, y: 0, scale })
    setTB({ x: 0, y: 0, scale })
  }, [fit.w, fitSbs.w, mediaA, mediaB, mode])

  /* ---------------- swap ---------------- */
  const handleSwap = useCallback(() => {
    setMediaA(mediaB)
    setMediaB(mediaA)
    setTA(identityTransform())
    setTB(identityTransform())
  }, [mediaA, mediaB])

  /* ---------------- cursor sampling ---------------- */
  useEffect(() => {
    if (!bothLoaded || !cursor || !mediaA || !mediaB || fit.w === 0) {
      setCursorInfo(null)
      return
    }
    // Map pointer -> pane-local coordinates (same logic as the loupe).
    let offset = 0
    let paneW = stageSize.w
    let t = tA
    let fitLocal: Rect = fit
    if (mode === CompareMode.SideBySide) {
      const half = stageSize.w / 2
      const slot = cursor.x < half ? SlotId.A : SlotId.B
      if (slot === SlotId.B) {
        offset = half
        t = syncPan ? tA : tB
      }
      paneW = half
      fitLocal = fitSbs
    }
    const stageP = screenToStage(
      cursor.x - offset,
      cursor.y,
      { w: paneW, h: stageSize.h },
      t,
    )
    const natSize = { w: mediaA.width, h: mediaA.height }
    const nat = stageToNatural(stageP, fitLocal, natSize)
    if (
      nat.x < 0 ||
      nat.y < 0 ||
      nat.x >= mediaA.width ||
      nat.y >= mediaA.height
    ) {
      setCursorInfo(null)
      return
    }
    if (mediaA.kind === MediaKind.Image) {
      setCursorInfo({
        nat,
        colorA: sampleColor(elements[SlotId.A], mediaFilter(mediaA), nat.x, nat.y),
        colorB: sampleColor(elements[SlotId.B], mediaFilter(mediaB), nat.x, nat.y),
      })
    } else {
      setCursorInfo({
        nat,
        colorA: { hex: '——', available: false },
        colorB: { hex: '——', available: false },
      })
    }
  }, [
    bothLoaded,
    cursor,
    mediaA,
    mediaB,
    fit,
    fitSbs,
    mode,
    tA,
    tB,
    syncPan,
    stageSize,
    elTick,
  ])

  /* ---------------- fullscreen ---------------- */
  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }, [])

  const zoomPct = tA.scale * 100

  return (
    <div className="flex h-full flex-col bg-app">
      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onFit={handleFit}
        onActualSize={handleActualSize}
        onZoom={handleZoomButton}
        onSwap={handleSwap}
        onFullscreen={handleFullscreen}
      />

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <Sidebar
            tab={tab}
            onTabChange={setTab}
            mediaA={mediaA}
            mediaB={mediaB}
            onFiles={(slot, files) => void ingestFiles(slot, files)}
            onClear={clearSlot}
            syncPan={syncPan}
            syncCursor={syncCursor}
            onSyncPanChange={setSyncPan}
            onSyncCursorChange={setSyncCursor}
            background={background}
            onBackgroundChange={setBackground}
            stats={stats}
          />
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={stageRef} className="relative min-h-0 flex-1">
            {stageSize.w > 0 && (
              <CanvasStage
                size={stageSize}
                mediaA={mediaA}
                mediaB={mediaB}
                elA={elements[SlotId.A]}
                elB={elements[SlotId.B]}
                mode={mode}
                background={background}
                fit={fit}
                fitSbs={fitSbs}
                tA={tA}
                tB={tB}
                syncPan={syncPan}
                syncCursor={syncCursor}
                divider={divider}
                fade={fade}
                flickerShowA={showA}
                cursor={cursor}
                dragActive={dragActive}
                onCursor={setCursor}
                onPan={handlePan}
                onZoomAt={handleZoomAt}
                onDivider={setDivider}
                onRegisterEl={registerEl}
                onOpenPicker={openPicker}
                onExampleImages={() => void loadExamples(MediaKind.Image)}
                onExampleVideos={() => void loadExamples(MediaKind.Video)}
              />
            )}
          </div>

          {bothLoaded && mode === CompareMode.Fade && (
            <FadeBar
              value={fade}
              onChange={setFade}
              playing={fadePlaying}
              onTogglePlay={() => setFadePlaying((v) => !v)}
            />
          )}
          {bothLoaded && mode === CompareMode.Flicker && (
            <FlickerBar
              seconds={flickerSeconds}
              onSecondsChange={setFlickerSeconds}
              playing={flickerPlaying}
              onTogglePlay={() => setFlickerPlaying((v) => !v)}
              onStep={(slot) => {
                setFlickerPlaying(false)
                setShowA(slot === SlotId.A)
              }}
            />
          )}
          {bothVideos && (
            <VideoBar
              playing={videoPlaying}
              currentTime={videoTime}
              duration={videoDuration}
              muted={muted}
              volume={volume}
              onTogglePlay={() => setVideoPlaying((v) => !v)}
              onSkip={(d) => seekBoth(videoTime + d)}
              onSeek={seekBoth}
              onScrub={scrubVideo}
              onToggleMute={() => setMuted((v) => !v)}
              onVolume={(v) => {
                setVolume(v)
                if (v > 0) setMuted(false)
              }}
            />
          )}
        </main>
      </div>

      <StatusBar
        mediaA={mediaA}
        mediaB={mediaB}
        cursor={cursorInfo?.nat ?? null}
        colorA={cursorInfo?.colorA ?? null}
        colorB={cursorInfo?.colorB ?? null}
        zoomPct={zoomPct}
      />

      <input
        ref={pickerRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            const preferred = !mediaA ? SlotId.A : !mediaB ? SlotId.B : SlotId.A
            void ingestFiles(preferred, e.target.files)
          }
          e.target.value = ''
        }}
      />
    </div>
  )
}
