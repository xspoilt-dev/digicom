import React from 'react'

interface RichTextNode {
  type: string
  children?: RichTextNode[]
  text?: string
  tag?: string
  format?: number
  listType?: 'number' | 'bullet'
  fields?: {
    url?: string
    newTab?: boolean
  }
  [key: string]: unknown
}

export const RichTextParser = ({ content }: { content: any }) => {
  const root = content?.root as { children: RichTextNode[] } | undefined
  if (!root?.children) return null

  return (
    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground">
      {serialize(root.children)}
    </div>
  )
}

const serialize = (children: RichTextNode[]): React.ReactNode[] => {
  return children.map((node, i) => {
    if (!node) {
      return null
    }

    if (node.type === 'text') {
      let text = <span dangerouslySetInnerHTML={{ __html: node.text || '' }} />
      // Bitwise checks for formatting
      if (node.format && node.format & 1) text = <strong key={i}>{text}</strong>
      if (node.format && node.format & 2) text = <em key={i}>{text}</em>
      if (node.format && node.format & 8) text = <u key={i}>{text}</u>

      return <React.Fragment key={i}>{text}</React.Fragment>
    }

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={i} className="mb-4 leading-relaxed">
            {node.children ? serialize(node.children) : null}
          </p>
        )
      case 'heading':
        const Tag = (node.tag || 'h1') as React.ElementType
        return (
          <Tag key={i} className="font-bold text-foreground mt-6 mb-3">
            {node.children ? serialize(node.children) : null}
          </Tag>
        )
      case 'list':
        const ListTag = node.listType === 'number' ? 'ol' : 'ul'
        return (
          <ListTag key={i} className="list-inside list-disc mb-4 pl-4">
            {node.children ? serialize(node.children) : null}
          </ListTag>
        )
      case 'listitem':
        return <li key={i}>{node.children ? serialize(node.children) : null}</li>
      case 'link':
        return (
          <a
            key={i}
            href={node.fields?.url}
            target={node.fields?.newTab ? '_blank' : '_self'}
            className="text-primary hover:underline"
            rel="noopener noreferrer"
          >
            {node.children ? serialize(node.children) : null}
          </a>
        )
      default:
        // Fallback for unknown nodes
        return (
          <React.Fragment key={i}>{node.children ? serialize(node.children) : null}</React.Fragment>
        )
    }
  })
}
