import type { Position, Size, Bounding } from './utils'
import * as utils from './utils'
import * as controls from './controls'
import * as consts from './consts'
import type { RoughCanvas } from './canvas'
import rough from 'roughjs'
import { drawText } from 'canvas-txt'
import type { MouseMoveEvent } from './input'
import type { Options } from 'roughjs/bin/core'

type TextSize = 'small' | 'normal' | 'large'
type TextHAlign = 'center' | 'left' | 'right'
type LineHead = 'none' | 'arrow' | 'circle'

export type ItemType = 'shape' | 'line'
export type ShapeType = 'rect' | 'circle' | 'text'

export type ItemProps  = ({
  type: 'shape'
  shape: ShapeType
  size: Size
  position: Position
  fill?: string
} | {
  type: 'line'
  points: Position[]
  headStart?: LineHead
  headEnd?: LineHead
})
& {
  stroke?: string
  text?: string
  alignHText?: TextHAlign
  textSize?: TextSize
}

export abstract class Item {
  id: number = Math.random()
  seed: number = rough.newSeed()
  selectedControl: number | null = null

  stroke?: string = consts.STROKE_COLORS[0]

  text?: string
  alignHText: TextHAlign = 'center'
  textSize: TextSize = 'normal'

  isTextRendered: boolean = true
  disableText: boolean = false

  abstract type: ItemType

  static from(properties: ItemProps) {
    if (properties.type === 'line') {
      return new Line(properties)
    } else if (properties.type === 'shape') {
      return new Shape(properties)
    }
    throw new Error('An internal error occured. Could not create the item (Item.from)')
  }

  setProperties(properties: Partial<ItemProps>): void {
    if (properties.type !== this.type) {
      console.warn(`The type of the properties is not the type of the object (${properties.type} != ${this.type})`)
      return
    }
    Object.assign(this, properties)
  }

  toSerializable(): ItemProps {
    return { ...structuredClone(this) as any }
  }

  get properties(): string[] {
    if (!this.disableText) {
      return ['textAlignH', 'textSize', 'stroke']
    }
    return ['stroke']
  }

  inside(container: Bounding): boolean {
    const { position, size } = this.bounding
    return container.position.x < position.x && container.position.y < position.y
      && container.position.x + container.size.width > position.x + size.width
      && container.position.y + container.size.height > position.y + size.height
  }

  renderDebug(context: CanvasRenderingContext2D): void {
    const { position, size } = this.bounding
    const prevCollide = this.selectedControl
    context.fillStyle = 'blue'
    const precision = 1
    for (let x = 0; x < size.width + 30; x += precision) {
      for (let y = 0; y < size.height + 30; y += precision) {
        const point = { x: position.x - 15 + x, y: position.y - 15 + y }
        const controls = this.collideControls(point) !== null
        const hitbox = this.collide(point)
        if (!controls && !hitbox) {
          continue
        }
        context.fillStyle = controls  ? 'blue' : 'red'
        context.fillRect(point.x, point.y, precision, precision)
      }
    }
    this.selectedControl = prevCollide
    context.lineWidth = 1
    context.strokeStyle = 'red'
    context.strokeRect(position.x, position.y, size.width, size.height)
    context.strokeRect(position.x - 15, position.y - 15, size.width + 30, size.height + 30)
  }

  renderText(context: CanvasRenderingContext2D) {
    if (!this.isTextRendered || this.disableText) {
      return
    }
    context.fillStyle = this.stroke ? this.stroke : '#000000'
    let textSize = this.textSize
    if (typeof this.textSize !== 'string') {
      textSize = 'normal'
    }
    const { position, size } = this.bounding
    drawText(context, this.text ?? '', {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      fontSize: consts.FONT_SIZES[textSize].size,
      lineHeight: consts.FONT_SIZES[textSize].lineHeight,
      align: this.alignHText,
      vAlign: 'middle',
      font: 'Delius'
    })
  }

  showText(shown: boolean) {
    this.isTextRendered = shown
  }

  abstract collideControls(point: Position): number | null

  abstract collide(point: Position): boolean

  abstract render(context: CanvasRenderingContext2D, rough: RoughCanvas): void

  abstract moveBy(offset: Position): void

  abstract isMinimumSizeToInsert(): boolean

  abstract setShapeFromMouseEvent(event: MouseMoveEvent): void

  abstract get bounding(): Bounding
}

export class Line extends Item {
  type: 'line' = 'line'

  points: Position[] = []
  headStart: LineHead = 'none'
  headEnd: LineHead = 'arrow'
  disableText: boolean = true

  constructor(properties: ItemProps) {
    super()
    if (properties.type !== 'line') {
      throw new Error('Cannot construct a line from a shape object')
    }
    Object.assign(this, properties)
  }

  get properties() {
    const _properties = super.properties
    return [..._properties, 'headStart', 'headEnd']
  }

  collideControls(cursor: Position): number | null {
    const size: Size = { width: controls.SIZE + 2, height: controls.SIZE + 2 }
    const padding = controls.PADDING * 1.5
    for (let idx = 0; idx < this.points.length; idx++) {
      const { x, y } = this.points[idx]
      if (utils.collideRect(cursor, { x: x - padding, y: y - padding }, size)) {
        this.selectedControl = idx
        return idx
      }
    }
    this.selectedControl = null
    return null
  }

  collide(cursor: Position) {
    if (this.points.length !== 2) {
      throw new Error('Line with more than 2 points are not supported')
    }
    return utils.collideLine(cursor, this.points[0], this.points[1]) || this.collideControls(cursor) !== null
  }

  isMinimumSizeToInsert(): boolean {
    return utils.distance(this.points[0], this.points[1]) > 5
  }

  moveBy(offset: Position): void {
    this.points = this.points.map((point) => {
      point.x += offset.x
      point.y += offset.y
      return point
    })
  }

  setShapeFromMouseEvent(event: MouseMoveEvent): void {
    if (this.selectedControl !== null) {
      this.points[this.selectedControl] = event.position
    } else {
      this.points[0] = event.start
      this.points[1] = event.position
    }
  }

  get bounding(): Bounding {
    const min = {
      x: Math.min(...this.points.map(({ x }) => x)),
      y: Math.min(...this.points.map(({ y }) => y)),
    }
    const max = {
      x: Math.max(...this.points.map(({ x }) => x)),
      y: Math.max(...this.points.map(({ y }) => y)),
    }
    const size = {
      width: Math.abs(min.x - max.x),
      height: Math.abs(min.y - max.y),
    }
    return {
      position: min,
      size,
    }
  }

  angle(point1: Position, point2: Position) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.atan2(dy, dx);
  }

  renderArrow(rough: RoughCanvas, point: Position, angle: number, style: Options) {
    const x1 = point.x + 10 * Math.cos(angle + Math.PI / 1.25)
    const y1 = point.y + 10 * Math.sin(angle + Math.PI / 1.25)
    const x2 = point.x + 10 * Math.cos(angle - Math.PI / 1.25)
    const y2 = point.y + 10 * Math.sin(angle - Math.PI / 1.25)
    rough.line(point.x, point.y, x1, y1, style);
    rough.line(point.x, point.y, x2, y2, style);
  }

  render(context: CanvasRenderingContext2D, rough: RoughCanvas) {
    const style = {
      fillWeight: 3,
      stroke: this.stroke ? this.stroke : 'none',
      fill: this.stroke ? this.stroke : 'none',
      seed: this.seed,
    }

    rough.linearPath(this.points.map(({ x, y }) => [x, y]), style);

    if (this.headStart === 'arrow') {
      const angle = this.angle(this.points[1], this.points[0])
      this.renderArrow(rough, this.points[0], angle, style)
    } else if (this.headStart === 'circle') {
      rough.circle(this.points[0].x, this.points[0].y, 10, style);
    }
    const pointsCount = this.points.length
    if (this.headEnd === 'arrow') {
      const angle = this.angle(this.points[pointsCount - 2], this.points[pointsCount - 1])
      this.renderArrow(rough, this.points[pointsCount - 1], angle, style)
    } else if (this.headEnd === 'circle') {
      rough.circle(this.points[pointsCount - 1].x, this.points[pointsCount - 1].y, 10, style);
    }
    this.renderText(context)
  }
}

export class Shape extends Item {
  type: 'shape' = 'shape'
  shape: ShapeType = 'rect'
  size: Size = { width: 100, height: 100 }
  position: Position = { x: 100, y: 100 }
  fill?: string = consts.FILL_COLORS[0]

  constructor(properties: Partial<ItemProps>) {
    super()
    if (properties.type !== 'shape') {
      throw new Error('Cannot construct a shape from a line object')
    }
    Object.assign(this, properties)
  }

  get properties() {
    if (this.shape === 'text') {
      return super.properties
    }
    const _properties = super.properties
    return [..._properties, 'fill']
  }

  setShapeFromMouseEvent(event: MouseMoveEvent) {
    if (this.selectedControl === 0 || this.selectedControl === 3) {
      this.position.x += event.delta.x
      this.size.width -= event.delta.x
    }
    if (this.selectedControl === 0 || this.selectedControl === 1) {
      this.position.y += event.delta.y
      this.size.height -= event.delta.y
    }
    if (this.selectedControl === 1 || this.selectedControl === 2) {
      this.size.width += event.delta.x
    }
    if (this.selectedControl === 2 || this.selectedControl === 3) {
      this.size.height += event.delta.y
    }
    if (this.selectedControl === null) {
      this.position = event.draggedBounding.position
      this.size = event.draggedBounding.size
    }
  }

  collideControls(point: Position): number | null {
    const size: Size = { width: controls.SIZE + 2, height: controls.SIZE + 2 }
    const { x, y } = this.position
    const { width, height } = this.size
    const padding = (controls.SIZE + 2) - 1
    if (utils.collideRect(point, { x: x - padding, y: y - padding }, size)) {
      this.selectedControl = controls.TOP_LEFT
      return controls.TOP_LEFT
    }
    if (utils.collideRect(point, { x: x + width - 2, y: y - padding }, size)) {
      this.selectedControl = controls.TOP_RIGHT
      return controls.TOP_RIGHT
    }
    if (utils.collideRect(point, { x: x + width - 2, y: y + height - 2 }, size)) {
      this.selectedControl = controls.BOTTOM_RIGHT
      return controls.BOTTOM_RIGHT
    }
    if (utils.collideRect(point, { x: x - padding, y: y + height - 2 }, size)) {
      this.selectedControl = controls.BOTTOM_LEFT
      return controls.BOTTOM_LEFT
    }
    this.selectedControl = null
    return null
  }

  collide(point: Position) {
    return utils.collideRect(point, this.position, this.size) || this.collideControls(point) !== null
  }

  moveBy(offset: Position): void {
    this.position.x += offset.x
    this.position.y += offset.y
  }

  isMinimumSizeToInsert(): boolean {
    return this.size.width > 5 || this.size.height > 5
  }

  get bounding(): Bounding {
    return {
      position: this.position,
      size: this.size,
    }
  }

  render(context: CanvasRenderingContext2D, rough: RoughCanvas) {
    const style = {
      fill: this.fill ? this.fill : 'none',
      fillWeight: 3,
      stroke: this.stroke ? this.stroke : 'none',
      seed: this.seed,
    }

    switch (this.shape) {
      case 'rect':
        rough.rectangle(this.position.x, this.position.y, this.size.width, this.size.height, style);
        break
      case 'circle':
        const x = this.position.x + this.size.width / 2
        const y = this.position.y + this.size.height / 2
        rough.ellipse(x, y, this.size.width, this.size.height, style);
        break
      default:
        break
    }

    this.renderText(context)
  }
}

