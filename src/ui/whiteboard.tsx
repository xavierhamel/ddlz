import { useEffect, useState, type MutableRef } from "preact/hooks"
import { controller, Controller } from "../core/controller"
import { Button } from "./components"
import { Properties } from "./properties"
import type { Document, Repository } from "../core/repository"

function useController(controller: Controller) {
  const [selectedTool, setSelectedTool] = useState('normal')
  const [propertiesKeys, setPropertiesKeys] = useState<string[]>([])
  const [properties, setProperties] = useState<Record<string, any> | null>(null)
  const [debug, setDebug] = useState(false)

  const toggleDebug = () => {
    setDebug((prev) => {
      controller.setDebug(!prev)
      return !prev
    })
  }
  useEffect(() => {
    const unsubscribes: (() => void)[] = []
    unsubscribes.push(controller.on('mode', ({ tool, insertType }) => {
      tool = tool === 'selecting' ? 'selected' : tool
      setSelectedTool(tool === 'insert' && insertType ? insertType : tool)
    }))
    unsubscribes.push(controller.on('updatedItem', (item) => {
      setPropertiesKeys(item.properties)
      setProperties(item.toSerializable())
    }))
    unsubscribes.push(controller.on('selected', (item) => {
      if (item) {
        setPropertiesKeys(item.properties)
        setProperties(item.toSerializable())
      } else {
        setPropertiesKeys([])
        setProperties(null)
      }
    }))
  }, [controller])

  return {
    selectedTool,
    propertiesKeys,
    properties,
    debug,
    toggleDebug,
  }
}

type ToolBarProps = {
  selectedTool: string
  toggleDebug: () => void
  debug: boolean
}

function ToolBar({ selectedTool, toggleDebug, debug }: ToolBarProps) {
  return (
    <>
      <div className="card card-row tools">
        <Button onClick={toggleDebug} className={debug ? "active" : undefined}>
          <i class="bi bi-bug"></i>
        </Button>
        <Button onClick={() => controller.normal()} active={selectedTool === 'normal'}>
          <i class="bi bi-hand-index"></i>
        </Button>
        <Button onClick={() => controller.select()} active={selectedTool === 'selected'}>
          <i class="bi bi-cursor"></i>
        </Button>
        <Button onClick={() => controller.insert('rect')} active={selectedTool === 'rect'}>
          <i class="bi bi-square"></i>
        </Button>
        <Button onClick={() => controller.insert('circle')} active={selectedTool === 'circle'}>
          <i class="bi bi-circle"></i>
        </Button>
        <Button onClick={() => controller.insert('line')} active={selectedTool === 'line'}>
          <i class="bi bi-arrow-up-right"></i>
        </Button>
        <Button onClick={() => controller.insert('text')} active={selectedTool === 'text'}>
          <i class="bi bi-textarea-t"></i>
        </Button>
      </div>
    </>
  )
}

type WhiteboardProps = {
  _document: Document
  repository: MutableRef<Repository>
}

export function Whiteboard({ _document, repository }: WhiteboardProps) {
  const {
    selectedTool,
    properties,
    propertiesKeys,
    debug,
    toggleDebug,
  } = useController(controller)
  useEffect(() => {
    controller.setProperties(_document.props)
    return controller.on('update', (props) => {
      repository.current.writeDocument({
        ..._document,
        props,
      })
    })
  }, [_document])
  return (
    <>
      <ToolBar selectedTool={selectedTool} debug={debug} toggleDebug={toggleDebug} />
      <Properties
        propertiesKeys={propertiesKeys}
        properties={properties}
      />
    </>
  )
}
