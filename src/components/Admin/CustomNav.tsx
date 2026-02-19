'use client'

import { useConfig, useNav } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import {
  LayoutDashboard,
  Users,
  Image,
  ShoppingBag,
  ShoppingCart,
  List,
  X,
  Settings,
  Edit,
} from 'lucide-react'
import { Logo } from '../Logo'

const icons: Record<string, any> = {
  users: Users,
  media: Image,
  products: ShoppingBag,
  orders: ShoppingCart,
  categories: List,
  'site-settings': Settings,
  'page-editor': Edit,
}

export const CustomNav = () => {
  const { config } = useConfig()
  const { setNavOpen } = useNav()
  const pathname = usePathname()

  const collections = config.collections.filter(
    (collection) => collection.slug !== 'users' && !collection.slug.startsWith('payload'),
  )

  // Separate common entities
  const commonEntities = config.collections.filter((collection) => collection.slug === 'users')

  return (
    <nav className="custom-nav">
      <div className="custom-nav__header">
        <div className="custom-nav__brand">
          <Logo className="custom-nav__logo" />
        </div>
        <button
          className="custom-nav__toggle"
          onClick={() => setNavOpen(false)}
          type="button"
          aria-label="Close Navigation"
        >
          <X size={24} />
        </button>
      </div>

      <div className="custom-nav__list">
        <Link
          href="/admin"
          className={`custom-nav__link ${pathname === '/admin' ? 'custom-nav__link--active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span className="custom-nav__link-text">Dashboard</span>
        </Link>
      </div>

      <div className="custom-nav__section">
        <p className="custom-nav__section-title">Shop</p>
        <div className="custom-nav__list">
          {collections.map((collection) => {
            const Icon = icons[collection.slug] || List
            const href = `/admin/collections/${collection.slug}`
            const isActive = pathname.startsWith(href)

            return (
              <Link
                key={collection.slug}
                href={href}
                className={`custom-nav__link ${isActive ? 'custom-nav__link--active' : ''}`}
              >
                <Icon size={18} />
                <span className="custom-nav__link-text">
                  {(collection.labels.plural as string) || collection.slug}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="custom-nav__section">
        <p className="custom-nav__section-title">System</p>
        <div className="custom-nav__list">
          {commonEntities.map((collection) => {
            const Icon = icons[collection.slug] || List
            const href = `/admin/collections/${collection.slug}`
            const isActive = pathname.startsWith(href)

            return (
              <Link
                key={collection.slug}
                href={href}
                className={`custom-nav__link ${isActive ? 'custom-nav__link--active' : ''}`}
              >
                <Icon size={18} />
                <span className="custom-nav__link-text">
                  {(collection.labels.plural as string) || collection.slug}
                </span>
              </Link>
            )
          })}
          {config.globals.map((global) => {
            const Icon = icons[global.slug] || Settings
            const href = `/admin/globals/${global.slug}`
            const isActive = pathname.startsWith(href)

            return (
              <Link
                key={global.slug}
                href={href}
                className={`custom-nav__link ${isActive ? 'custom-nav__link--active' : ''}`}
              >
                <Icon size={18} />
                <span className="custom-nav__link-text">
                  {(global.label as string) || global.slug}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
