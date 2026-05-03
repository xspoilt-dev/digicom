'use client'

import { useField, useListDrawer, useDocumentDrawer } from '@payloadcms/ui'
import { useEffect, useState, useCallback } from 'react'
import type { Media } from '@/payload-types'
import { Image as ImageIcon, X, Upload, Plus } from 'lucide-react'

type Props = {
  path: string
  label?: string
}

export default function ImageField({ path, label }: Props) {
  const { value, setValue } = useField<number | null>({ path })
  const [media, setMedia] = useState<Media | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Drawer for selecting existing media
  const [ListDrawer, listDrawerSlug, { openDrawer, closeDrawer: closeListDrawer }] = useListDrawer({
    collectionSlugs: ['media'],
  })

  // Drawer for creating new media
  const [
    DocumentDrawer,
    documentDrawerSlug,
    { openDrawer: openDocumentDrawer, closeDrawer: closeDocumentDrawer },
  ] = useDocumentDrawer({
    collectionSlug: 'media',
  })

  useEffect(() => {
    if (value && (typeof value === 'number' || typeof value === 'string')) {
      // If we already have the media loaded and it matches the value, skipping fetch
      if (String(media?.id) === String(value)) return

      setIsLoading(true)
      const cachedMedia = value as unknown as Media
      if (cachedMedia?.url) {
        setMedia(cachedMedia)
        setIsLoading(false)
        return
      }

      fetch(`/api/media/${value}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        })
        .then((data) => {
          setMedia(data)
          setIsLoading(false)
        })
        .catch(() => {
          setMedia(null)
          setIsLoading(false)
        })
    } else {
      setMedia(null)
      setIsLoading(false)
    }
  }, [value, media])

  const handleSelect = useCallback(
    ({ docID, doc }: { docID: string | number; doc: any }) => {
      setValue(docID)
      if (doc) {
        setMedia(doc as Media)
      } else {
        // Fallback if doc is not provided, fetch again or rely on useEffect
      }
      closeListDrawer()
    },
    [setValue, closeListDrawer],
  )

  return (
    <div style={{ marginBottom: '24px' }}>
      <label
        style={{
          marginBottom: '8px',
          display: 'block',
          fontSize: '13px',
          lineHeight: '20px',
          letterSpacing: '0.2px',
          fontWeight: 600,
          color: 'var(--theme-elevation-800)',
          textTransform: 'uppercase',
        }}
      >
        {label || 'Image'}
      </label>

      {isLoading ? (
        <div
          style={{
            height: '200px',
            width: '100%',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ) : media?.url ? (
        <div
          style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--theme-elevation-150)',
            backgroundColor: 'var(--theme-elevation-50)',
            maxWidth: '400px',
          }}
          className="group"
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'auto',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
            }}
          >
            <img
              src={media.thumbnailURL || media.url || ''}
              alt={media.alt || 'Image'}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              padding: '12px',
              gap: '12px',
              borderTop: '1px solid var(--theme-elevation-150)',
              backgroundColor: 'var(--theme-card-bg)',
            }}
          >
            <button
              type="button"
              onClick={openDrawer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid var(--theme-elevation-200)',
                background: 'var(--theme-elevation-0)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <Upload size={14} /> Change
            </button>
            <button
              type="button"
              onClick={() => setValue(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #fee2e2',
                background: '#fff',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            onClick={openDrawer}
            style={{
              cursor: 'pointer',
              border: '2px dashed var(--theme-elevation-200)',
              borderRadius: '8px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              backgroundColor: 'var(--theme-bg)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--theme-elevation-400)'
              e.currentTarget.style.backgroundColor = 'var(--theme-elevation-50)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--theme-elevation-200)'
              e.currentTarget.style.backgroundColor = 'var(--theme-bg)'
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--theme-elevation-100)',
              }}
            >
              <ImageIcon
                className="text-gray-400"
                size={24}
                style={{ color: 'var(--theme-elevation-500)' }}
              />
            </div>
            <span
              style={{ fontSize: '14px', fontWeight: 500, color: 'var(--theme-elevation-600)' }}
            >
              Click to select an image
            </span>
          </div>

          <button
            type="button"
            onClick={openDocumentDrawer}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid var(--theme-elevation-200)',
              background: 'var(--theme-elevation-0)',
              cursor: 'pointer',
              fontSize: '13px',
              width: 'fit-content',
            }}
          >
            <Plus size={14} /> Upload New
          </button>
        </div>
      )}

      <ListDrawer onSelect={handleSelect} />
      <DocumentDrawer
        onSave={({ doc }) => {
          setValue(doc.id)
          setMedia(doc as Media)
          closeDocumentDrawer()
        }}
      />
    </div>
  )
}
