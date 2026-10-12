/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: '#0B0F19',
          surface: '#111827',
          card: '#131C2E',
          'card-hover': '#1A263D',
          border: '#1E293B',
          'border-light': '#334155',
          text: '#F1F5F9',
          muted: '#94A3B8',
          accent: '#0284C7',
          cyan: '#06B6D4',
        },
        threat: {
          block: '#EF4444',
          sqli: '#EF4444',
          xss: '#F43F5E',
          critical: '#DC2626',
          monitor: '#F59E0B',
          ratelimit: '#F97316',
          warning: '#EAB308',
          allow: '#10B981',
          benign: '#059669',
          safe: '#34D399',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      boxShadow: {
        'glow-red': '0 0 20px -5px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
      }
    },
  },
  plugins: [],
}
