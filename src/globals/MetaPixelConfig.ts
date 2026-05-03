import type { GlobalConfig } from 'payload'

export const MetaPixelConfig: GlobalConfig = {
  slug: 'meta-pixel-config',
  label: 'Meta Pixel & CAPI',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enable Meta Pixel',
      defaultValue: false,
      admin: {
        description: 'Enable or disable Meta Pixel tracking on the website.',
      },
    },
    {
      name: 'pixelId',
      type: 'text',
      label: 'Meta Pixel ID',
      required: false,
      admin: {
        description: 'Your Meta Pixel ID (e.g., 123456789012345).',
        condition: (data) => data?.enabled === true,
      },
    },
    {
      type: 'collapsible',
      label: 'Conversions API (CAPI)',
      admin: {
        condition: (data) => data?.enabled === true,
      },
      fields: [
        {
          name: 'capiEnabled',
          type: 'checkbox',
          label: 'Enable Conversions API',
          defaultValue: false,
          admin: {
            description: 'Enable server-side events via Meta Conversions API.',
          },
        },
        {
          name: 'accessToken',
          type: 'text',
          label: 'CAPI Access Token',
          required: false,
          admin: {
            description: 'Your Meta Conversions API access token.',
            condition: (data) => data?.capiEnabled === true,
          },
        },
        {
          name: 'testEventCode',
          type: 'text',
          label: 'Test Event Code',
          required: false,
          admin: {
            description: 'Optional test event code for debugging (leave empty for production).',
            condition: (data) => data?.capiEnabled === true,
          },
        },
      ],
    },
    {
      name: 'events',
      type: 'group',
      label: 'Event Configuration',
      admin: {
        condition: (data) => data?.enabled === true,
      },
      fields: [
        {
          name: 'pageView',
          type: 'checkbox',
          label: 'Track Page Views',
          defaultValue: true,
        },
        {
          name: 'viewContent',
          type: 'checkbox',
          label: 'Track View Content (Product Details)',
          defaultValue: true,
        },
        {
          name: 'addToCart',
          type: 'checkbox',
          label: 'Track Add to Cart',
          defaultValue: true,
        },
        {
          name: 'initiateCheckout',
          type: 'checkbox',
          label: 'Track Initiate Checkout',
          defaultValue: true,
        },
        {
          name: 'purchase',
          type: 'checkbox',
          label: 'Track Purchase',
          defaultValue: true,
        },
      ],
    },
  ],
}
