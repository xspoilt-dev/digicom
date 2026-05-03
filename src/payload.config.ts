import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { SiteSettings } from './globals/SiteSettings'
import { PageEditor } from './globals/PageEditor'
import { MetaPixelConfig } from './globals/MetaPixelConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      Nav: '/components/Admin/CustomNav#CustomNav',
      views: {
        dashboard: {
          Component: '/components/Admin/Dashboard#Dashboard',
        },
      },
      graphics: {
        Logo: '/components/Logo#Logo',
      },
    },
    theme: 'light',
  },
  graphQL: {
    disable: true,
  },
  collections: [Users, Media, Categories, Products, Orders],
  globals: [SiteSettings, PageEditor, MetaPixelConfig],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
})
