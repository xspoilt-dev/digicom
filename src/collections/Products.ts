import { revalidatePath } from 'next/cache'
import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        revalidatePath(`/product/${doc.slug}`)
        revalidatePath(`/`)
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField({
      fieldToUse: 'name',
    }),
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'price_before',
      type: 'number',
      label: 'Price Before Discount',
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'images',
      type: 'array',
      label: 'Product Images',
      minRows: 1,
      required: true,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'color',
          type: 'text',
          label: 'Color (Optional)',
        },
      ],
    },
    {
      name: 'stock_status',
      type: 'checkbox',
      label: 'Out of Stock',
      defaultValue: false,
    },
    {
      name: 'digitalDelivery',
      type: 'group',
      label: 'Digital Delivery Configuration',
      fields: [
        {
          name: 'deliveryMethod',
          type: 'select',
          options: [
            { label: 'File Link', value: 'file_link' },
            { label: 'Credentials (Email/Password)', value: 'credentials' },
            { label: 'PDF Upload', value: 'pdf_upload' },
          ],
        },
        {
          name: 'fileLink',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.deliveryMethod === 'file_link',
          },
        },
        {
          name: 'credentials',
          type: 'group',
          admin: {
            condition: (data, siblingData) => siblingData?.deliveryMethod === 'credentials',
          },
          fields: [
            { name: 'email', type: 'text' },
            { name: 'password', type: 'text' },
          ],
        },
        {
          name: 'pdfUpload',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (data, siblingData) => siblingData?.deliveryMethod === 'pdf_upload',
          },
        },
      ],
    },
  ],
}
