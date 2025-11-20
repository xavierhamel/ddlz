import type { ItemProps, Item } from './item'
import type { Bounding } from './utils'

export const TOP_LEFT = 0
export const TOP_RIGHT = 1
export const BOTTOM_RIGHT = 2
export const BOTTOM_LEFT = 3

export const PADDING = 4.5
export const SIZE = 10
const COLOR = '#16a085'

export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export function render(context: CanvasRenderingContext2D, item: Item) {
  const props = item.toSerializable()
  if (props.type === 'shape') {
    renderShape(context, props)
  } else if (props.type === 'line') {
    renderLine(context, props)
  }
}

function renderLine(context: CanvasRenderingContext2D, props: ItemProps) {
  if (props.type !== 'line') {
    throw new Error('Rendering controls shape should only render for shape')
  }
  for (const point of props.points) {
    renderCorner(context, point.x + PADDING, point.y + PADDING)
  }
}

export function renderRect(context: CanvasRenderingContext2D, bounding: Bounding, dash: boolean = false) {
  const { position, size } = bounding
  context.beginPath()
  if (dash) {
    context.setLineDash([3, 3])
  }
  context.roundRect(position.x - PADDING, position.y - PADDING, size.width + PADDING * 2, size.height + PADDING * 2, 0)
  context.strokeStyle = COLOR
  context.lineWidth = 1
  context.stroke()
  context.setLineDash([])
}

function renderShape(context: CanvasRenderingContext2D, props: ItemProps) {
  if (props.type !== 'shape') {
    throw new Error('Rendering controls shape should only render for shape')
  }
  const { position, size } = props
  renderRect(context, props)
  context.translate(position.x, position.y)
  renderCorner(context, 0, 0)
  renderCorner(context, size.width + PADDING * 2, 0)
  renderCorner(context, size.width + PADDING * 2, size.height + PADDING * 2)
  renderCorner(context, 0, size.height + PADDING * 2)
  context.translate(-position.x, -position.y)
}

function renderCorner(context: CanvasRenderingContext2D, x: number, y: number) {
  context.beginPath()
  context.roundRect(x - PADDING * 2 - 0.5, y - PADDING * 2 - 0.5, SIZE, SIZE, 2)
  context.strokeStyle = COLOR
  context.fillStyle = '#FFFFFF'
  context.fill()
  context.stroke()
}
