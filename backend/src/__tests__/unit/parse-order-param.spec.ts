import { describe, it, expect } from "vitest"
import { parseOrderParam } from "../../api/admin/wedding-lists/utils"

describe("parseOrderParam", () => {
  it("should parse a dash-prefixed field as DESC", () => {
    expect(parseOrderParam("-created_at")).toEqual({ created_at: "DESC" })
  })

  it("should parse field:ASC as ASC", () => {
    expect(parseOrderParam("created_at:ASC")).toEqual({ created_at: "ASC" })
  })

  it("should parse field:DESC as DESC", () => {
    expect(parseOrderParam("created_at:DESC")).toEqual({ created_at: "DESC" })
  })

  it("should parse a plain field name as ASC", () => {
    expect(parseOrderParam("name")).toEqual({ name: "ASC" })
  })

  it("should parse multiple comma-separated fields", () => {
    expect(parseOrderParam("-created_at,name")).toEqual({
      created_at: "DESC",
      name: "ASC",
    })
  })

  it("should handle spaces around parts", () => {
    expect(parseOrderParam("-a, b:DESC, c:ASC")).toEqual({
      a: "DESC",
      b: "DESC",
      c: "ASC",
    })
  })

  it("should treat case-insensitive direction (asc)", () => {
    expect(parseOrderParam("field:asc")).toEqual({ field: "ASC" })
  })

  it("should treat case-insensitive direction (desc)", () => {
    expect(parseOrderParam("field:desc")).toEqual({ field: "DESC" })
  })

  it("should handle unknown direction as DESC (fallback)", () => {
    // Any non-ASC value after colon defaults to DESC
    expect(parseOrderParam("field:random")).toEqual({ field: "DESC" })
  })

  it("should handle a single field with leading whitespace", () => {
    expect(parseOrderParam("  name  ")).toEqual({ name: "ASC" })
  })

  it("should handle mixed dash and colon syntax", () => {
    expect(parseOrderParam("-updated_at, title:ASC")).toEqual({
      updated_at: "DESC",
      title: "ASC",
    })
  })
})
