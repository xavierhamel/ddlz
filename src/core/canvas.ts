import * as controls from './controls'
import type { Bounding, Position, Size } from './utils'
import { Item, Line, Shape } from './item'
import type { ItemProps } from './item'
import * as consts from './consts'
import rough from 'roughjs'
import { SCALE } from './consts'

export type RoughCanvas = ReturnType<typeof rough.canvas>

export type DocumentProps = {
  offset: Position
  items: ItemProps[]
}

type MouseSelectRenderProps = {
  bounding: Bounding | null
  fill: boolean
  stroke: boolean
}

type CanvasRenderProps = {
  selected: number[]
  scale: number
  mouseSelect: MouseSelectRenderProps
}

export class Canvas {
  private rough: RoughCanvas
  public element: HTMLCanvasElement

  private offset: Position = { x: 0, y: 0 }
  private size: Size
  private context: CanvasRenderingContext2D
  public debug: boolean = false

  items: Item[] = []

  constructor() {
    const element: HTMLCanvasElement | null = document.querySelector(`#${consts.CANVAS_ID}`)
    if (!element) {
      throw new Error(`'${consts.CANVAS_ID}' was not found in the document`)
    }
    this.element = element
    const context = this.element.getContext('2d')
    if (!context) {
      throw new Error('Could not get canvas context')
    }
    this.context = context
    this.rough = rough.canvas(this.element)

    this.size = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.resize()
  }

  deleteItems(items: number[]) {
    items.sort((a, b) => b - a)
    items.forEach((index) => {
      this.items.splice(index, 1)
    })
  }

  resize() {
    this.element.width = window.innerWidth * SCALE
    this.element.height = window.innerHeight * SCALE
    this.element.style.width = `${window.innerWidth}px`
    this.element.style.height = `${window.innerHeight}px`
  }

  setCanvasProperties(props: DocumentProps) {
    this.offset = props.offset ?? { x: 0, y: 0 }
    this.items = props.items.map((itemProps) => {
      if (itemProps.type === 'line') {
        return new Line(itemProps)
      } else {
        return new Shape(itemProps)
      }
    })
  }

  setSelectedItemsProperties(selected: number[], properties: Partial<ItemProps>) {
    selected.forEach((index) => {
      const type = this.items[index].toSerializable().type
      this.items[index].setProperties({ type, ...properties})
    })
  }

  itemsAt(position: Position) {
    for (let idx = this.items.length - 1; idx >= 0; idx--) {
      const item = this.items[idx]
      if (item.collide(position)) {
        return [idx]
      }
    }
    return []
  }

  itemsIn(bounding: Bounding) {
    const selected = []
    for (let idx = this.items.length - 1; idx >= 0; idx--) {
      const item = this.items[idx]
      if (item.inside(bounding)) {
        selected.push(idx)
      }
    }
    return selected
  }


  selectedItems(selected: number[]): Item[] {
    return selected.map((index) => this.items[index])
  }

  setOffset(offset: Position) {
    this.offset = offset
  }

  moveItemsBy(selected: number[], offset: Position) {
    selected.forEach((index) => {
      this.items[index].moveBy(offset)
    })
  }

  toSerializable(): DocumentProps {
    return {
      offset: this.offset,
      items: this.items.map((item) => item.toSerializable())
    }
  }

  itemsBounding(items: number[]): Bounding {
    const boundings = items.map((idx) => this.items[idx].bounding)
    const min = {
      x: Math.min(...boundings.map(({ position }) => position.x)),
      y: Math.min(...boundings.map(({ position }) => position.y)),
    }
    const max = {
      x: Math.max(...boundings.map(({ size, position }) => position.x + size.width)),
      y: Math.max(...boundings.map(({ size, position }) => position.y + size.height)),
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

  render({ scale, selected, mouseSelect }: CanvasRenderProps) {
    scale = SCALE * scale
    this.context.scale(scale, scale)
    this.context.clearRect(0, 0, this.size.width * scale, this.size.height * scale)
    this.context.translate(this.offset.x, this.offset.y)
    if (this.debug) {
      this.renderDebug()
    }
    this.items.forEach((item) => {
      item.render(this.context, this.rough)
    })
    if (selected.length > 1) {
      controls.renderRect(this.context, this.itemsBounding(selected), true)
    }
    this.renderMouseSelect(mouseSelect)
    selected.forEach((index) => {
      controls.render(this.context, this.items[index])
    })
    this.context.translate(-this.offset.x, -this.offset.y)
    this.context.scale(1 / scale, 1 / scale)
  }

  renderMouseSelect({ bounding, stroke, fill }: MouseSelectRenderProps) {
    if (!bounding) {
      return
    }
    const { position, size } = bounding
    if (fill) {
      this.context.fillStyle = 'rgba(22, 160, 133, 0.06)'
      this.context.fillRect(position.x, position.y, size.width, size.height)
    }
    if (stroke) {
      this.context.strokeStyle = 'rgb(22, 160, 133)'
      this.context.lineWidth = 1
      this.context.strokeRect(position.x, position.y, size.width, size.height)
    }
  }

  renderDebug() {
    this.items.forEach((item) => item.renderDebug(this.context))
  }
}
