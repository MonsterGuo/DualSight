import { MediaKind, type MediaSource, type SampleColor } from '../types'

interface StatusBarProps {
  mediaA: MediaSource | null
  mediaB: MediaSource | null
  cursor: { x: number; y: number } | null
  colorA: SampleColor | null
  colorB: SampleColor | null
  zoomPct: number
}

function Swatch({ color }: { color: SampleColor | null }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-[2px] border border-white/25 align-[-2px]"
      style={{ backgroundColor: color?.available ? color.hex : 'transparent' }}
    />
  )
}

export function StatusBar({
  mediaA,
  mediaB,
  cursor,
  colorA,
  colorB,
  zoomPct,
}: StatusBarProps) {
  const bothLoaded = !!mediaA && !!mediaB
  const isVideo = mediaA?.kind === MediaKind.Video || mediaB?.kind === MediaKind.Video

  return (
    <footer className="flex h-8 shrink-0 items-center gap-6 border-t border-line bg-panel px-4 text-[11.5px] text-muted">
      {!bothLoaded ? (
        <span>No media loaded — drop images or videos to compare</span>
      ) : cursor ? (
        <>
          <span className="font-mono">
            Cursor {Math.round(cursor.x)}, {Math.round(cursor.y)} px
          </span>
          {isVideo ? (
            <span>Type Video comparison</span>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                A <Swatch color={colorA} />
                <span className="font-mono">{colorA?.hex ?? '——'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                B <Swatch color={colorB} />
                <span className="font-mono">{colorB?.hex ?? '——'}</span>
              </span>
            </>
          )}
        </>
      ) : (
        <span className="font-mono">Cursor 0, 0 px</span>
      )}

      <span className="ml-auto">{bothLoaded ? `Zoom ${Math.round(zoomPct)}%` : 'DualSight v1.0.2'}</span>
    </footer>
  )
}
