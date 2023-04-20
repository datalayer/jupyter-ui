import { createTheme } from '@mui/material/styles';
import { Direction, ThemeOptions, Theme } from '@mui/system';
import { createBreakpoints, Breakpoints } from '@mui/system';
import createMixins, { Mixins } from '@mui/material/styles/createMixins';
import createPalette, { Palette } from '@mui/material/styles/createPalette';
import createTypography, { Typography } from '@mui/material/styles/createTypography';
import shadows from '@mui/material/styles/shadows';
import { ShapeOptions } from '@mui/system';
import { createSpacing, Spacing } from '@mui/system';
import { Transitions } from '@mui/material/styles';
import { ZIndex } from '@mui/material/styles/zIndex';

// import green from '@mui/material/colors/green';
// import blue from '@mui/material/colors/blue';
import red from '@mui/material/colors/red';
import yellow from '@mui/material/colors/yellow';

// vintage theme taken from Apache ECharts.
import vintage from './vintage.project.json';
const colors = vintage.theme.color;
export const color0 = colors[0];
export const color1 = colors[1];
export const color2 = colors[2];
export const color3 = colors[3];
export const color4 = colors[4];

const white = '#fff';

const direction: Direction = 'ltr';

const breakpoints: Breakpoints = createBreakpoints({
  unit: 'px',
  step: 2,
});

const palette: Palette = createPalette({
//  mode: "dark",
/*
  primary: {
    light: blue.A200,
    main: blue.A400,
    dark: white,
    contrastText: yellow.A400,
    light: '#00acc1',
    light: color0,
    main: '#00acc1',
    main: color1,
    dark: white,
    contrastText: yellow.A400,
    contrastText: color2,
  },
*/
/*
  secondary: {
    light: white,
    main: green.A400,
    dark: white,
    contrastText: blue.A700,
    light: white,
    main: '#4caf50',
    main: color3,
    dark: white,
    contrastText: yellow.A400,
    contrastText: color4,
  },
*/
/*
  error: {
    light: white,
    main: red.A400,
    dark: white,
    contrastText: yellow.A400
  },
*/
  error: {
    light: white,
    main: red.A400,
    dark: white,
    contrastText: yellow.A400
  },
  background: {
    default: white,
    paper: white
  },
});

// const shadows: Shadow = [];

const shape: ShapeOptions = {
  borderRadius: 3,
};

const spacing: Spacing = createSpacing(1);

const transitions: Partial<Transitions> = {};

const typography: Partial<Typography> = createTypography(palette, {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 13, // px
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  // Tell Datalayer what's the font-size on the html element.
  // 16px is the default font-size used by browsers.
  htmlFontSize: 16,
  // Apply the CSS properties to all the variants.
  allVariants: {
    textTransform: 'inherit',
  }
});

const zIndex: Partial<ZIndex> = {};

const mixins: Mixins = createMixins(breakpoints, {});

const components = {
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true, // 'ondulation'
//      borderRadius: 0,
    },
    styleOverrides: {
      root: {
//        borderRadius: 0,
      },
    },
  },
  MuiButton: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
//      root: {
//        borderRadius: 0,
//      },
//      sizeSmall: {
//        // https://github.com/mui-org/material-ui/pull/24253
//        backgroundColor: "red"
//      },
    },
  },
  MuiSwitch: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSlider: {
    defaultProps: {
      size: 'small',
    },
  },
/*
  containedPrimary: {
    color: blue.A700,
    backgroundColor: white,
    '&:hover': {
      backgroundColor: white,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: white,
      },
    }
  }
*/
};

const themeOptions: ThemeOptions = {
  shape: shape,
  breakpoints: breakpoints,
  direction: direction,
  mixins: mixins,
  palette: palette,
  shadows: shadows,
  spacing: spacing,
  transitions: transitions,
  components: components,
  typography: typography,
  zIndex: zIndex,
};

const muiLightTheme: Theme = createTheme(
  themeOptions as any,
);

export default muiLightTheme;
