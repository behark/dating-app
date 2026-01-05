/**
 * Theme Constants
 * Centralized theme definitions for layout, spacing, and typography
 * Use these instead of hardcoded strings to avoid duplication warnings
 */

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const LAYOUT = {
  // Flex direction
  ROW: 'row',
  ROW_REVERSE: 'row-reverse',
  COLUMN: 'column',
  COLUMN_REVERSE: 'column-reverse',

  // Alignment
  CENTER: 'center',
  FLEX_START: 'flex-start',
  FLEX_END: 'flex-end',
  STRETCH: 'stretch',
  BASELINE: 'baseline',

  // Justify content
  SPACE_BETWEEN: 'space-between',
  SPACE_AROUND: 'space-around',
  SPACE_EVENLY: 'space-evenly',

  // Position
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',

  // Overflow
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  SCROLL: 'scroll',

  // Flex wrap
  WRAP: 'wrap',
  NO_WRAP: 'nowrap',
  WRAP_REVERSE: 'wrap-reverse',
};

// ============================================
// TEXT ALIGNMENT
// ============================================

export const TEXT_ALIGN = {
  CENTER: 'center',
  LEFT: 'left',
  RIGHT: 'right',
  JUSTIFY: 'justify',
  AUTO: 'auto',
};

// ============================================
// FONT WEIGHTS
// ============================================

export const FONT_WEIGHT = {
  NORMAL: 'normal',
  BOLD: 'bold',
  THIN: '100',
  EXTRA_LIGHT: '200',
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMI_BOLD: '600',
  BOLD_700: '700',
  EXTRA_BOLD: '800',
  BLACK: '900',
};

// ============================================
// SPACING (in pixels)
// ============================================

export const SPACING = {
  NONE: 0,
  XS: 4,
  SM: 8,
  MD: 12,
  BASE: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXXL: 48,
};

// ============================================
// BORDER RADIUS
// ============================================

export const BORDER_RADIUS = {
  NONE: 0,
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  ROUND: 50,
  FULL: 9999,
};

// ============================================
// FONT SIZES
// ============================================

export const FONT_SIZE = {
  XS: 10,
  SM: 12,
  MD: 14,
  BASE: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  DISPLAY: 40,
};

// ============================================
// SHADOW STYLES
// ============================================

export const SHADOW = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============================================
// ICON SIZES
// ============================================

export const ICON_SIZE = {
  XS: 12,
  SM: 16,
  MD: 20,
  BASE: 24,
  LG: 28,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

// ============================================
// COMBINED THEME EXPORT
// ============================================

export const THEME = {
  LAYOUT,
  TEXT_ALIGN,
  FONT_WEIGHT,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  SHADOW,
  ICON_SIZE,
};

export default THEME;
