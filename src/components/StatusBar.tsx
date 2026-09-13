import { MediaKind, type MediaSource, type SampleColor } from '../types'
import { useI18n } from '../lib/i18n'

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
      className="inline-block h-2.5 w-2.5 rounded-[2px] border border-wash/25 align-[-2px]"
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
  const { t } = useI18n()
  const bothLoaded = !!mediaA && !!mediaB
  const isVideo = mediaA?.kind === MediaKind.Video || mediaB?.kind === MediaKind.Video

  return (
    <footer className="flex h-8 shrink-0 items-center gap-6 border-t border-line bg-panel px-4 text-[11.5px] text-muted">
      {!bothLoaded ? (
        <span>{t('statusNoMedia')}</span>
      ) : cursor ? (
        <>
          <span className="font-mono">
            {t('statusCursor', { x: Math.round(cursor.x), y: Math.round(cursor.y) })}
          </span>
          {isVideo ? (
            <span>{t('statusVideo')}</span>
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
        <span className="font-mono">{t('statusCursor', { x: 0, y: 0 })}</span>
      )}

      <span className="ml-auto">
        {bothLoaded ? t('statusZoom', { pct: Math.round(zoomPct) }) : 'DualSight v1.0.3'}
      </span>
    </footer>
  )
}
