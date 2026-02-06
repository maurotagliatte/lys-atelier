import { describe, it, expect } from "vitest"
import {
  PostAdminCreateWeddingList,
  PutAdminUpdateWeddingList,
  GetAdminWeddingListsParams,
} from "../../api/admin/wedding-lists/validators"

describe("PostAdminCreateWeddingList", () => {
  const validInput = {
    couple_names: "Joao e Maria",
    wedding_date: "2025-06-15T00:00:00.000Z",
  }

  it("should accept valid input with only required fields", () => {
    const result = PostAdminCreateWeddingList.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.couple_names).toBe("Joao e Maria")
      expect(result.data.wedding_date).toBe("2025-06-15T00:00:00.000Z")
    }
  })

  it("should apply default values for is_active and primary_color", () => {
    const result = PostAdminCreateWeddingList.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_active).toBe(true)
      expect(result.data.primary_color).toBe("#d4af37")
      expect(result.data.secondary_color).toBe("#ffffff")
      expect(result.data.font_family).toBe("Playfair Display")
    }
  })

  it("should reject missing couple_names", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      wedding_date: "2025-06-15T00:00:00.000Z",
    })
    expect(result.success).toBe(false)
  })

  it("should reject couple_names shorter than 3 characters", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      couple_names: "AB",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find(
        (i) => i.path[0] === "couple_names"
      )
      expect(nameError).toBeDefined()
    }
  })

  it("should reject invalid wedding_date (not ISO 8601)", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      wedding_date: "15/06/2025",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const dateError = result.error.issues.find(
        (i) => i.path[0] === "wedding_date"
      )
      expect(dateError).toBeDefined()
    }
  })

  it("should reject invalid primary_color (not hex)", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      primary_color: "red",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const colorError = result.error.issues.find(
        (i) => i.path[0] === "primary_color"
      )
      expect(colorError).toBeDefined()
    }
  })

  it("should accept a valid hex color", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      primary_color: "#aabbcc",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.primary_color).toBe("#aabbcc")
    }
  })

  it("should reject slug with uppercase letters", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      slug: "JoaoMaria",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const slugError = result.error.issues.find(
        (i) => i.path[0] === "slug"
      )
      expect(slugError).toBeDefined()
    }
  })

  it("should reject slug with special characters", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      slug: "joao_maria!",
    })
    expect(result.success).toBe(false)
  })

  it("should accept a valid slug", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      slug: "joao-e-maria",
    })
    expect(result.success).toBe(true)
  })

  it("should reject slug with leading hyphen", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      slug: "-joao",
    })
    expect(result.success).toBe(false)
  })

  it("should reject slug with trailing hyphen", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      slug: "joao-",
    })
    expect(result.success).toBe(false)
  })

  it("should accept input with product_ids", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      product_ids: ["prod_123", "prod_456"],
    })
    expect(result.success).toBe(true)
  })

  it("should accept input with metadata", () => {
    const result = PostAdminCreateWeddingList.safeParse({
      ...validInput,
      metadata: { theme: "classic" },
    })
    expect(result.success).toBe(true)
  })
})

describe("PutAdminUpdateWeddingList", () => {
  it("should accept an empty object (all fields optional)", () => {
    const result = PutAdminUpdateWeddingList.safeParse({})
    expect(result.success).toBe(true)
  })

  it("should accept partial updates", () => {
    const result = PutAdminUpdateWeddingList.safeParse({
      couple_names: "Pedro e Ana",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.couple_names).toBe("Pedro e Ana")
    }
  })

  it("should reject invalid couple_names in update", () => {
    const result = PutAdminUpdateWeddingList.safeParse({
      couple_names: "AB",
    })
    expect(result.success).toBe(false)
  })

  it("should accept nullable couple_photo_url", () => {
    const result = PutAdminUpdateWeddingList.safeParse({
      couple_photo_url: null,
    })
    expect(result.success).toBe(true)
  })

  it("should accept nullable custom_message", () => {
    const result = PutAdminUpdateWeddingList.safeParse({
      custom_message: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("GetAdminWeddingListsParams", () => {
  it("should apply defaults when given an empty object", () => {
    const result = GetAdminWeddingListsParams.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offset).toBe(0)
      expect(result.data.limit).toBe(20)
    }
  })

  it("should coerce string numbers to integers", () => {
    const result = GetAdminWeddingListsParams.safeParse({
      offset: "10",
      limit: "50",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offset).toBe(10)
      expect(result.data.limit).toBe(50)
    }
  })

  it('should preprocess is_active "true" to boolean true', () => {
    const result = GetAdminWeddingListsParams.safeParse({
      is_active: "true",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_active).toBe(true)
    }
  })

  it('should preprocess is_active "false" to boolean false', () => {
    const result = GetAdminWeddingListsParams.safeParse({
      is_active: "false",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_active).toBe(false)
    }
  })

  it("should accept boolean is_active directly", () => {
    const result = GetAdminWeddingListsParams.safeParse({
      is_active: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_active).toBe(true)
    }
  })

  it("should reject limit greater than 100", () => {
    const result = GetAdminWeddingListsParams.safeParse({
      limit: 200,
    })
    expect(result.success).toBe(false)
  })

  it("should reject negative offset", () => {
    const result = GetAdminWeddingListsParams.safeParse({
      offset: -1,
    })
    expect(result.success).toBe(false)
  })

  it("should accept optional search query", () => {
    const result = GetAdminWeddingListsParams.safeParse({
      q: "joao",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe("joao")
    }
  })
})
