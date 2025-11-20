import { EventEmitter } from './event-emitter'
import type { Position, Bounding } from './utils'

export type ExtendedMouseEvent = {
  event: MouseEvent
  position: Position
  start: Position
  dragging: boolean
}

export type MouseMoveEvent = ExtendedMouseEvent & {
  delta: Position
  draggedBounding: Bounding
}

export type MouseUpEvent = ExtendedMouseEvent & {
  draggedBounding: Bounding
}

type MouseEvents = {
  down: ExtendedMouseEvent
  up: MouseUpEvent
  move: MouseMoveEvent
  dblclick: ExtendedMouseEvent
  wheel: WheelEvent
}

export class Mouse extends EventEmitter<MouseEvents> {
  private canvas: HTMLCanvasElement
  private element: HTMLElement
  private getOffset: () => Position
  private _getScale: () => number

  private dragging: boolean = false
  private start: Position = { x: 0, y: 0 }
  private previous: Position = { x: 0, y: 0 }

  constructor(canvas: HTMLCanvasElement, element: HTMLElement, getTransforms: [() => Position, () => number]) {
    super()
    this.element = element
    this.canvas = canvas
    this.getOffset = getTransforms[0]
    this._getScale = getTransforms[1]

    this.registerEventsHandler()
  }

  canvasPosition(event: MouseEvent): Position {
    const offset = this.getOffset()
    return {
      x: ((event.clientX - this.canvas.getBoundingClientRect().left) - offset.x),
      y: ((event.clientY - this.canvas.getBoundingClientRect().top) - offset.y),
    }
  }

  bounding(end: Position) {
    const position = {
      x: this.start.x < end.x ? this.start.x : end.x,
      y: this.start.y < end.y ? this.start.y : end.y,
    }
    const size = {
      width: Math.abs(end.x - this.start.x),
      height: Math.abs(end.y - this.start.y),
    }
    return {
      position,
      size,
    }
  }

  dragBounding(): Bounding | null {
    if (!this.dragging) {
      return null
    }
    return this.bounding(this.previous)
  }

  registerEventsHandler() {
    this.element.addEventListener('mousemove', (event) => {
      const position = this.canvasPosition(event)
      const delta = {
        x: position.x - this.previous.x,
        y: position.y - this.previous.y,
      }
      this.emit('move', {
        event,
        position,
        delta,
        dragging: this.dragging,
        start: this.start,
        draggedBounding: this.bounding(position),
      })
      this.previous = this.canvasPosition(event)
    })

    this.element.addEventListener('mousedown', (event) => {
      const position = this.canvasPosition(event)
      this.dragging = true
      this.start = position
      this.emit('down', {
        event,
        position,
        dragging: this.dragging,
        start: this.start,
      })
      this.previous = this.canvasPosition(event)
    })

    this.element.addEventListener('mouseup', (event) => {
      const position = this.canvasPosition(event)
      this.dragging = false
      this.emit('up', {
        event,
        position,
        dragging: this.dragging,
        start: this.start,
        draggedBounding: this.bounding(position),
      })
    })

    this.element.addEventListener('dblclick', (event) => {
      this.dragging = false
      this.emit('dblclick', {
        event,
        position: this.previous,
        dragging: this.dragging,
        start: this.start,
      })
    })

    this.element.addEventListener('wheel', (event) => {
      this.previous = {
        x: this.previous.x - event.deltaX,
        y: this.previous.y - event.deltaY,
      }
      this.emit('wheel', event)
    })
  }
}

type KeysEvent = {
  up: KeyboardEvent
  down: KeyboardEvent
}

type KeyModifiers = {
  shift: boolean
  alt: boolean
  ctrl: boolean
}

export class Keys extends EventEmitter<KeysEvent> {
  private _modifiers: KeyModifiers = {
    shift: false,
    alt: false,
    ctrl: false,
  }

  constructor() {
    super()
    this.registerEventsHandler()
  }

  modifiers() {
    return this._modifiers
  }

  registerEventsHandler() {
    window.addEventListener('keydown', (event) => {
      this._modifiers.shift = event.shiftKey
      this._modifiers.alt = event.altKey
      this._modifiers.ctrl = event.metaKey || event.ctrlKey
      this.emit('down', event)
    })
    window.addEventListener('keyup', (event) => {
      this._modifiers.shift = event.shiftKey
      this._modifiers.alt = event.altKey
      this._modifiers.ctrl = event.metaKey || event.ctrlKey
      this.emit('up', event)
    })
  }
}
