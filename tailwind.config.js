/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: 'rgb(var(--c-app) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        panel2: 'rgb(var(--c-panel2) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        /* hover overlay: white on dark, black on light */
        wash: 'rgb(var(--c-wash) / <alpha-value>)',
        /* stronger hairline used for hover borders */
        strong: 'rgb(var(--c-strong) / <alpha-value>)',
        /* neutral raised chunk (empty-state tile, badges) */
        chunk: 'rgb(var(--c-chunk) / <alpha-value>)',
        brand: '#4f8cff',
        accentB: '#f0a050',
        green: '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        btn: '6px',
      },
    },
  },
  plugins: [],
}
