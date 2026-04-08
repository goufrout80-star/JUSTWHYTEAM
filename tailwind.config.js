/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base:      'var(--bg-base)',
        surface:   'var(--bg-surface)',
        elevated:  'var(--bg-elevated)',
        sidebar:   'var(--bg-sidebar)',
        accent:    'var(--text-accent)',
        tprimary:  'var(--text-primary)',
        tsecondary:'var(--text-secondary)',
        thint:     'var(--text-hint)',
      },
      borderColor: {
        default: 'var(--border-default)',
        bhover:  'var(--border-hover)',
        bactive: 'var(--border-active)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
