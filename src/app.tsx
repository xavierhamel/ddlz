import './core/app'
import '../style.css'
import { Whiteboard } from './ui/whiteboard'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Repository } from './core/repository'

// 1. Check pour id dans l'url
//  1.1. Si id, on load le document local. Sinon on load le document distant
//  1.2. Si le document n'existe pas, on fallthrough
// 2. On check le document local le plus récent
// 3. On crée un nouveau document local
//
// On a besoin d'un répertoire des documents locaux

// On arrive sur la page
// - Dernier document loader
// - On peut créer un nouveau document
// - On peut switch de document

export function App() {
  const repository = useRef(new Repository())
  const [documents] = useState(repository.current.listDocuments())
  const [_document, setDocument] = useState(repository.current.lastDocumentUsed())
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const element: HTMLElement | null = document.querySelector('#core-text-wrapper')
    if (!element) {
      return
    }
    function clickHandler() {
      setShowDropdown(false)
    }
    element.addEventListener('click', clickHandler)
    return () => element.removeEventListener('click', clickHandler)
  }, [])

  return (
    <>
      <div id="overlay">
        <div className="files">
          <div className="row">
            <button className="with-bg" onClick={() => setShowDropdown(prev => !prev)}>
              <i class="bi bi-list"></i>
            </button>
            <button className="active w-auto" onClick={() => {
              setDocument(repository.current.createDocument())
            }}>
              New
              <i class="bi bi-file-earmark"></i>
            </button>
          </div>
          {showDropdown && (
            <div className="card card-col dropdown">
              {documents.map(({ name, id }) => (
                <button className="dropdown-button" onClick={() => setDocument(repository.current.loadDocumentById(id))}>
                  {name ?? id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Whiteboard _document={_document} repository={repository} />
    </>
  )
}
