import type { GlobalConfig } from 'payload'

export const PageEditor: GlobalConfig = {
  slug: 'page-editor',
  label: 'Page Editor',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'homePage',
          label: 'Home Page',
          fields: [
            {
              name: 'heroImages',
              type: 'array',
              label: 'Hero Images',
              maxRows: 5,
              labels: {
                singular: 'Hero Image',
                plural: 'Hero Images',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  admin: {
                    components: {
                      Field: '/components/Admin/ImageField',
                    },
                  },
                },
                {
                  name: 'link',
                  type: 'text',
                  label: 'Wrapper Link (Optional)',
                },
              ],
              admin: {
                description: 'Add up to 5 hero images for the homepage carousel.',
              },
            },
            {
              name: 'bannerImages',
              type: 'array',
              label: 'Banner Images',
              maxRows: 5,
              labels: {
                singular: 'Banner Image',
                plural: 'Banner Images',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  admin: {
                    components: {
                      Field: '/components/Admin/ImageField',
                    },
                  },
                },
                {
                  name: 'link',
                  type: 'text',
                  label: 'Wrapper Link (Optional)',
                },
              ],
              admin: {
                description: 'Add up to 5 banner images to be displayed on the homepage.',
              },
            },
            {
              name: 'numberOfProducts',
              type: 'number',
              label: 'Number of Products to Show',
              max: 10,
              defaultValue: 10,
              admin: {
                description: 'Maximum number of products to show on the homepage (max 10).',
              },
            },
          ],
        },
      ],
    },
  ],
}
