import { revalidatePath } from 'next/cache'
import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'contactInfo',
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Contact Email',
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Physical Address',
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Media',
      fields: [
        {
          name: 'facebook',
          type: 'text',
          label: 'Facebook URL',
        },
        {
          name: 'messenger',
          type: 'text',
          label: 'Messenger URL',
        },
        {
          name: 'instagram',
          type: 'text',
          label: 'Instagram URL',
        },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'WhatsApp Number',
          admin: {
            description: 'Enter number with country code (e.g., 8801700000000)',
          },
        },
        {
          name: 'tiktok',
          type: 'text',
          label: 'TikTok URL',
        },
      ],
    },
    {
      name: 'delivery',
      type: 'group',
      label: 'Delivery Charges',
      hooks: {
        afterChange: [
          async () => {
            // Revalidate the checkout page when delivery settings change
            revalidatePath('/checkout')
          },
        ],
      },
      fields: [
        {
          name: 'insideDhaka',
          type: 'number',
          label: 'Inside Dhaka Charge',
          required: true,
          defaultValue: 70,
        },
        {
          name: 'outsideDhaka',
          type: 'number',
          label: 'Outside Dhaka Charge',
          required: true,
          defaultValue: 130,
        },
      ],
    },
    {
      name: 'paymentInstructions',
      type: 'group',
      label: 'Checkout Payment Instructions',
      hooks: {
        afterChange: [
          async () => {
            revalidatePath('/checkout')
          },
        ],
      },
      fields: [
        {
          name: 'partialPayment',
          type: 'textarea',
          label: 'Partial Payment Instructions',
          admin: {
            description: 'Shown when customer selects Partial Payment (Delivery Charge).',
          },
        },
        {
          name: 'fullPayment',
          type: 'textarea',
          label: 'Full Payment Instructions',
          admin: {
            description: 'Shown when customer selects Full Payment.',
          },
        },
      ],
    },
  ],
}
