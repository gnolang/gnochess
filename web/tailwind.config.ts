/** @type {import('tailwindcss').Config} */

// import plugin from "tailwindcss/plugin";
import defaultTheme from 'tailwindcss/defaultTheme';
// eslint-disable-next-line @typescript-eslint/no-var-requires

const pxToRem = (dest: number) => 1 / (16 / dest);

export default {
  content: [
    './layouts/**/*.html',
    './assets/**/*.{js,ts,jsx}',
    './hugo_stats.json'
  ],
  theme: {
    screens: {
      sm: `${pxToRem(400)}rem`,
      md: `${pxToRem(780)}rem`,
      lg: `${pxToRem(1080)}rem`,
      xl: `${pxToRem(1320)}rem`,
      xxl: `${pxToRem(1540)}rem`
    },
    boxShadow: {
      DEFAULT: '0 0 25px -8px rgba(0, 0, 0, .25)',
      sm: '0 0 15px -8px rgba(0, 0, 0, .25)'
    },
    borderRadius: {
      none: '0',
      xs: `${pxToRem(8)}rem`,
      sm: `${pxToRem(10)}rem`,
      md: `${pxToRem(12)}rem`,
      DEFAULT: `${pxToRem(51)}rem`,
      lg: `${pxToRem(67)}rem`,
      xl: `${pxToRem(70)}rem`,
      circle: '100%',
      full: '9999px'
    },
    zIndex: {
      min: '-1',
      1: '1',
      2: '2',
      100: '100',
      max: '999'
    },
    container: {
      center: true,
      padding: {
        sm: `${pxToRem(4)}rem`,
        md: `${pxToRem(8)}rem`,
        lg: `${pxToRem(32)}rem`,
        xl: `${pxToRem(64)}rem`,
        xxl: `${pxToRem(64)}rem`
      }
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      grey: {
        50: 'rgba(255, 255, 255, 1)',
        100: 'rgba(248,248,248,1)',
        150: 'rgba(229,229,229,1)',
        200: 'rgba(217,217,217,1)',
        400: 'rgba(180,180,180,1)',
        600: 'rgba(119,119,119,1)',
        800: 'rgba(29,29,29,1)'
      }
    },
    fontFamily: {
      termina: [
        'Termina',
        'Inter',
        '"Inter var"',
        defaultTheme.fontFamily.sans
      ],
      interVar: ['"Inter var"', defaultTheme.fontFamily.sans],
      interNormal: ['Inter', defaultTheme.fontFamily.sans]
    },

    fontSize: {
      0: '0',
      50: `${pxToRem(8)}rem`,
      100: `${pxToRem(14)}rem`,
      200: `${pxToRem(16)}rem`,
      300: `${pxToRem(21)}rem`,
      400: `${pxToRem(26)}rem`,
      500: `${pxToRem(32)}rem`,
      600: `${pxToRem(38)}rem`,
      700: `${pxToRem(56)}rem`,
      750: `${pxToRem(66)}rem`,
      800: `${pxToRem(76)}rem`,
      900: `${pxToRem(96)}rem`
    },
    extend: {}
  },
  plugins: []
};
