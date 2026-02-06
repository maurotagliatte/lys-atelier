/**
 * Parses an order string like "created_at:DESC" or "-created_at"
 * into the format expected by query.graph().
 */
export function parseOrderParam(order: string): Record<string, "ASC" | "DESC"> {
  const result: Record<string, "ASC" | "DESC"> = {}

  const parts = order.split(",")
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith("-")) {
      result[trimmed.slice(1)] = "DESC"
    } else if (trimmed.includes(":")) {
      const [field, direction] = trimmed.split(":")
      result[field] = direction?.toUpperCase() === "ASC" ? "ASC" : "DESC"
    } else {
      result[trimmed] = "ASC"
    }
  }

  return result
}
