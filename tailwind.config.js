/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #1E88E5)',
          hover: 'var(--color-primary-hover, #42A5F5)',
          active: 'var(--color-primary-active, #1565C0)',
          light: 'var(--color-primary-light, #E3F2FD)',
        },
        success: 'var(--color-success, #26A69A)',
        warning: 'var(--color-warning, #FF9800)',
        error: 'var(--color-error, #FF5252)',
        info: 'var(--color-info, #42A5F5)',
        destructive: {
          DEFAULT: 'var(--destructive, #FF5252)',
          foreground: 'var(--destructive-foreground, #ffffff)',
        },
        border: 'var(--border, #e0e0e0)',
        input: 'var(--input, #e0e0e0)',
        ring: 'var(--ring, #1E88E5)',
      },
      borderRadius: {
        sm: '4px',
        base: '6px',
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUpIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDownIn: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeftIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRightIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s cubic-bezier(0, 0, 0.2, 1) forwards',
        slideUp: 'slideUpIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        slideDown: 'slideDownIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        slideLeft: 'slideLeftIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        slideRight: 'slideRightIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        zoomIn: 'zoomIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        bounceIn: 'bounceIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
      },
    },
  },
  plugins: [],
}
