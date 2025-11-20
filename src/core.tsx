import './core/app'
import '../style.css'
import { Whiteboard } from './ui/whiteboard'

// 1. check url for document id
//  1.1. If id is present, check locally for document
// 2. 

export function App() {
  return (
    <Whiteboard />
  )
}
