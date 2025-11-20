import { useEffect, useState } from "preact/hooks";
import type { Document } from "../app/document";
import * as docs from "../app/document";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [_document, setDocument] = useState<Document>()
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
   docs.loadAll()
    .then((_documents) => {
      setFetching(false)
      setDocuments(_documents)
    })
  }, [])

  return {
    fetching,
    documents,
    _document,
  }
}
