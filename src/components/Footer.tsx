import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Facebook, Instagram, Phone, Mail, MapPin, MessageCircle } from 'lucide-react'
import { Logo } from './Logo'
import TikTokIcon from './TikTokIcon'

export async function Footer() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({
    slug: 'site-settings',
  })

  // Safe checks for data structure
  const socialLinks = settings?.socialLinks
  const contactInfo = settings?.contactInfo

  return (
    <footer className="bg-background text-foreground mt-auto border-t border-border/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <Logo className="w-auto h-8" />
            <p className="text-muted-foreground text-sm">YOUR IDENTITY</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Return and Cancelation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {contactInfo?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0" />
                  <span>{contactInfo.address}</span>
                </li>
              )}
              {contactInfo?.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 shrink-0" />
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="hover:text-primary transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
              )}
              {contactInfo?.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0" />
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
            <div className="flex gap-4">
              {socialLinks?.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground p-2 rounded-full transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {socialLinks?.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground p-2 rounded-full transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks?.whatsapp && (
                <a
                  href={`https://wa.me/${socialLinks.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground p-2 rounded-full transition-all"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {socialLinks?.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground p-2 rounded-full transition-all"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()}{' '}
            <a href="https://theforgebit.com/" target="_blank" rel="follow" className="underline">
              Forgebit
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
