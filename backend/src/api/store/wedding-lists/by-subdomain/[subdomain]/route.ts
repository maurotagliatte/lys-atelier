import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * Reserved subdomains that cannot be used as wedding list slugs.
 * These are blocked to prevent confusion with system routes.
 */
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "mail",
  "ftp",
  "smtp",
  "imap",
  "pop",
  "ns1",
  "ns2",
  "cdn",
  "static",
  "assets",
  "app",
  "dashboard",
  "staging",
  "dev",
  "test",
  "localhost",
])

/**
 * GET /store/wedding-lists/by-subdomain/:subdomain
 *
 * Public endpoint to retrieve a wedding list by its subdomain.
 * Functionally equivalent to the slug endpoint but with clearer
 * intent for the frontend middleware that resolves subdomains.
 *
 * The frontend Next.js middleware extracts the subdomain from
 * the hostname (e.g., "joao-maria" from "joao-maria.lysatelier.com.br")
 * and calls this endpoint to load the wedding list data.
 *
 * Returns:
 * - Couple info (names, date, photo)
 * - Theme settings (colors, font)
 * - Custom message
 * - Published products with variants and prices
 * - Sales channel ID for the publishable API key header
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { subdomain } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Sanitize and validate subdomain
  const sanitizedSubdomain = subdomain.toLowerCase().trim()

  if (!sanitizedSubdomain) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Subdomain parameter is required"
    )
  }

  if (RESERVED_SUBDOMAINS.has(sanitizedSubdomain)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `"${sanitizedSubdomain}" is a reserved subdomain`
    )
  }

  // Validate subdomain format (must be a valid DNS label)
  const subdomainRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!subdomainRegex.test(sanitizedSubdomain)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Subdomain contains invalid characters. Use only lowercase letters, numbers, and hyphens."
    )
  }

  if (sanitizedSubdomain.length > 63) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Subdomain must be at most 63 characters"
    )
  }

  const { data: weddingLists } = await query.graph({
    entity: "wedding_list",
    fields: [
      "id",
      "couple_names",
      "wedding_date",
      "couple_photo_url",
      "primary_color",
      "secondary_color",
      "font_family",
      "custom_message",
      "slug",
      "is_active",
      "sales_channel.id",
      "sales_channel.publishable_api_keys.*",
      "products.id",
      "products.title",
      "products.handle",
      "products.description",
      "products.thumbnail",
      "products.status",
      "products.images.*",
      "products.variants.id",
      "products.variants.title",
      "products.variants.sku",
      "products.variants.prices.*",
      "products.variants.options.*",
      "products.options.*",
      "products.collection.*",
    ],
    filters: {
      slug: sanitizedSubdomain,
      is_active: true,
    },
  })

  const weddingList = weddingLists[0]

  if (!weddingList) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No active wedding list found for subdomain "${sanitizedSubdomain}"`
    )
  }

  // Filter out unpublished products on the store side
  const activeProducts = Array.isArray(weddingList.products)
    ? weddingList.products.filter(
        (product: any) => product.status === "published"
      )
    : []

  // Extract the publishable API key for the frontend to use
  const publishableApiKey =
    weddingList.sales_channel?.publishable_api_keys?.[0]?.id ?? null

  res.json({
    wedding_list: {
      id: weddingList.id,
      couple_names: weddingList.couple_names,
      wedding_date: weddingList.wedding_date,
      couple_photo_url: weddingList.couple_photo_url,
      theme: {
        primary_color: weddingList.primary_color,
        secondary_color: weddingList.secondary_color,
        font_family: weddingList.font_family,
      },
      custom_message: weddingList.custom_message,
      slug: weddingList.slug,
      sales_channel_id: weddingList.sales_channel?.id ?? null,
      publishable_api_key: publishableApiKey,
      products: activeProducts,
    },
  })
}
