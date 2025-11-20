import type { Canvas } from "./canvas";
import { Item, type ItemProps } from "./item";

export class Clipboard {
  canvas: Canvas
  clipboard: ItemProps[] = []
  pastedCount: number = 0

  constructor(canvas: Canvas) {
    this.canvas = canvas
  }

  copy(selected: number[]) {
    this.clipboard = selected.map((idx) => this.canvas.items[idx].toSerializable())
    this.pastedCount = 0
  }

  paste() {
    const selected = []
    for (const properties of this.clipboard) {
      const item = Item.from(structuredClone(properties))
      item.moveBy({ x: 20 * (this.pastedCount + 1), y: 20 * (this.pastedCount + 1) })
      this.canvas.items.push(item)
      selected.push(this.canvas.items.length - 1)
    }
    this.pastedCount += 1
    return selected
  }
}
