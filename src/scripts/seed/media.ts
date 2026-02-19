import { SeedPayload, ID } from './types'
import { findFirstId, toID, fetchBufferFromUrl, getFilenameFromUrl, log } from './utils'

export async function createMediaIfMissing(
  payload: SeedPayload,
  opts: { filename: string; alt: string; buffer: Buffer; mimetype: string },
) {
  const existingId = await findFirstId(payload, 'media', { filename: { equals: opts.filename } })
  if (existingId) return existingId

  // Clean filename to avoid issues
  const cleanFilename = opts.filename.replace(/[^a-zA-Z0-9.-]/g, '_')

  try {
    const doc = await payload.create({
      collection: 'media',
      data: {
        alt: opts.alt,
      },
      file: {
        data: opts.buffer,
        name: cleanFilename,
        mimetype: opts.mimetype,
        size: opts.buffer.length,
      },
    })
    return toID(doc.id)
  } catch (e) {
    console.error(`Error creating media ${cleanFilename}:`, e)
    return null
  }
}

export async function createMediaFromUrl(
  payload: SeedPayload,
  url: string,
  alt: string,
  fallbackFilename: string,
): Promise<ID | null> {
  log(false, `Fetching media from URL: ${url}`)
  const fetched = await fetchBufferFromUrl(url)
  if (!fetched) return null
  const filename = getFilenameFromUrl(url, fallbackFilename)
  return createMediaIfMissing(payload, {
    filename,
    alt,
    buffer: fetched.buffer,
    mimetype: fetched.mimetype,
  })
}
