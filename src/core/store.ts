import type { DocumentProps } from './canvas'

const STORE_PREFIX  = 'ddlz'
const STORE_DOCUMENT_PREFIX = `${STORE_PREFIX}_doc`

export type Document = {
  name: string
  properties: DocumentProps
}

export async function documents(): Promise<string[]> {
  const documents: string[] = []
  let idx = 0;
  while (true) {
    const key = localStorage.key(idx)
    if (key === null) {
      break
    }
    if (key.startsWith(STORE_DOCUMENT_PREFIX)) {
      documents.push(key)
    }
    idx += 1
  }
  return documents
}

function documentKey(id: string): string {
  return `${STORE_DOCUMENT_PREFIX}_${id}`
}

export async function loadDocument(id: string): Promise<DocumentProps | undefined> {
  try {
    const jsonObjects = localStorage.getItem(documentKey(id))
    if (!jsonObjects) {
      console.warn('Could not load stored items. Was not able to read local storage.')
      return
    }
    const props = JSON.parse(jsonObjects)
    // TODO: Check that we have actually a [`Document`] with zod
    return props
  } catch {
    console.warn('Could not load stored items. Was not able to read local storage.')
    return
  }
}

export function saveObjects(id: string, objects: DocumentProps) {
  try {
    const objectDefinitions = JSON.stringify(objects)
    localStorage.setItem(documentKey(id), objectDefinitions)
  } catch {
    console.warn('Could not save items. Was not able to set local storage.')
  }
}
