import { FilmBadgeIcon, PauseIcon, PlayIcon, StepBackIcon, StepFwdIcon, VolumeIcon, VolumeXIcon } from './icons'
import { useI18n } from '../lib/i18n'

interface VideoBarProps {
  playing: boolean
  currentTime: number
  duration: number
  muted: boolean
  volume: number
  onTogglePlay: () => void
  onSkip: (delta: number) => void
  /** Fired continuously while the progress bar is being dragged. */
  onScrub: (t: number) => void
  /** Fired once when a drag/keyboard seek is committed. */
  onSeek: (t: number) => void
  onToggleMute: () => void
  onVolume: (v: number) => void
}

function formatTime(t: number): string {
  if (!Number.isFinite(t) || t < 0) t = 0
  const total = Math.floor(t)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoBar({
  playing,
  currentTime,
  duration,
  muted,
  volume,
  onTogglePlay,
  onSkip,
  onScrub,
  onSeek,
  onToggleMute,
  onVolume,
}: VideoBarProps) {
  const { t } = useI18n()
  const max = duration || 0
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-t border-line bg-panel px-4">
      <span className="flex items-center gap-1 rounded bg-accentB px-1.5 py-[3px] text-[9.5px] font-bold tracking-wide text-black">
        <FilmBadgeIcon size={9} />
        VIDEO
      </span>

      <button
        type="button"
        aria-label={t('back5')}
        onClick={() => onSkip(-5)}
        className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:text-ink"
      >
        <StepBackIcon size={15} />
      </button>

      <button
        type="button"
        aria-label={playing ? t('pause') : t('play')}
        onClick={onTogglePlay}
        className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white transition-transform hover:scale-105"
      >
        {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
      </button>

      <button
        type="button"
        aria-label={t('forward5')}
        onClick={() => onSkip(5)}
        className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:text-ink"
      >
        <StepFwdIcon size={15} />
      </button>

      <span className="w-[88px] font-mono text-[11.5px] text-muted">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <input
        type="range"
        className="df-range flex-1 cursor-pointer"
        min={0}
        max={max}
        step={0.01}
        value={Math.min(currentTime, max)}
        aria-label={t('seek')}
        onChange={(e) => onScrub(parseFloat(e.target.value))}
        onPointerUp={(e) => onSeek(parseFloat((e.target as HTMLInputElement).value))}
        onPointerCancel={(e) => onSeek(parseFloat((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onSeek(parseFloat((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => onSeek(parseFloat((e.target as HTMLInputElement).value))}
        onBlur={(e) => onSeek(parseFloat((e.target as HTMLInputElement).value))}
      />

      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green">
        <span className="h-1.5 w-1.5 rounded-full bg-green" />
        SYNC
      </span>

      <button
        type="button"
        aria-label={muted ? t('unmute') : t('mute')}
        onClick={onToggleMute}
        className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:text-ink"
      >
        {muted ? <VolumeXIcon size={15} /> : <VolumeIcon size={15} />}
      </button>
      <input
        type="range"
        className="df-range w-20"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => onVolume(parseFloat(e.target.value))}
      />
    </div>
  )
}
