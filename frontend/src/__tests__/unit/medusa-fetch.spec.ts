import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set environment variable before importing the module
vi.stubEnv('NEXT_PUBLIC_MEDUSA_BACKEND_URL', 'http://test-medusa:9000')

// Dynamic import so the env variable is picked up
const {
  getWeddingListBySlug,
  createCart,
  addToCart,
  formatPrice,
} = await import('@/lib/medusa')

describe('medusaFetch and API functions', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getWeddingListBySlug', () => {
    it('calls the correct URL for a given slug', async () => {
      const mockWeddingList = { id: '1', slug: 'maria-joao', title: 'Maria & Joao' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wedding_list: mockWeddingList }),
      })

      const result = await getWeddingListBySlug('maria-joao')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toBe('http://test-medusa:9000/store/wedding-lists/maria-joao')
      expect(result).toEqual(mockWeddingList)
    })

    it('returns null when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await getWeddingListBySlug('bad-slug')

      expect(result).toBeNull()
    })

    it('returns null on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await getWeddingListBySlug('missing-list')

      expect(result).toBeNull()
    })
  })

  describe('createCart', () => {
    it('sends POST with the correct body', async () => {
      const mockCart = { id: 'cart-123', items: [], total: 0 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cart: mockCart }),
      })

      const result = await createCart('maria-joao')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('http://test-medusa:9000/store/carts')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({
        wedding_list_slug: 'maria-joao',
      })
      expect(result).toEqual(mockCart)
    })
  })

  describe('addToCart', () => {
    it('sends the correct variant_id and quantity', async () => {
      const mockCart = { id: 'cart-123', items: [{ id: 'item-1' }], total: 5000 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cart: mockCart }),
      })

      const result = await addToCart('cart-123', 'variant-abc', 2)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('http://test-medusa:9000/store/carts/cart-123/line-items')
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({
        variant_id: 'variant-abc',
        quantity: 2,
      })
      expect(result).toEqual(mockCart)
    })
  })

  describe('formatPrice (various currencies)', () => {
    it('handles USD currency', () => {
      const result = formatPrice(2500, 'USD')
      expect(result).toMatch(/25[.,]00/)
    })

    it('handles BRL currency with correct symbol', () => {
      const result = formatPrice(5000, 'BRL')
      expect(result).toContain('R$')
      expect(result).toMatch(/50[.,]00/)
    })

    it('handles EUR currency', () => {
      const result = formatPrice(1500, 'EUR')
      expect(result).toMatch(/15[.,]00/)
    })
  })
})
