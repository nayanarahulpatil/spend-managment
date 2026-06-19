/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1326',
        surface: '#0b1326',
        'surface-dim': '#0b1326',
        'surface-bright': '#31394d',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c1c6d7',
        primary: '#adc7ff',
        'primary-container': '#4a8eff',
        secondary: '#4edea3',
        'secondary-container': '#00a572',
        tertiary: '#ffb95f',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'electric-blue': '#00E0FF',
        'emerald-success': '#10B981',
        'amber-pending': '#F59E0B',
        'ruby-violation': '#EF4444',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'slate-900': '#0F172A',
        'slate-800': '#1E293B',
        'slate-700': '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.125rem' }],   // 13px (was 12px)
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],   // 15px (was 14px)
        base: ['1.0625rem', { lineHeight: '1.625rem' }], // 17px (was 16px)
        lg: ['1.1875rem', { lineHeight: '1.875rem' }],   // 19px (was 18px)
        xl: ['1.375rem', { lineHeight: '2rem' }],        // 22px (was 20px)
        '2xl': ['1.625rem', { lineHeight: '2.25rem' }],  // 26px (was 24px)
        '3xl': ['2rem', { lineHeight: '2.5rem' }],       // 32px (was 30px)
        '4xl': ['2.5rem', { lineHeight: '3rem' }],       // 40px (was 36px)
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
