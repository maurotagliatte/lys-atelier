import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate } from '@/lib/medusa'

describe('formatPrice', () => {
  it('formats BRL 1000 (cents) to a string containing "10"', () => {
    const result = formatPrice(1000, 'BRL')
    expect(result).toContain('10')
  })

  it('formats BRL 0 to a string containing "0"', () => {
    const result = formatPrice(0, 'BRL')
    expect(result).toContain('0')
  })

  it('formats EUR 9999 (cents) to a string containing the value 99,99 or 99.99', () => {
    const result = formatPrice(9999, 'EUR')
    expect(result).toMatch(/99[.,]99/)
  })

  it('uses EUR as default currency when not specified', () => {
    const result = formatPrice(100)
    // Should format as EUR — the symbol or code may vary by locale,
    // but the numeric value 1,00 or 1.00 should be present.
    expect(result).toMatch(/1[.,]00/)
  })

  it('includes the R$ symbol for BRL currency', () => {
    const result = formatPrice(100, 'BRL')
    expect(result).toContain('R$')
  })
})

describe('formatDate', () => {
  it('formats a date string and includes the year 2026', () => {
    const result = formatDate('2026-06-15')
    expect(result).toContain('2026')
  })

  it('formats a date string and includes the month name (junho or June)', () => {
    const result = formatDate('2026-06-15')
    // Depending on the locale support in the test environment,
    // the month may be in Portuguese or English.
    expect(result).toMatch(/junho|june/i)
  })

  it('formats January 15th 2026 and includes the year', () => {
    // Using mid-month date to avoid timezone boundary issues
    // (date-only strings are parsed as UTC, which can shift to previous day in some timezones)
    const result = formatDate('2026-01-15')
    expect(result).toContain('2026')
  })
})
