// @ts-nocheck
import { SeedPayload, SeedArgs, CollectionSlug, ID } from './types'

export function parseArgs(argv: string[]): SeedArgs {
  const args: SeedArgs = {
    reset: false,
    confirm: false,
    noMedia: false,
    silent: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]

    if (a === '--reset') args.reset = true
    else if (a === '--confirm') args.confirm = true
    else if (a === '--no-media') args.noMedia = true
    else if (a === '--silent') args.silent = true
    else if (a === '--env' || a === '--envFile') {
      args.envFile = argv[i + 1]
      i++
    }
  }

  return args
}

export function log(silent: boolean, message: string) {
  if (!silent) console.log(message)
}

export function toID(value: unknown): ID {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) throw new Error(`Invalid ID: ${String(value)}`)
  return n
}

export async function fetchBufferFromUrl(
  url: string,
): Promise<{ buffer: Buffer; mimetype: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimetype = response.headers.get('content-type') || 'image/jpeg'
    return { buffer, mimetype }
  } catch (_) {
    return null
  }
}

export function getFilenameFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/')
    const last = segments[segments.length - 1]
    if (last && last.includes('.')) return last
    return fallback
  } catch {
    return fallback
  }
}

export function createRichText(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              format: 0,
              detail: 0,
              style: '',
              mode: 'normal',
              text: text,
              version: 1,
            },
          ],
        },
      ],
    },
  }
}

export async function findFirstId(
  payload: SeedPayload,
  collection: CollectionSlug,
  where: Record<string, unknown>,
): Promise<ID | null> {
  const res = await payload.find({ collection, where, limit: 1, depth: 0 })
  const doc = res?.docs?.[0]
  return doc?.id != null ? toID(doc.id) : null
}

export async function deleteAllDocs(
  payload: SeedPayload,
  collection: CollectionSlug,
  silent: boolean,
) {
  let page = 1
  const limit = 100
  for (;;) {
    const res = await payload.find({
      collection,
      limit,
      page,
      depth: 0,
    })

    const docs: Array<{ id: unknown }> = res?.docs || []
    if (docs.length === 0) break

    for (const d of docs) {
      await payload.delete({ collection, id: toID(d.id) })
    }

    log(silent, `Deleted ${docs.length} from ${collection} (page ${page})`)
    page++
  }
}
