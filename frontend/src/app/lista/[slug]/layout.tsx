import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWeddingListBySlug, formatDate } from '@/lib/medusa'
import WeddingThemeProvider from '@/components/wedding/WeddingThemeProvider'
import WeddingNav from '@/components/wedding/WeddingNav'
import { CartProvider } from '@/lib/cart-context'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const weddingList = await getWeddingListBySlug(slug)

  if (!weddingList) {
    return { title: 'Lista nao encontrada - Lys Atelier' }
  }

  const title = `${weddingList.couple_name_1} & ${weddingList.couple_name_2} - Lista de Casamento`
  const description = weddingList.message
    ? weddingList.message
    : `Lista de casamento de ${weddingList.couple_name_1} & ${weddingList.couple_name_2} - ${formatDate(weddingList.wedding_date)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: weddingList.cover_image_url
        ? [{ url: weddingList.cover_image_url, width: 1200, height: 630 }]
        : [],
    },
  }
}

export default async function WeddingListLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params
  const weddingList = await getWeddingListBySlug(slug)

  if (!weddingList || !weddingList.is_active) {
    notFound()
  }

  return (
    <WeddingThemeProvider theme={weddingList.theme}>
      <CartProvider slug={slug}>
        <WeddingNav
          slug={slug}
          coupleName1={weddingList.couple_name_1}
          coupleName2={weddingList.couple_name_2}
        />
        {children}
      </CartProvider>
    </WeddingThemeProvider>
  )
}
