import { Item, type ItemProps } from './item'
import * as consts from './consts'
import type { Position } from './utils'

export class Overlay {
  public container: HTMLElement
  public wrapper: HTMLElement
  public input: HTMLElement
  offset: Position = { x: 0, y: 0 }
  selected: Item | null = null

  constructor() {
    const container: HTMLElement | null = document.querySelector(`#${consts.OVERLAY_CONTAINER_ID}`)
    if (!container) {
      throw new Error(`Could not find input element '${consts.OVERLAY_CONTAINER_ID}'`)
    }
    this.container = container

    const input: HTMLElement | null = document.querySelector(`#${consts.OVERLAY_INPUT_ID}`)
    if (!input) {
      throw new Error(`Could not find input element '${consts.OVERLAY_INPUT_ID}'`)
    }
    this.input = input

    const wrapper: HTMLElement | null = document.querySelector(`#${consts.OVERLAY_WRAPPER_ID}`)
    if (!wrapper) {
      throw new Error(`Could not find input container '${consts.OVERLAY_WRAPPER_ID}'`)
    }
    this.wrapper = wrapper

    window.addEventListener('keyup', () => {
      if (!this.selected) {
        return
      }
      this.selected.text = this.input.innerText
    })
  }

  setOffset(offset: Position) {
    this.offset = offset
    this.container.style.left = `${offset.x}px`
    this.container.style.top = `${offset.y}px`
  }

  isEditing() {
    return !!this.selected
  }

  isItemBeingEdited(item: Item) {
    if (!this.selected || !item) {
      return false
    }
    return item.id === this.selected.id
  }

  stopTextEdit() {
    if (this.selected) {
      this.selected.showText(true)
      this.selected = null
    }
    this.input.blur()
    this.input.style.display = 'none'
  }

  setSelectedItemProperties(properties: Partial<ItemProps>) {
    if (properties.stroke) {
      this.input.style.color = properties.stroke
    }
    if (properties.alignHText) {
      this.input.style.textAlign = properties.alignHText
    }
    if (properties.textSize) {
      this.input.style.fontSize = `${consts.FONT_SIZES[properties.textSize].size}px`
      this.input.style.lineHeight = `${consts.FONT_SIZES[properties.textSize].lineHeight}px`
    }
  }

  editTextItem(item: Item) {
    if (item === this.selected) {
      return
    }
    this.stopTextEdit()
    this.selected = item
    this.selected.showText(false)
    this.input.style.display = 'block'
    this.input.focus()
    this.input.innerText = item.text ?? ''

    const { position, size } = item.bounding
    this.input.style.left = `${position.x}px`
    this.input.style.top = `${position.y}px`
    this.input.style.width = `${size.width}px`
    this.input.style.height = `${size.height}px`

    this.input.style.color = item.stroke ?? 'black'
    this.input.style.textAlign = item.alignHText
    this.input.style.fontSize = `${consts.FONT_SIZES[item.textSize].size}px`
    this.input.style.lineHeight = `${consts.FONT_SIZES[item.textSize].lineHeight}px`
  }
}
