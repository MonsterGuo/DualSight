import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** Application color theme. The canvas backdrop behind media is a separate
 *  user setting (BackgroundKind) and is not affected by this. */
export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

const STORAGE_KEY = 'dualsight.theme'

function detectTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === Theme.Light ? Theme.Light : Theme.Dark
  } catch {
    return Theme.Dark
  }
}

interface ThemeValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(detectTheme)

  const apply = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.classList.toggle('light', next === Theme.Light)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore persistence errors */
    }
  }, [])

  const setTheme = useCallback((next: Theme) => apply(next), [apply])

  const toggleTheme = useCallback(
    () => apply(theme === Theme.Dark ? Theme.Light : Theme.Dark),
    [apply, theme],
  )

  // Keep DOM state in sync on mount (the inline boot script already set the
  // class to avoid flashes; this reconciles it with React state).
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === Theme.Light)
  }, [theme])

  const value = useMemo<ThemeValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
