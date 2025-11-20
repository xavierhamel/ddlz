import type { Position } from './utils'
import { Canvas, type DocumentProps } from './canvas'
import { Overlay } from './overlay'
import * as utils from './utils'
import * as consts from './consts'
import type { ItemProps, ItemType, ShapeType } from './item'
import { Shape, Line, Item } from './item'
import { EventEmitter } from './event-emitter'
import { Keys, Mouse, type ExtendedMouseEvent } from './input'
import { Clipboard } from './clipboard'

export type InsertType = ShapeType | ItemType
export type Tool = 'normal' | 'resize' | 'insert' | 'selecting' | 'selected'
export type Mode = {
  tool: Tool
  insertType?: InsertType
}
type ControllerEvents = {
  selected: Item | undefined
  updatedItem: Item
  update: DocumentProps
  mode: Mode
}

export class Controller extends EventEmitter<ControllerEvents> {
  canvas: Canvas
  overlay: Overlay

  mouse: Mouse
  keys: Keys
  clipboard: Clipboard

  offset: Position = { x: 0, y: 0 }
  scale: number = 1
  _selected: number[] = []
  _mode: Mode = { tool: 'selecting' }

  constructor() {
    super()
    this.canvas = new Canvas()
    this.overlay = new Overlay()
    this.mouse = new Mouse(this.canvas.element, this.overlay.wrapper, [() => this.offset, () => this.scale])
    this.keys = new Keys()
    this.clipboard = new Clipboard(this.canvas)
    this.registerEventsHandler()
  }

  get selected(): number[] {
    return this._selected
  }

  set selected(selected: number[]) {
    const item = this.canvas.items[selected[0]]
    this.emit('selected', selected.length > 1 ? undefined : item)
    this._selected = selected
  }

  get mode(): Mode {
    return this._mode
  }

  set mode(mode: Mode | 'selected' | 'selecting' | 'normal') {
    this.overlay.stopTextEdit()
    this.render()
    if (typeof mode === 'string') {
      mode = { tool: mode }
    }
    if (mode.tool === 'insert') {
      this.selected = []
    }
    this.emit('mode', mode)
    this._mode = mode
  }

  didUpdate() {
    this.emit('update', this.canvas.toSerializable())
  }

  registerEventsHandler() {
    this.mouse.on('wheel', (event) => {
      this.moveOffsetBy({ x: -event.deltaX, y: -event.deltaY })
      this.render()
      event.preventDefault()
    })
    this.mouse.on('move', (event) => {
      if (this.overlay.isEditing()) {
        return
      }
      this.updateCursor()

      if (this.mode.tool === 'insert' && event.dragging) {
        this.canvas.items[this.canvas.items.length - 1].setShapeFromMouseEvent(event)
        return
      } else if (this.mode.tool === 'resize' && event.dragging && this.selected.length > 0) {
        this.canvas.items[this.selected[0]].setShapeFromMouseEvent(event)
        return
      }

      if (event.dragging) {
        if (this.selected.length === 0 || this.mode.tool === 'selecting') {
          if (this.mode.tool === 'normal') {
            this.moveOffsetBy(event.delta)
          } else if (this.mode.tool === 'selecting') {
            this.selected = this.canvas.itemsIn(event.draggedBounding)
          }
        } else {
          this.canvas.moveItemsBy(this.selected, event.delta)
        }
      }
    })

    this.mouse.on('down', (event) => {
      if (this.mode.tool === 'insert') {
        if (this.mode.insertType === 'line') {
          this.canvas.items.push(new Line({
            type: 'line',
            points: [event.start, event.start],
          }))
        } else if (this.mode.insertType === 'text' || this.mode.insertType === 'rect' || this.mode.insertType === 'circle') {
          this.canvas.items.push(new Shape({
            type: 'shape',
            shape: this.mode.insertType,
            position: event.start,
            size: { width: 0, height: 0, },
            stroke:  consts.STROKE_COLORS[this.mode.insertType === 'text' ? 4 : 0],
          }))
        }
        return
      }

      let item = this.canvas.selectedItems(this.selected)[0]
      if (item) {
        const controlCorner = item.collideControls(event.position)
        if (controlCorner !== null) {
          this.mode = { tool: 'resize' }
        }
      }
      this.updateSelectedItems(event)
      item = this.canvas.selectedItems(this.selected)[0]
      if (this.selected.length > 1 || !item || (item && !this.overlay.isItemBeingEdited(item))) {
        this.overlay.stopTextEdit()
      }
      if (item && this.mode.tool === 'selecting') {
        this.mode = 'selected'
      }
      if (!item && this.mode.tool === 'selected') {
        this.mode = 'selecting'
      }
    })

    this.mouse.on('up', () => {
      if (this.mode.tool === 'insert') {
        this.mode = 'selecting'
        const item = this.canvas.items[this.canvas.items.length - 1]
        if (!item.isMinimumSizeToInsert()) {
          this.canvas.items.pop()
          return
        }
        this.selected = [this.canvas.items.length - 1]
      } else if (this.mode.tool === 'resize') {
        this.mode = 'selecting'
      }

      this.didUpdate()
    })

    this.mouse.on('dblclick', () => {
      if (this.selected.length === 0) {
        return
      }
      const item = this.canvas.selectedItems(this.selected)[0]
      if (item.type !== 'line' && this.selected.length < 2) {
        this.overlay.editTextItem(item)
      }
    })

    this.keys.on('down', (event) => {
      if (this.overlay.isEditing()) {
        return
      }
      if (event.code === 'KeyC' && this.keys.modifiers().ctrl) {
        this.clipboard.copy(this.selected)
        event.preventDefault()
      }
      if (event.code === 'KeyV' && this.keys.modifiers().ctrl) {
        this.selected = this.clipboard.paste()
        event.preventDefault()
      }
    })
    this.keys.on('up', (event) => {
      if (this.overlay.isEditing()) {
        return
      }
      if (event.code === 'KeyC') {
        this.mode = {
          tool: 'insert',
          insertType: 'circle',
        }
      }
      if (event.code === 'KeyR') {
        this.mode = {
          tool: 'insert',
          insertType: 'rect',
        }
      }
      if (event.code === 'KeyL') {
        this.mode = {
          tool: 'insert',
          insertType: 'line',
        }
      }
      if (event.code === 'Escape') {
        this.mode = 'selected'
      }
      if (event.code === 'Backspace') {
        this.deleteItems(this.selected)
      }
    })

    this.mouse.on('*', () => this.render())
    this.keys.on('*', () => this.render())
  }

  updateSelectedItems(event: ExtendedMouseEvent) {
    if (this.keys.modifiers().shift) {
      const selected = this.canvas.itemsAt(event.position)
      if (selected.length > 0 && this.selected.includes(selected[0])) {
        this.selected = this.selected.filter((idx) => idx !== selected[0])
      } else {
        this.selected = [...new Set(this.selected.concat(selected))]
      }
    } else {
      const { position, size } = this.canvas.itemsBounding(this.selected)
      if (this.selected.length < 2 || !utils.collideRect(event.position, position, size)) {
        this.selected = this.canvas.itemsAt(event.position)
      }
    }
  }

  moveOffsetBy(delta: Position) {
    this.offset.x += delta.x
    this.offset.y += delta.y
    this.setOffset(this.offset)
  }

  deleteItems(items: number[]) {
    this.selected = []
    this.canvas.deleteItems(items)
    this.didUpdate()
  }

  updateCursor() {
    const tool = this.mode.tool
    if (tool === 'normal' || tool === 'selected' || tool === 'selecting') {
      this.overlay.wrapper.style.cursor = 'default'
    } else {
      this.overlay.wrapper.style.cursor = 'crosshair'
    }
  }

  setSelectedItemsProperties(properties: Partial<ItemProps>) {
    this.overlay.setSelectedItemProperties(properties)
    this.canvas.setSelectedItemsProperties(this.selected, properties)
    const item = this.canvas.selectedItems(this.selected)[0]
    if (item) {
      this.emit('updatedItem', item)
    }
    this.didUpdate()
    this.render()
  }

  setOffset(offset: Position) {
    this.offset = offset
    this.canvas.setOffset(offset)
    this.overlay.setOffset(offset)
    this.didUpdate()
  }

  setProperties(props: DocumentProps) {
    this.selected = []
    this.overlay = new Overlay()
    this.setOffset(props.offset ?? { x: 0, y: 0 })
    this.canvas.setCanvasProperties(props)
    this.render()
  }

  setDebug(debug: boolean) {
    this.canvas.debug = debug
    this.render()
  }

  render() {
    const showMouseSelect = this.mode.tool === 'selecting'
      || (this.mode.tool === 'insert' && this.mode.insertType === 'text')
    this.canvas.render({
      selected: this.selected,
      scale: this.scale,
      mouseSelect: {
        bounding: showMouseSelect ? this.mouse.dragBounding() : null,
        fill: this.mode.tool === 'selecting',
        stroke: true,
      },
    })
  }

  insert(type: InsertType) {
    this.mode = {
      tool: 'insert',
      insertType: type,
    }
  }

  normal() {
    this.mode = 'normal'
  }

  select() {
    this.mode = 'selecting'
  }

  clear() {
    this.setProperties({
      offset: { x: 0, y: 0 },
      items: []
    })
    this.render()
  }

  zoom(direction: 'in' | 'out') {
    if (direction === 'in') {
      this.scale += 0.25
    }
    if (direction === 'out') {
      this.scale -= 0.25
    }
    this.render()
  }
}

export const controller = new Controller()
