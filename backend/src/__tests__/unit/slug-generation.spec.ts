import { describe, it, expect } from "vitest"

/**
 * Pure function extracted from WeddingListModuleService.generateSlug.
 *
 * Generates a URL-safe slug from couple names by:
 * 1. Removing diacritics (NFD normalization + strip combining marks)
 * 2. Lowercasing
 * 3. Replacing & and + with spaces
 * 4. Stripping all non-alphanumeric, non-space, non-hyphen characters
 * 5. Trimming whitespace
 * 6. Collapsing whitespace into single hyphens
 * 7. Collapsing consecutive hyphens into a single hyphen
 */
function generateSlug(coupleNames: string): string {
  return coupleNames
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[&+]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

describe("generateSlug", () => {
  it("should handle ampersand-separated Portuguese names with accents", () => {
    expect(generateSlug("Joao & Maria")).toBe("joao-maria")
  })

  it("should remove diacritics from accented characters", () => {
    expect(generateSlug("Andre e Claudia")).toBe("andre-e-claudia")
  })

  it("should handle the tilde on 'a' (Joao)", () => {
    expect(generateSlug("Jo\u00e3o & Maria")).toBe("joao-maria")
  })

  it("should handle accented e (Andre)", () => {
    expect(generateSlug("Andr\u00e9 e Cl\u00e1udia")).toBe("andre-e-claudia")
  })

  it("should convert uppercase and replace + with space", () => {
    expect(generateSlug("PEDRO + ANA")).toBe("pedro-ana")
  })

  it("should trim leading and trailing whitespace", () => {
    expect(generateSlug("  spaces  ")).toBe("spaces")
  })

  it("should strip special characters that are not alphanumeric, space, or hyphen", () => {
    expect(generateSlug("special!@#chars")).toBe("specialchars")
  })

  it("should return empty string for empty input", () => {
    expect(generateSlug("")).toBe("")
  })

  it("should collapse double dashes into a single dash", () => {
    expect(generateSlug("a--b")).toBe("a-b")
  })

  it("should handle Portuguese names with cedilla and tilde", () => {
    expect(generateSlug("Jos\u00e9 e Concei\u00e7\u00e3o")).toBe("jose-e-conceicao")
  })

  it("should handle names with mixed accents and ampersand", () => {
    expect(generateSlug("Lu\u00eds & Nat\u00e1lia")).toBe("luis-natalia")
  })

  it("should handle multiple consecutive spaces", () => {
    expect(generateSlug("a   b")).toBe("a-b")
  })

  it("should handle string with only special characters", () => {
    expect(generateSlug("!@#$%^")).toBe("")
  })

  it("should handle string with numbers", () => {
    expect(generateSlug("casal2025")).toBe("casal2025")
  })

  it("should handle plus sign between names", () => {
    expect(generateSlug("Ana+Pedro")).toBe("ana-pedro")
  })

  it("should not produce leading or trailing hyphens", () => {
    const result = generateSlug("  hello  ")
    expect(result).not.toMatch(/^-/)
    expect(result).not.toMatch(/-$/)
  })
})
