import {definePreset} from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Custom PrimeNG theme preset extending the Aura base theme.
 *
 * Overrides the default semantic color palette with application-specific colors:
 * - Primary: yellow scale
 * - Secondary: gray scale
 * - Success: green, Info: blue, Warn: orange, Danger: red
 * - Surface: gray scale for backgrounds and card layers
 *
 * Includes a separate dark mode configuration with adjusted primary, secondary,
 * and surface tokens to maintain contrast in dark theme contexts.
 */
export const Preset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{yellow.50}',
      100: '{yellow.100}',
      200: '{yellow.200}',
      300: '{yellow.300}',
      400: '{yellow.400}',
      500: '{yellow.500}',
      600: '{yellow.600}',
      700: '{yellow.700}',
      800: '{yellow.800}',
      900: '{yellow.900}',
      950: '{yellow.950}'
    },
    secondary: {
      50: '{gray.50}',
      100: '{gray.100}',
      200: '{gray.200}',
      300: '{gray.300}',
      400: '{gray.400}',
      500: '{gray.500}',
      600: '{gray.600}',
      700: '{gray.700}',
      800: '{gray.800}',
      900: '{gray.900}',
      950: '{gray.950}'
    },
    success: {
      50: '{green.50}',
      500: '{green.500}',
      900: '{green.900}'
    },
    info: {
      50: '{blue.50}',
      500: '{blue.500}',
      900: '{blue.900}'
    },
    warn: {
      50: '{orange.50}',
      500: '{orange.500}',
      900: '{orange.900}'
    },
    danger: {
      50: '{red.50}',
      500: '{red.500}',
      900: '{red.900}'
    },
    surface: {
      ground: '{gray.50}',
      card: '{gray.100}',
      hover: '{gray.200}',
      0: '{gray.0}',
      100: '{gray.100}',
      200: '{gray.200}',
      300: '{gray.300}',
      400: '{gray.400}',
      500: '{gray.500}',
      600: '{gray.600}',
      700: '{gray.700}',
      800: '{gray.800}',
      900: '{gray.900}'
    }
  },
  dark: {
    semantic: {
      primary: {
        50: '{yellow.100}',
        500: '{yellow.500}',
        900: '{yellow.800}'
      },
      secondary: {
        50: '{gray.800}',
        500: '{gray.700}',
        900: '{gray.950}'
      },
      surface: {
        ground: '{gray.900}',
        card: '{gray.800}',
        hover: '{gray.700}'
      }
    }
  }
});
