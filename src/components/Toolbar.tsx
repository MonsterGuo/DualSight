import { CompareMode } from '../types'
import { Lang, useI18n, type TKey } from '../lib/i18n'
import { Theme, useTheme } from '../lib/theme'
import {
  FadeIcon,
  FitIcon,
  FlickerIcon,
  FullscreenIcon,
  MoonIcon,
  PanelToggleIcon,
  SideBySideIcon,
  SliderModeIcon,
  SunIcon,
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

const MODES: { id: CompareMode; labelKey: TKey; Icon: typeof FadeIcon }[] = [
  { id: CompareMode.SideBySide, labelKey: 'modeSideBySide', Icon: SideBySideIcon },
  { id: CompareMode.Slider, labelKey: 'modeSlider', Icon: SliderModeIcon },
  { id: CompareMode.Fade, labelKey: 'modeFade', Icon: FadeIcon },
  { id: CompareMode.Flicker, labelKey: 'modeFlicker', Icon: FlickerIcon },
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
      className="grid h-8 w-8 place-items-center rounded-btn text-muted transition-colors hover:bg-wash/5 hover:text-ink"
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
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
      <IconButton title={t('toggleSidebar')} onClick={onToggleSidebar}>
        <PanelToggleIcon size={17} />
      </IconButton>

      <div className="flex items-center gap-2">
        <div
          className="grid h-7 w-7 place-items-center rounded-md"
          style={{ background: 'linear-gradient(135deg, #2d6aff, #7b3fff)' }}
        >
          <svg width="17" height="17" viewBox="0 0 26 26" fill="none">
            <circle cx="8.5" cy="13" r="5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" />
            <circle cx="17.5" cy="13" r="5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" />
            <line x1="11" y1="13" x2="15" y2="13" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="6.8" cy="11.2" r="1" fill="white" fillOpacity="0.7" />
            <circle cx="15.8" cy="11.2" r="1" fill="white" fillOpacity="0.7" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-ink">DualSight 度视</span>
      </div>

      {/* Mode segmented control */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-app p-1">
        {MODES.map(({ id, labelKey, Icon }) => {
          const active = mode === id
          return (
            <button
              key={id}
              type="button"
              title={t(labelKey)}
              onClick={() => onModeChange(id)}
              className="flex h-8 items-center gap-1.5 rounded-btn px-3 text-[12.5px] font-medium transition-colors"
              style={{
                backgroundColor: active ? 'rgb(var(--c-panel))' : 'transparent',
                color: active ? 'rgb(var(--c-ink))' : 'rgb(var(--c-muted))',
                boxShadow: active ? 'inset 0 0 0 1px rgb(var(--c-line))' : 'none',
              }}
            >
              <Icon size={15} />
              {t(labelKey)}
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton title={t('fitToView')} onClick={onFit}>
          <FitIcon size={16} />
        </IconButton>
        <button
          type="button"
          title={t('actualSize')}
          onClick={onActualSize}
          className="grid h-8 w-9 place-items-center rounded-btn text-[12px] text-muted transition-colors hover:bg-wash/5 hover:text-ink"
        >
          1:1
        </button>
        <div className="mx-1 h-4 w-px bg-line" />
        <IconButton title={t('zoomOut')} onClick={() => onZoom(1 / 1.2)}>
          <ZoomOutIcon size={16} />
        </IconButton>
        <IconButton title={t('zoomIn')} onClick={() => onZoom(1.2)}>
          <ZoomInIcon size={16} />
        </IconButton>
        <button
          type="button"
          onClick={onSwap}
          className="ml-2 flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-[12.5px] text-muted transition-colors hover:border-strong hover:text-ink"
        >
          <SwapIcon size={14} />
          {t('swap')}
        </button>
        <IconButton title={t('fullscreen')} onClick={onFullscreen}>
          <FullscreenIcon size={16} />
        </IconButton>

        <div className="mx-1 h-4 w-px bg-line" />

        {/* Language segmented toggle: 中文 / EN */}
        <div
          className="flex h-8 items-center rounded-lg bg-app p-0.5"
          role="group"
          aria-label={t('language')}
        >
          {(
            [
              { id: Lang.Zh, label: '中', title: t('switchToZh') },
              { id: Lang.En, label: 'EN', title: t('switchToEn') },
            ] as const
          ).map(({ id, label, title }) => {
            const active = lang === id
            return (
              <button
                key={id}
                type="button"
                title={title}
                aria-label={title}
                aria-pressed={active}
                onClick={() => setLang(id)}
                className="h-7 w-9 rounded-btn text-[11.5px] font-semibold transition-colors"
                style={{
                  backgroundColor: active ? 'rgb(var(--c-panel))' : 'transparent',
                  color: active ? 'rgb(var(--c-ink))' : 'rgb(var(--c-muted))',
                  boxShadow: active ? 'inset 0 0 0 1px rgb(var(--c-line))' : 'none',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Theme toggle: sun while dark (switch to light), moon while light */}
        <IconButton
          title={theme === Theme.Dark ? t('themeToLight') : t('themeToDark')}
          onClick={toggleTheme}
        >
          {theme === Theme.Dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </IconButton>
      </div>
    </header>
  )
}
