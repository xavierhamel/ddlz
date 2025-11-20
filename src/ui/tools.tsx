import { useState, useEffect } from 'preact/hooks'
import { controller } from '../app/controller'
import { Button, Selectable } from './components'
import { GROUP_TOOLS } from '../app'

export function Tools() {
  const [debug, setDebug] = useState(false)

  useEffect(() => controller.setDebug(debug), [debug])

  return (
    <div className="card card-row tools">
      <Button onClick={() => controller.clear()}>
        <i class="bi bi-file-earmark"></i>
      </Button>
      <Button onClick={() => setDebug(prev => !prev)} className={debug ? "active" : undefined}>
        <i class="bi bi-bug"></i>
      </Button>
      <Selectable group={GROUP_TOOLS} onClick={() => controller.normal()} name='normal'>
        <i class="bi bi-hand-index"></i>
      </Selectable>
      <Selectable group={GROUP_TOOLS} onClick={() => controller.select()} name='selected'>
        <i class="bi bi-cursor"></i>
      </Selectable>
      <Selectable group={GROUP_TOOLS} onClick={() => controller.insert('rect')} name='rect'>
        <i class="bi bi-square"></i>
      </Selectable>
      <Selectable group={GROUP_TOOLS} onClick={() => controller.insert('circle')} name='circle'>
        <i class="bi bi-circle"></i>
      </Selectable>
      <Selectable group={GROUP_TOOLS} onClick={() => controller.insert('line')} name='line'>
        <i class="bi bi-arrow-up-right"></i>
      </Selectable>
      <Selectable group={GROUP_TOOLS} onClick={() => controller.insert('text')} name='text'>
        <i class="bi bi-textarea-t"></i>
      </Selectable>
    </div>
  )
}
