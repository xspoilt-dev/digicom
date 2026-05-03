import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'status', 'total', 'createdAt'],
  },
  access: {
    create: () => true, // Allow anonymous orders
    read: ({ req: { user } }) => Boolean(user), // Restrict read to admins
    update: ({ req: { user } }) => Boolean(user), // Restrict update to admins
    delete: ({ req: { user } }) => Boolean(user), // Restrict delete to admins
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'customer',
      type: 'group',
      fields: [
        {
          name: 'fullname',
          type: 'text',
          required: true,
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'address',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          admin: {
            components: {
              Field: '/components/Admin/OrderProductField',
            },
          },
        },
        {
          name: 'quantity',
          type: 'number',
          min: 1,
          required: true,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: 'Price at Order Time',
        },
        {
          name: 'color',
          type: 'text',
          label: 'Selected Color',
        },
      ],
    },
    {
      name: 'total',
      type: 'number',
      required: true,
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'uddoktapay',
      options: [
        { label: 'UddoktaPay', value: 'uddoktapay' },
      ],
    },
    {
      name: 'payment',
      type: 'group',
      fields: [
        {
          name: 'invoice_id',
          type: 'text',
        },
        {
          name: 'payment_url',
          type: 'text',
        },
        {
          name: 'trxId',
          type: 'text',
        },
        {
          name: 'amount',
          type: 'number',
          min: 0,
        },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
    },
  ],
}
