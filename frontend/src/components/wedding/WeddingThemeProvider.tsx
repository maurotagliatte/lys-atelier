'use client'

import { useEffect, type ReactNode } from 'react'
import type { WeddingTheme } from '@/types/wedding'

interface WeddingThemeProviderProps {
  theme: WeddingTheme
  children: ReactNode
}

/**
 * Applies CSS custom properties from a WeddingTheme to the DOM so that
 * all descendant elements can reference them via var(--wedding-*).
 *
 * Must be a client component because it writes to the DOM imperatively.
 */
export default function WeddingThemeProvider({
  theme,
  children,
}: WeddingThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement

    root.style.setProperty('--wedding-primary', theme.primary_color)
    root.style.setProperty('--wedding-secondary', theme.secondary_color)
    root.style.setProperty('--wedding-accent', theme.accent_color)
    root.style.setProperty('--wedding-text', theme.text_color)
    root.style.setProperty('--wedding-background', theme.background_color)
    root.style.setProperty('--wedding-font', theme.font_family)
    root.style.setProperty('--wedding-heading-font', theme.heading_font_family)
    root.style.setProperty('--wedding-border-radius', theme.border_radius)

    return () => {
      root.style.removeProperty('--wedding-primary')
      root.style.removeProperty('--wedding-secondary')
      root.style.removeProperty('--wedding-accent')
      root.style.removeProperty('--wedding-text')
      root.style.removeProperty('--wedding-background')
      root.style.removeProperty('--wedding-font')
      root.style.removeProperty('--wedding-heading-font')
      root.style.removeProperty('--wedding-border-radius')
    }
  }, [theme])

  return (
    <div data-wedding-theme="" className="min-h-screen">
      {children}
    </div>
  )
}
