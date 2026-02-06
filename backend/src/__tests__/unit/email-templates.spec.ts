import { describe, it, expect } from "vitest"
import {
  giftReceivedTemplate,
  purchaseConfirmationTemplate,
  welcomeTemplate,
} from "../../lib/email-templates"

describe("giftReceivedTemplate", () => {
  const defaultData = {
    coupleNames: "Joao e Maria",
    guestEmail: "guest@example.com",
    items: [{ title: "Jogo de Panelas", quantity: 1 }],
    total: "R$ 250,00",
    currencyCode: "BRL",
    orderDisplayId: 1001,
    slug: "joao-e-maria",
  }

  it("should return a string starting with <!DOCTYPE html>", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/)
  })

  it("should contain the brand name LYS ATELIER", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html).toContain("LYS ATELIER")
  })

  it("should contain the couple names", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html).toContain("Joao e Maria")
  })

  it("should contain the guest email", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html).toContain("guest@example.com")
  })

  it("should contain the order display ID", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html).toContain("#1001")
  })

  it("should contain the item title", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html).toContain("Jogo de Panelas")
  })

  it("should contain the total", () => {
    const html = giftReceivedTemplate(defaultData)
    expect(html).toContain("R$ 250,00")
  })

  it("should escape HTML in couple names to prevent XSS", () => {
    const html = giftReceivedTemplate({
      ...defaultData,
      coupleNames: '<script>alert("xss")</script>',
    })
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
  })

  it("should escape HTML in guest email", () => {
    const html = giftReceivedTemplate({
      ...defaultData,
      guestEmail: '<img onerror="alert(1)">',
    })
    expect(html).not.toContain('<img onerror')
    expect(html).toContain("&lt;img")
  })

  it("should escape HTML in item titles", () => {
    const html = giftReceivedTemplate({
      ...defaultData,
      items: [{ title: '<b>bold</b>', quantity: 1 }],
    })
    expect(html).not.toContain("<b>bold</b>")
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;")
  })

  it("should display multiple items", () => {
    const html = giftReceivedTemplate({
      ...defaultData,
      items: [
        { title: "Item A", quantity: 2 },
        { title: "Item B", quantity: 1 },
      ],
    })
    expect(html).toContain("Item A")
    expect(html).toContain("Item B")
    expect(html).toContain("2x")
    expect(html).toContain("1x")
  })
})

describe("purchaseConfirmationTemplate", () => {
  const defaultData = {
    coupleNames: "Pedro e Ana",
    items: [{ title: "Aparelho de Jantar", quantity: 1, unitPrice: 35000 }],
    total: "R$ 350,00",
    currencyCode: "BRL",
    orderDisplayId: 2002,
    slug: "pedro-e-ana",
  }

  it("should return a string starting with <!DOCTYPE html>", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/)
  })

  it("should contain the brand name LYS ATELIER", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    expect(html).toContain("LYS ATELIER")
  })

  it("should contain the order display ID", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    expect(html).toContain("#2002")
  })

  it("should contain the item title", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    expect(html).toContain("Aparelho de Jantar")
  })

  it("should contain the couple names", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    expect(html).toContain("Pedro e Ana")
  })

  it("should include the thank you message", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    expect(html).toContain("Obrigado pelo presente!")
  })

  it("should display item prices", () => {
    const html = purchaseConfirmationTemplate(defaultData)
    // The template formats unitPrice / 100 as BRL currency
    // 35000 / 100 = 350.00
    expect(html).toContain("350")
  })

  it("should display multiple items with prices", () => {
    const html = purchaseConfirmationTemplate({
      ...defaultData,
      items: [
        { title: "Item A", quantity: 1, unitPrice: 10000 },
        { title: "Item B", quantity: 2, unitPrice: 5000 },
      ],
    })
    expect(html).toContain("Item A")
    expect(html).toContain("Item B")
  })
})

describe("welcomeTemplate", () => {
  const defaultData = {
    coupleNames: "Luis e Natalia",
    slug: "luis-e-natalia",
    weddingDate: "2025-06-15T00:00:00.000Z",
    listUrl: "https://lysatelier.com.br/lista/luis-e-natalia",
  }

  it("should return a string starting with <!DOCTYPE html>", () => {
    const html = welcomeTemplate(defaultData)
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/)
  })

  it("should contain the brand name LYS ATELIER", () => {
    const html = welcomeTemplate(defaultData)
    expect(html).toContain("LYS ATELIER")
  })

  it("should contain the couple names", () => {
    const html = welcomeTemplate(defaultData)
    expect(html).toContain("Luis e Natalia")
  })

  it("should contain the list URL", () => {
    const html = welcomeTemplate(defaultData)
    expect(html).toContain("https://lysatelier.com.br/lista/luis-e-natalia")
  })

  it("should contain the list URL as a clickable link", () => {
    const html = welcomeTemplate(defaultData)
    expect(html).toContain('href="https://lysatelier.com.br/lista/luis-e-natalia"')
  })

  it("should contain the welcome message", () => {
    const html = welcomeTemplate(defaultData)
    expect(html).toContain("Bem-vindos ao Lys Atelier!")
  })

  it("should contain the next steps section", () => {
    const html = welcomeTemplate(defaultData)
    expect(html).toContain("Proximos passos")
  })

  it("should escape HTML in couple names", () => {
    const html = welcomeTemplate({
      ...defaultData,
      coupleNames: '<script>alert("xss")</script>',
    })
    expect(html).not.toContain("<script>")
    expect(html).toContain("&lt;script&gt;")
  })

  it("should escape HTML in the list URL", () => {
    const html = welcomeTemplate({
      ...defaultData,
      listUrl: 'https://example.com/"><script>',
    })
    expect(html).not.toContain('"><script>')
    expect(html).toContain("&quot;&gt;&lt;script&gt;")
  })
})
