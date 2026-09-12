/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-mist': '#f9f9f9',
        'pure-white': '#ffffff',
        'graphite-ink': '#0d0d0d',
        'mid-ash': '#5d5d5d',
        'hollow': '#8f8f8f',
        'hairline': 'rgba(0, 0, 0, 0.1)',
        'hover-veil': 'rgba(0, 0, 0, 0.05)',
        'ink-press': '#000000',
        'deep-charcoal': 'rgba(0, 0, 0, 0.5)',
        'edge-gray': '#e6e6e6',
        background: '#ffffff',
        foreground: '#0d0d0d',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0d0d0d',
        },
        border: 'rgba(0, 0, 0, 0.1)',
        muted: {
          DEFAULT: '#f9f9f9',
          foreground: '#5d5d5d',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '10px',
        xl: '10px',
        '2xl': '16px',
        full: '9999px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
