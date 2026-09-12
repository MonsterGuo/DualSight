import { SlotId } from '../types'
import { PauseIcon, PlayIcon, StepBackIcon, StepFwdIcon } from './icons'

interface FlickerBarProps {
  seconds: number
  onSecondsChange: (v: number) => void
  playing: boolean
  onTogglePlay: () => void
  onStep: (slot: SlotId) => void
}

export const FLICKER_MIN = 0.05
export const FLICKER_MAX = 3

function speedLabel(v: number): { text: string; color: string } {
  if (v <= 0.25) return { text: 'Fast', color: '#f0a050' }
  if (v <= 1) return { text: 'Medium', color: '#4f8cff' }
  return { text: 'Slow', color: '#999999' }
}

export function FlickerBar({
  seconds,
  onSecondsChange,
  playing,
  onTogglePlay,
  onStep,
}: FlickerBarProps) {
  const speed = speedLabel(seconds)
  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-t border-line bg-app px-4">
      <span className="text-[12.5px] text-muted">Interval</span>
      <span className="w-14 text-[12.5px] font-semibold" style={{ color: speed.color }}>
        {speed.text}
      </span>
      <input
        type="range"
        className="df-range w-[260px]"
        min={FLICKER_MIN}
        max={FLICKER_MAX}
        step={0.01}
        value={seconds}
        onChange={(e) => onSecondsChange(parseFloat(e.target.value))}
      />
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="df-spin"
            min={FLICKER_MIN}
            max={FLICKER_MAX}
            step={0.01}
            value={seconds.toFixed(2)}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!Number.isNaN(v)) {
                onSecondsChange(Math.min(FLICKER_MAX, Math.max(FLICKER_MIN, v)))
              }
            }}
          />
          <span className="text-[12px] text-muted">s</span>
        </div>
        <button
          type="button"
          aria-label="Show A"
          title="Show A"
          onClick={() => onStep(SlotId.A)}
          className="grid h-8 w-8 place-items-center rounded-btn border border-line bg-panel2 text-muted transition-colors hover:text-ink"
        >
          <StepBackIcon size={13} />
        </button>
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-8 w-[76px] items-center justify-center gap-1.5 rounded-btn border border-line bg-panel2 text-[12.5px] text-ink/90 transition-colors hover:border-[#4a4a4a]"
        >
          {playing ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          aria-label="Show B"
          title="Show B"
          onClick={() => onStep(SlotId.B)}
          className="grid h-8 w-8 place-items-center rounded-btn border border-line bg-panel2 text-muted transition-colors hover:text-ink"
        >
          <StepFwdIcon size={13} />
        </button>
      </div>
    </div>
  )
}
