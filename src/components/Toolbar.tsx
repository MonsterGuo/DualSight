import { CompareMode } from '../types'
import {
  FadeIcon,
  FitIcon,
  FlickerIcon,
  FullscreenIcon,
  PanelToggleIcon,
  SideBySideIcon,
  SliderModeIcon,
  SwapIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './icons'

interface ToolbarProps {
  mode: CompareMode
  onModeChange: (m: CompareMode) => void
  onToggleSidebar: () => void
  onFit: () => void
  onActualSize: () => void
  onZoom: (factor: number) => void
  onSwap: () => void
  onFullscreen: () => void
}

const MODES: { id: CompareMode; label: string; Icon: typeof FadeIcon }[] = [
  { id: CompareMode.SideBySide, label: 'Side by Side', Icon: SideBySideIcon },
  { id: CompareMode.Slider, label: 'Slider', Icon: SliderModeIcon },
  { id: CompareMode.Fade, label: 'Fade', Icon: FadeIcon },
  { id: CompareMode.Flicker, label: 'Flicker', Icon: FlickerIcon },
]

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-btn text-muted transition-colors hover:bg-white/5 hover:text-ink"
    >
      {children}
    </button>
  )
}

export function Toolbar({
  mode,
  onModeChange,
  onToggleSidebar,
  onFit,
  onActualSize,
  onZoom,
  onSwap,
  onFullscreen,
}: ToolbarProps) {
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
      <IconButton title="Toggle sidebar" onClick={onToggleSidebar}>
        <PanelToggleIcon size={17} />
      </IconButton>

      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 7-4 5 4 5" />
            <path d="m15 7 4 5-4 5" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-ink">DualSight 度视</span>
      </div>

      {/* Mode segmented control */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-app p-1">
        {MODES.map(({ id, label, Icon }) => {
          const active = mode === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onModeChange(id)}
              className="flex h-8 items-center gap-1.5 rounded-btn px-3 text-[12.5px] font-medium transition-colors"
              style={{
                backgroundColor: active ? '#252525' : 'transparent',
                color: active ? '#e8e8e8' : '#999999',
                boxShadow: active ? 'inset 0 0 0 1px #333333' : 'none',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton title="Fit to view" onClick={onFit}>
          <FitIcon size={16} />
        </IconButton>
        <button
          type="button"
          title="Actual size (1:1)"
          onClick={onActualSize}
          className="grid h-8 w-9 place-items-center rounded-btn text-[12px] text-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          1:1
        </button>
        <div className="mx-1 h-4 w-px bg-line" />
        <IconButton title="Zoom out" onClick={() => onZoom(1 / 1.2)}>
          <ZoomOutIcon size={16} />
        </IconButton>
        <IconButton title="Zoom in" onClick={() => onZoom(1.2)}>
          <ZoomInIcon size={16} />
        </IconButton>
        <button
          type="button"
          onClick={onSwap}
          className="ml-2 flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-[#4a4a4a] hover:text-ink"
        >
          <SwapIcon size={14} />
          Swap A↔B
        </button>
        <IconButton title="Fullscreen" onClick={onFullscreen}>
          <FullscreenIcon size={16} />
        </IconButton>
      </div>
    </header>
  )
}
