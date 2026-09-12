import { PauseIcon, PlayIcon } from './icons'

interface FadeBarProps {
  /** 0 = fully A, 1 = fully B */
  value: number
  onChange: (v: number) => void
  playing: boolean
  onTogglePlay: () => void
}

export function FadeBar({ value, onChange, playing, onTogglePlay }: FadeBarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-t border-line bg-app px-4">
      <span className="w-4 text-center text-[12.5px] text-muted">A</span>
      <input
        type="range"
        className="df-range flex-1"
        min={0}
        max={1}
        step={0.001}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="text-[12.5px] text-muted">
        B <span className="ml-1 font-mono text-ink">{Math.round(value * 100)}%</span>
      </span>
      <button
        type="button"
        onClick={onTogglePlay}
        className="ml-2 flex h-8 w-[76px] items-center justify-center gap-1.5 rounded-btn border border-line bg-panel2 text-[12.5px] text-ink/90 transition-colors hover:border-[#4a4a4a]"
      >
        {playing ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
        {playing ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
