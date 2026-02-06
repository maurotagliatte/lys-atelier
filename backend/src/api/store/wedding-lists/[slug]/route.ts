import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * GET /store/wedding-lists/:slug
 *
 * Public endpoint to retrieve a wedding list by its slug.
 * Used by the frontend to render the wedding list storefront
 * when accessed via subdomain (e.g., joao-maria.lysatelier.com.br).
 *
 * Returns couple info, theme settings, and linked products with
 * their variants and prices for display.
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { slug } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Sanitize slug: lowercase, trim whitespace
  const sanitizedSlug = slug.toLowerCase().trim()

  if (!sanitizedSlug) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Slug parameter is required"
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
      slug: sanitizedSlug,
      is_active: true,
    },
  })

  const weddingList = weddingLists[0]

  if (!weddingList) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wedding list "${sanitizedSlug}" not found or is not active`
    )
  }

  // Filter out unpublished products on the store side
  const activeProducts = Array.isArray(weddingList.products)
    ? weddingList.products.filter(
        (product: any) => product.status === "published"
      )
    : []

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
      products: activeProducts,
    },
  })
}
