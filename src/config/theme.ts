// src/theme/theme.ts

export const AppColors = {
  light: {
    primary: '#00539B',
    secondary: '#0077b6',
    text: '#1F2937',
    border: '#ccc',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#EF4444',

    bgBase: '#f8fafc',
    bgSurface: '#ffffff',

    heading: '#2D3B44',
    subheading: '#000000',

    tabSelected: '#3b82f6',
  },
  dark: {
    primary: '#004480',
    secondary: '#007BE5',
    text: '#f3f6f4',
    border: '#ccc',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#EF4444',

    bgBase: '#0E161A',
    bgSurface: '#212A30',

    heading: '#f3f6f4',
    subheading: '#e1e1e1',

    tabSelected: '#007BE5',
  },
  // Brand colors
  primary: '#00539B',
  secondary: '#0077b6',
  text: '#1F2937',
  border: '#ccc',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#EF4444',

  bgBase: '#f8fafc',
  bgSurface: '#ffffff',

  heading: '#2D3B44',
  subheading: '#000000',

  // Component-specific
  tabSelected: '#0076ff',
  tabSelectedBg: 'rgba(0,118,255,0.1)',
  // tabSelectedBg: 'white',
  button: '#0C5D96',
  disabled: '#060505ff',

  // Form
  formLabel: '#7F7F7F',
  formLabelMuted: '#666a7b',

  // Grid
  gridHeader: 'rgba(148, 154, 159, 0.44)',

  // Utility
  // utilColor1: '#3ebc5c',
  utilColor1: '#0EA473',
  // utilColor2: '#2d7abc', //'#ffe169',//'#ffec78',//'rgb(123, 91, 199)',//
  utilColor2: '#0076ff', //'#ffe169',//'#ffec78',//'rgb(123, 91, 199)',//
  utilColor3: '#ee4949',
  utilColor4: '#f3c12a',
  utilColor5: '#5bc0de',
  utilColor6: '#e975bd',
  utilColor7: '#9c76f7',
  utilColor8: '#ef8b60',
  utilColor9: '#a5a662',
  utilColor10: '#f78c1e',
  utilGrayTransparent: 'rgba(222,226,230,0.5)',
} as const;

export const AppFonts = {
  regular: 'Manrope-Regular',
  medium: 'Manrope-Medium',
  semiBold: 'Manrope-SemiBold',
  bold: 'Manrope-Bold',
};
