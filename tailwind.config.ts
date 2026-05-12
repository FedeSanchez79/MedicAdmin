import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        azul: '#1A5CFF',
        'azul-hover': '#1449CC',
        'azul-suave': '#EEF3FF',
        verde: '#16A34A',
        'verde-bg': '#F0FDF4',
        fondo: '#F9FAFB',
        texto: '#111827',
        gris: '#6B7280',
        'gris-claro': '#9CA3AF',
        borde: '#E5E7EB',
        error: '#DC2626',
        'error-bg': '#FEF2F2',
        warning: '#D97706',
        'warning-bg': '#FFFBEB',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
