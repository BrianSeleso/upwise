export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0A1128',
        panel: '#111B3A',
        line: '#22325F',
        volt: '#2E6BFF',
        lime: '#B6FF3C',
        limeSoft: '#D9FF8A',
        mist: '#F4F6FF',
        dim: '#8E9CC4',
      },
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      backgroundImage: {
        'grad-ink': 'linear-gradient(135deg, #0A1128 0%, #111B3A 50%, #0A1128 100%)',
        'grad-volt': 'linear-gradient(135deg, #2E6BFF 0%, #7A5CFF 100%)',
        'grad-lime': 'linear-gradient(135deg, #B6FF3C 0%, #6EE7B7 100%)',
        'grad-aurora':
          'radial-gradient(60% 60% at 20% 10%, rgba(46,107,255,0.35) 0%, transparent 60%), radial-gradient(50% 50% at 90% 90%, rgba(182,255,60,0.18) 0%, transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(182,255,60,0.25), 0 8px 32px -8px rgba(46,107,255,0.45)',
        'glow-lime': '0 0 0 1px rgba(182,255,60,0.4), 0 8px 32px -8px rgba(182,255,60,0.35)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        fadeIn: 'fadeIn .4s ease-out',
      },
    },
  },
}