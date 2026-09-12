/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#1e1e1e',
        panel: '#252525',
        panel2: '#2a2a2a',
        line: '#333333',
        ink: '#e8e8e8',
        muted: '#999999',
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
