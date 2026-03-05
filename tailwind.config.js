/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        pixel: ['var(--font-pixel)'],
      },
      colors: {
        /* 新粗野主义色彩系统 */
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          hover: 'var(--bg-hover)',
          active: 'var(--bg-active)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          bright: 'var(--accent-bright)',
          dim: 'var(--accent-dim)',
        },
        border: {
          DEFAULT: 'var(--border)',
          thick: 'var(--border-thick)',
          dim: 'var(--border-dim)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
      },
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      borderRadius: {
        'sm': '2px',
        DEFAULT: 'var(--radius)',
        'lg': 'var(--radius-lg)',
        'none': '0',
      },
      boxShadow: {
        'hard': 'var(--shadow-hard)',
        'hard-white': 'var(--shadow-hard-white)',
        'hard-accent': 'var(--shadow-hard-accent)',
        'hard-lg': '6px 6px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
