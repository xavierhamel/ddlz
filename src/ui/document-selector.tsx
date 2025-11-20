import type { Document } from "../app/document"

type DocumentSelectorProps = {
  documents: Document[]
  onSelect: (idx: number) => void
}

export function DocumentSelector({ documents, onSelect }: DocumentSelectorProps) {
  return (
    <div className="document-container">
      <h1>Documents</h1>
      {documents.map((_document, index) => (
        <div key={index} onClick={() => onSelect(index)}>{_document.name ?? 'Untitled'}</div>
      ))}
    </div>
  )
}
