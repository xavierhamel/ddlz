import z, { ZodObject } from 'zod'
import type { DocumentProps } from './canvas'
import { ulid } from 'ulidx'

const STORE_PREFIX  = 'ddlz'
const STORE_KEY_REPOSITORY = `${STORE_PREFIX}_repo`
const STORE_DOCUMENT_PREFIX = `${STORE_PREFIX}_doc`

const documentMetadata = z.object({
  id: z.string(),
  name: z.string().optional(),
})
type DocumentMetadata = z.infer<typeof documentMetadata>

const repositoryMetadata = z.object({
  lastEditedDocumentId: z.string().nullable(),
  documents: z.array(documentMetadata),
})
type RespositoryMetadata = z.infer<typeof repositoryMetadata>

export type Document = {
  metadata: DocumentMetadata
  props: DocumentProps
}

export class Repository {
  private metadata: RespositoryMetadata

  constructor() {
    this.metadata = Repository.read(STORE_KEY_REPOSITORY, repositoryMetadata) ?? this.init()
  }

  public lastDocumentUsed(): Document {
    if (this.metadata.documents.length === 0) {
      return this.createDocument()
    }
    if (this.metadata.lastEditedDocumentId === null) {
      return this.createDocument()
    }
    try {
      return this.loadDocumentById(this.metadata.lastEditedDocumentId)
    } catch (error) {
      console.error(`[Repository.lastDocumentUsed] ${String(error)}`)
      return this.createDocument()
    }
  }

  private static idToKey(id: string): string {
    return `${STORE_DOCUMENT_PREFIX}_${id}`
  }

  public loadDocumentById(id: string): Document {
    const documentMetadata = this.metadata.documents
      .filter(({ id: other }) => id === other)
    if (documentMetadata.length === 0) {
      throw new Error('Could not find document metadata.')
    }
    const value = localStorage.getItem(Repository.idToKey(id))
    if (!value) {
      throw new Error('Could not find the document in localstorage.')
    }
    const props = JSON.parse(value)
    return {
      metadata: documentMetadata[0],
      props,
    }
  }

  public createDocument(): Document {
    const id = `doc_${ulid()}`
    return {
      metadata: {
        id,
        name: undefined,
      },
      props: {
        offset: { x: 0, y: 0 },
        items: [],
      },
    }
  }

  public listDocuments(): DocumentMetadata[] {
    return this.metadata.documents
  }

  private init(): RespositoryMetadata {
    return {
      lastEditedDocumentId: null,
      documents: [],
    }
  }

  private static read<T extends ZodObject>(key: string, schema: T): z.infer<T> | null {
    const value = localStorage.getItem(key)
    if (value === null) {
      console.warn(`[Respository.loadAndValidate] key ${key} not found in localstorage`)
      return null
    }
    try {
      return schema.parse(JSON.parse(value))
    } catch (error: unknown) {
      console.warn(`[Respository.loadAndValidate] ${String(error)}`)
      return null
    }
  }

  private static write(key: string, value: object) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  public writeDocument(_document: Document) {
    const id = _document.metadata.id
    this.metadata.lastEditedDocumentId = id
    Repository.write(Repository.idToKey(id), _document.props)
    const index = this.metadata.documents.findIndex(({ id: other }) => id === other)
    if (index === -1) {
      this.metadata.documents.push(_document.metadata)
    } else {
      this.metadata.documents[index] = _document.metadata
    }
    Repository.write(STORE_KEY_REPOSITORY, this.metadata)
  }
}

export async function list(): Promise<string[]> {
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

export async function load(id: string): Promise<Document | undefined> {
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

export async function loadAll(): Promise<Document[]> {
  const keys = await list()
  const maybeDocuments = await Promise.all(keys.map((id) => load(id)))
  const documents = []
  for (const maybeDocument of maybeDocuments) {
    if (maybeDocument) {
      documents.push(maybeDocument)
    }
  }
  return documents
}

export function save(id: string, objects: Document) {
  try {
    const objectDefinitions = JSON.stringify(objects)
    localStorage.setItem(documentKey(id), objectDefinitions)
  } catch {
    console.warn('Could not save items. Was not able to set local storage.')
  }
}
