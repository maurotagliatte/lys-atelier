import { z } from "@medusajs/framework/zod"

/**
 * Validator for POST /admin/wedding-lists
 * Creates a new wedding list with all required fields.
 */
export const PostAdminCreateWeddingList = z.object({
  couple_names: z
    .string()
    .min(3, "Couple names must be at least 3 characters")
    .max(200, "Couple names must be at most 200 characters"),
  wedding_date: z
    .string()
    .datetime({ message: "Wedding date must be a valid ISO 8601 date" }),
  couple_photo_url: z
    .string()
    .url("Couple photo URL must be a valid URL")
    .optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color (e.g. #d4af37)")
    .default("#d4af37"),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Secondary color must be a valid hex color (e.g. #ffffff)")
    .default("#ffffff"),
  font_family: z
    .string()
    .max(100, "Font family must be at most 100 characters")
    .default("Playfair Display"),
  custom_message: z
    .string()
    .max(2000, "Custom message must be at most 2000 characters")
    .optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .max(63, "Slug must be at most 63 characters (subdomain limit)")
    .optional(),
  is_active: z.boolean().default(true),
  product_ids: z
    .array(z.string())
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Validator for PUT /admin/wedding-lists/:id
 * All fields are optional for partial updates.
 */
export const PutAdminUpdateWeddingList = z.object({
  couple_names: z
    .string()
    .min(3, "Couple names must be at least 3 characters")
    .max(200, "Couple names must be at most 200 characters")
    .optional(),
  wedding_date: z
    .string()
    .datetime({ message: "Wedding date must be a valid ISO 8601 date" })
    .optional(),
  couple_photo_url: z
    .string()
    .url("Couple photo URL must be a valid URL")
    .nullable()
    .optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color")
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Secondary color must be a valid hex color")
    .optional(),
  font_family: z
    .string()
    .max(100, "Font family must be at most 100 characters")
    .optional(),
  custom_message: z
    .string()
    .max(2000, "Custom message must be at most 2000 characters")
    .nullable()
    .optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .max(63, "Slug must be at most 63 characters (subdomain limit)")
    .optional(),
  is_active: z.boolean().optional(),
  product_ids: z
    .array(z.string())
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Validator for GET query parameters with pagination.
 * Used for listing wedding lists and orders.
 */
export const GetAdminWeddingListsParams = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.string().optional(),
  q: z.string().optional(),
  is_active: z
    .preprocess((val) => {
      if (val === "true") return true
      if (val === "false") return false
      return val
    }, z.boolean())
    .optional(),
})

/**
 * Validator for GET query parameters for order reports.
 */
export const GetAdminWeddingListOrdersParams = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  order: z.string().optional(),
  status: z.string().optional(),
})

export type PostAdminCreateWeddingListType = z.infer<typeof PostAdminCreateWeddingList>
export type PutAdminUpdateWeddingListType = z.infer<typeof PutAdminUpdateWeddingList>
export type GetAdminWeddingListsParamsType = z.infer<typeof GetAdminWeddingListsParams>
export type GetAdminWeddingListOrdersParamsType = z.infer<typeof GetAdminWeddingListOrdersParams>
