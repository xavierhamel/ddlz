import { LINE_HEAD_ICONS, FILL_COLORS, STROKE_COLORS } from "../core/consts"
import { Button } from "./components"
import { controller } from '../core/controller'
import type { ReactNode } from "preact/compat"

type PropertyProps = {
  children: ReactNode
  title: string
}

export function Property({ children, title }: PropertyProps) {
  return (
    <div>
      <div className="card-title">{ title }</div>
      <div className="card-row">
        { children }
      </div>
    </div>
  )
}

type PropertiesProps = {
  propertiesKeys: string[]
  properties: Record<string, any> | null
}

export function Properties({ properties, propertiesKeys}: PropertiesProps) {
  if (propertiesKeys.length === 0 || properties === null) {
    return <></>
  }
  return (
    <div className="properties">
      <div className="card card-col">
        {propertiesKeys.includes('fill') && (
          <Property title="Fill">
            {FILL_COLORS.map((color) => (
              <Button
                key={color}
                onClick={() => controller.setSelectedItemsProperties({ fill: color })}
                active={properties['fill'] === color}
              >
                <div className="color" style={`background: ${color}`}></div>
              </Button>
            ))}
          </Property>
        )}
        {propertiesKeys.includes('stroke') && (
          <Property title="Stroke">
            {STROKE_COLORS.map((color) => (
              <Button
                key={color}
                onClick={() => controller.setSelectedItemsProperties({ stroke: color })}
                active={properties['stroke'] === color}
              >
                <div className="color" style={`background: ${color}`}></div>
              </Button>
            ))}
          </Property>
        )}
        {propertiesKeys.includes('textAlignH') && (
          <Property title="Align Text">
            {(['left', 'center', 'right'] as const).map((align) => (
              <Button
                onClick={() => controller.setSelectedItemsProperties({ alignHText: align })}
                className='with-bg'
                active={properties['alignHText'] === align}
              >
                <i class={`bi bi-text-${align}`}></i>
              </Button>
            ))}
          </Property>

        )}
        {propertiesKeys.includes('textSize') && (
          <Property title="Text Size">
            {(['small', 'normal', 'large'] as const).map((size) => (
              <Button
                onClick={() => controller.setSelectedItemsProperties({ textSize: size })}
                className='with-bg'
                active={properties['textSize'] === size}
              >
                <i class={`bi bi-fonts text-size-${size}`}></i>
              </Button>
            ))}
          </Property>
        )}
        {propertiesKeys.includes('headStart') && (
          <Property title="Start Head">
            {(['arrow', 'circle', 'none'] as const).map((type) => (
              <Button
                onClick={() => controller.setSelectedItemsProperties({ headStart: type })}
                className='with-bg'
                active={properties['headStart'] === type}
              >
                <i class={`bi bi-${LINE_HEAD_ICONS[`${type}-start`]}`}></i>
              </Button>
            ))}
          </Property>
        )}
        {propertiesKeys.includes('headEnd') && (
          <Property title="End Head">
            {(['arrow', 'circle', 'none'] as const).map((type) => (
              <Button
                onClick={() => controller.setSelectedItemsProperties({ headEnd: type })}
                className='with-bg'
                active={properties['headEnd'] === type}
              >
                <i class={`bi bi-${LINE_HEAD_ICONS[`${type}-end`]}`}></i>
              </Button>
            ))}
          </Property>
        )}
      </div>
    </div>
  )
}
