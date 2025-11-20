export const DOCUMENT_ID_PREFIX = 'doc'

export const CANVAS_ID = 'doodle-canvas'
export const OVERLAY_CONTAINER_ID = 'doodle-overlay'
export const OVERLAY_WRAPPER_ID = 'doodle-overlay-wrapper'
export const OVERLAY_INPUT_ID = 'doodle-overlay-input'
export const SCALE = 2

export const FILL_COLORS = [
  '#E9F7EF', '#EAF6FF', '#FDEDEC', '#FFF9E6', '#EEE',
]

export const STROKE_COLORS = [
  '#27AE60', '#2980B9', '#C0392B', '#F1C40F', '#2c3e50'
]

export const FONT_SIZES = {
  small: {
    size: 13,
    lineHeight: 18.5,
  },
  normal: {
    size: 18,
    lineHeight: 22.5,
  },
  large: {
    size: 25,
    lineHeight: 32,
  }
} as const

export const LINE_HEAD_ICONS = {
  'arrow-start': 'chevron-left',
  'arrow-end': 'chevron-right',
  'circle-end': 'circle',
  'circle-start': 'circle',
  'none-start': 'dash',
  'none-end': 'dash',
} as const
