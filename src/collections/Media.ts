import type { CollectionConfig } from 'payload'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: {
    beforeOperation: [
      async ({ operation, args }) => {
        if (operation === 'create' && args.req.file) {
          const file = args.req.file
          if (file) {
            const fileExtension = file.name.split('.').pop()
            const randomName = crypto.randomBytes(10).toString('hex')

            // Set the new filename
            file.name = `${randomName}.${fileExtension}`
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        if (!doc.filename) return

        const mediaDir = path.resolve(dirname, '../../media')
        const filePath = path.resolve(mediaDir, doc.filename)

        try {
          await fs.promises.unlink(filePath)
        } catch (err: unknown) {
          // Ignore error if file doesn't exist
          if ((err as { code?: string }).code !== 'ENOENT') {
            console.error(`Error deleting media file: ${filePath}`, err)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
  ],
  upload: true,
}
