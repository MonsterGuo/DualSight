import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** UI display language. */
export enum Lang {
  Zh = 'zh',
  En = 'en',
}

const STORAGE_KEY = 'dualsight.lang'

/** English is the source dictionary; its keys are the canonical key set. */
const en = {
  /* toolbar */
  toggleSidebar: 'Toggle sidebar',
  modeSideBySide: 'Side by Side',
  modeSlider: 'Slider',
  modeFade: 'Fade',
  modeFlicker: 'Flicker',
  fitToView: 'Fit to view',
  actualSize: 'Actual size (1:1)',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  swap: 'Swap A↔B',
  fullscreen: 'Fullscreen',
  language: 'Language',
  switchToZh: 'Switch to Chinese',
  switchToEn: 'Switch to English',
  themeToLight: 'Switch to light theme',
  themeToDark: 'Switch to dark theme',

  /* sidebar */
  media: 'Media',
  options: 'Options',
  syncPanZoom: 'Sync pan & zoom',
  syncCursor: 'Sync with cursor',
  loupeSize: 'Loupe size',
  background: 'Background',
  bgDark: 'Dark',
  bgLight: 'Light',
  bgCheck: 'Check',
  similarity: 'Similarity',
  statsHint: 'Load both files to see stats.',
  statsImagesOnly: 'Similarity analysis is available for images only.',
  statsComputing: 'Computing…',
  diffPixels: 'Different pixels',

  /* media slots */
  kindImage: 'Image',
  kindVideo: 'Video',
  removeSlot: 'Remove {slot}',
  dropHint: 'Drop or click · {first} / {second}',

  /* empty state */
  emptyTitle: 'Drop two files to compare',
  emptyHint:
    'Drag images or videos onto this canvas, or use the sidebar slots to load A and B. Supports PNG, JPG, WebP, MP4, WebM, MOV.',
  exampleImages: 'Example images',
  exampleVideos: 'Example videos',

  /* playback bars */
  play: 'Play',
  pause: 'Pause',
  fadeMix: 'Fade mix',
  flickerInterval: 'Interval',
  speedFast: 'Fast',
  speedMedium: 'Medium',
  speedSlow: 'Slow',
  showA: 'Show A',
  showB: 'Show B',
  back5: 'Back 5 seconds',
  forward5: 'Forward 5 seconds',
  seek: 'Seek',
  mute: 'Mute',
  unmute: 'Unmute',

  /* status bar */
  statusNoMedia: 'No media loaded — drop images or videos to compare',
  statusCursor: 'Cursor {x}, {y} px',
  statusVideo: 'Video comparison',
  statusZoom: 'Zoom {pct}%',
} as const

export type TKey = keyof typeof en

const zh: Record<TKey, string> = {
  /* 工具栏 */
  toggleSidebar: '切换侧边栏',
  modeSideBySide: '并排对比',
  modeSlider: '滑块对比',
  modeFade: '淡入淡出',
  modeFlicker: '闪烁对比',
  fitToView: '适应窗口',
  actualSize: '实际大小 (1:1)',
  zoomOut: '缩小',
  zoomIn: '放大',
  swap: '交换 A↔B',
  fullscreen: '全屏',
  language: '语言',
  switchToZh: '切换为中文',
  switchToEn: '切换为英文',
  themeToLight: '切换到浅色主题',
  themeToDark: '切换到深色主题',

  /* 侧边栏 */
  media: '媒体',
  options: '选项',
  syncPanZoom: '同步平移和缩放',
  syncCursor: '同步放大镜',
  loupeSize: '放大镜尺寸',
  background: '背景',
  bgDark: '深色',
  bgLight: '浅色',
  bgCheck: '棋盘',
  similarity: '相似度',
  statsHint: '载入两个文件后显示统计数据。',
  statsImagesOnly: '相似度分析仅支持图片。',
  statsComputing: '计算中…',
  diffPixels: '差异像素',

  /* 媒体槽位 */
  kindImage: '图片',
  kindVideo: '视频',
  removeSlot: '移除 {slot}',
  dropHint: '拖入或点击 · {first} / {second}',

  /* 空状态 */
  emptyTitle: '拖入两个文件开始对比',
  emptyHint:
    '将图片或视频拖到画布上，或通过侧边栏槽位载入 A 和 B。支持 PNG、JPG、WebP、MP4、WebM、MOV。',
  exampleImages: '示例图片',
  exampleVideos: '示例视频',

  /* 播放控制条 */
  play: '播放',
  pause: '暂停',
  fadeMix: '淡入淡出程度',
  flickerInterval: '间隔',
  speedFast: '快',
  speedMedium: '中',
  speedSlow: '慢',
  showA: '显示 A',
  showB: '显示 B',
  back5: '后退 5 秒',
  forward5: '前进 5 秒',
  seek: '进度',
  mute: '静音',
  unmute: '取消静音',

  /* 状态栏 */
  statusNoMedia: '未载入媒体 — 拖入图片或视频开始对比',
  statusCursor: '光标 {x}, {y} px',
  statusVideo: '视频对比',
  statusZoom: '缩放 {pct}%',
}

const DICTS: Record<Lang, Record<TKey, string>> = {
  [Lang.Zh]: zh,
  [Lang.En]: en,
}

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === Lang.Zh || saved === Lang.En) return saved
  } catch {
    /* localStorage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('zh') ? Lang.Zh : Lang.En
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: TKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore persistence errors */
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === Lang.Zh ? Lang.En : Lang.Zh
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore persistence errors */
      }
      return next
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === Lang.Zh ? 'zh-CN' : 'en'
  }, [lang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: (key, vars) => {
        let str = DICTS[lang][key] ?? key
        if (vars) {
          for (const [name, val] of Object.entries(vars)) {
            str = str.replace(`{${name}}`, String(val))
          }
        }
        return str
      },
    }),
    [lang, setLang, toggleLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
