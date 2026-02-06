export interface WeddingList {
  id: string
  slug: string
  title: string
  couple_name_1: string
  couple_name_2: string
  wedding_date: string
  message?: string
  cover_image_url?: string
  couple_photo_url?: string
  theme: WeddingTheme
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WeddingTheme {
  primary_color: string
  secondary_color: string
  accent_color: string
  text_color: string
  background_color: string
  font_family: string
  heading_font_family: string
  border_radius: string
  hero_layout?: 'centered' | 'side-by-side' | 'overlay'
}

export interface WeddingProduct {
  id: string
  title: string
  handle: string
  description: string
  thumbnail: string | null
  images: ProductImage[]
  variants: ProductVariant[]
  price: ProductPrice
  collection_id?: string
  status: 'published' | 'draft'
  metadata?: Record<string, unknown>
  /** How many have been "gifted" (purchased) */
  gifted_count: number
  /** Total desired quantity */
  desired_quantity: number
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
}

export interface ProductVariant {
  id: string
  title: string
  sku?: string
  prices: ProductPrice[]
  inventory_quantity: number
  options: Record<string, string>
}

export interface ProductPrice {
  amount: number
  currency_code: string
  formatted: string
}

export interface CartItem {
  id: string
  product_id: string
  variant_id: string
  title: string
  thumbnail: string | null
  quantity: number
  unit_price: number
  total: number
  currency_code: string
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  tax_total: number
  shipping_total: number
  total: number
  currency_code: string
}

export interface GiftMessage {
  from_name: string
  message?: string
  is_anonymous: boolean
}

export type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

export interface CreditCardData {
  holder_name: string
  number: string
  expiry_month: string
  expiry_year: string
  cvv: string
}

export interface BillingInfo {
  full_name: string
  cpf: string
  phone: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postal_code: string
  country_code: string
}

export interface CheckoutData {
  cart_id: string
  gift_message: GiftMessage
  email: string
  billing_info: BillingInfo
  payment_method: PaymentMethod
  credit_card?: CreditCardData
}

export interface PaymentResult {
  order_id: string
  payment_status: 'PENDING' | 'CONFIRMED' | 'REFUSED'
  payment_method: PaymentMethod
  pix_qr_code?: string
  pix_qr_code_url?: string
  pix_copy_paste?: string
  boleto_url?: string
  boleto_barcode?: string
}

export interface Address {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}
