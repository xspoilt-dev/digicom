import { revalidatePath } from 'next/cache'
import type { CollectionConfig } from 'payload'

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
        revalidatePath(`/product/${doc.id}`)
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
  ],
}
