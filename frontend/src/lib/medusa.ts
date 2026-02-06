import type {
  WeddingList,
  WeddingProduct,
  Cart,
  GiftMessage,
  BillingInfo,
  PaymentMethod,
  CreditCardData,
  PaymentResult,
} from '@/types/wedding'

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function medusaFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const url = `${MEDUSA_BACKEND_URL}${path}`
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!res.ok) {
      console.error(`Medusa API error: ${res.status} ${res.statusText} - ${url}`)
      return null
    }

    return res.json() as Promise<T>
  } catch (error) {
    console.error(`Medusa API fetch failed: ${url}`, error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Wedding Lists
// ---------------------------------------------------------------------------

export async function getWeddingListBySlug(
  slug: string,
): Promise<WeddingList | null> {
  const data = await medusaFetch<{ wedding_list: WeddingList }>(
    `/store/wedding-lists/${slug}`,
    { next: { revalidate: 60 } },
  )
  return data?.wedding_list ?? null
}

export async function getWeddingListProducts(
  slug: string,
  params?: {
    limit?: number
    offset?: number
    category?: string
    sort?: string
  },
): Promise<{ products: WeddingProduct[]; count: number }> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  if (params?.category) searchParams.set('category', params.category)
  if (params?.sort) searchParams.set('sort', params.sort)

  const query = searchParams.toString()
  const path = `/store/wedding-lists/${slug}/products${query ? `?${query}` : ''}`

  const data = await medusaFetch<{
    products: WeddingProduct[]
    count: number
  }>(path, { next: { revalidate: 60 } })

  return data ?? { products: [], count: 0 }
}

export async function getWeddingProduct(
  slug: string,
  handle: string,
): Promise<WeddingProduct | null> {
  const data = await medusaFetch<{ product: WeddingProduct }>(
    `/store/wedding-lists/${slug}/products/${handle}`,
    { next: { revalidate: 60 } },
  )
  return data?.product ?? null
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export async function createCart(weddingListSlug: string): Promise<Cart | null> {
  const data = await medusaFetch<{ cart: Cart }>('/store/carts', {
    method: 'POST',
    body: JSON.stringify({ wedding_list_slug: weddingListSlug }),
  })
  return data?.cart ?? null
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await medusaFetch<{ cart: Cart }>(`/store/carts/${cartId}`)
  return data?.cart ?? null
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1,
): Promise<Cart | null> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items`,
    {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
    },
  )
  return data?.cart ?? null
}

export async function updateCartItem(
  cartId: string,
  itemId: string,
  quantity: number,
): Promise<Cart | null> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items/${itemId}`,
    {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    },
  )
  return data?.cart ?? null
}

export async function removeFromCart(
  cartId: string,
  itemId: string,
): Promise<Cart | null> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items/${itemId}`,
    { method: 'DELETE' },
  )
  return data?.cart ?? null
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export async function completeCheckout(
  cartId: string,
  giftMessage: GiftMessage,
  email: string,
  billingInfo: BillingInfo,
  paymentMethod: PaymentMethod,
  creditCard?: CreditCardData,
): Promise<PaymentResult | null> {
  const body: Record<string, unknown> = {
    gift_message: giftMessage,
    email,
    billing_info: billingInfo,
    payment_method: paymentMethod,
  }

  if (paymentMethod === 'CREDIT_CARD' && creditCard) {
    body.credit_card = {
      holder_name: creditCard.holder_name,
      number: creditCard.number.replace(/\s/g, ''),
      expiry_month: creditCard.expiry_month,
      expiry_year: creditCard.expiry_year,
      cvv: creditCard.cvv,
    }
  }

  const data = await medusaFetch<PaymentResult>(
    `/store/carts/${cartId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
  return data
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatPrice(amount: number, currencyCode: string = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString))
}
