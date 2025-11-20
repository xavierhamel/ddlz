export type Position = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type Bounding = {
  position: Position
  size: Size
}

export function distance(p1: Position, p2: Position) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export function collideLine(cursor: Position, start: Position, end: Position) {
  const distance1 = distance(cursor, start)
  const distance2 = distance(cursor, end)
  const lineLength = distance(start, end)
  const cursorDistance = distance1 + distance2
  return cursorDistance > lineLength * 0.995 && cursorDistance < lineLength * 1.005
}

export function collideRect(point: Position, position: Position, size: Size) {
  return point.x > position.x && point.y > position.y
    && point.x < position.x + size.width && point.y < position.y + size.height
}
