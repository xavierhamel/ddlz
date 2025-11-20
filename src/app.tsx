import './core/app'
import '../style.css'
import { Whiteboard } from './ui/whiteboard'
import { useRef, useState } from 'preact/hooks'
import { type Document, Repository } from './core/repository'

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
  return (
    <>
      <div id="overlay">
        {documents.map(({ name, id }) => (
          <div onClick={() => setDocument(repository.current.loadDocumentById(id))}>
            {name ?? id}
          </div>
        ))}
      </div>
      <Whiteboard _document={_document} repository={repository} />
    </>
  )
}
