import { type ReactNode } from 'preact/compat'

type SelectableProps = {
  className?: string
  children: ReactNode
  onClick: () => void
  group: string
  name: string
}

export function Selectable({ className, group, name, onClick, children }: SelectableProps) {
  const id = `${group}-${name}`
  return (
    <div onClick={onClick}>
      <input type="radio" id={id} name={group} />
      <label for={id} className={className}>{ children }</label>
    </div>
  )
}

type ButtonProps = {
  className?: string
  children: ReactNode
  onClick: () => void
  active?: boolean
}

export function Button({ onClick, children, className, active }: ButtonProps) {
  if (active) {
    className = (className ?? '') + ' active'
  }
  return (
    <button onClick={onClick} className={className}>
      { children }
    </button>
  )
}

