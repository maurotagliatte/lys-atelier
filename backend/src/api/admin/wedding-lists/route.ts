import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createWeddingListWorkflow } from "../../../workflows/create-wedding-list"
import { parseOrderParam } from "./utils"
import type {
  PostAdminCreateWeddingListType,
  GetAdminWeddingListsParamsType,
} from "./validators"

/**
 * GET /admin/wedding-lists
 *
 * List all wedding lists with pagination and optional filters.
 * Uses query.graph() to retrieve linked data (products, sales channel).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<GetAdminWeddingListsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { offset, limit, order, q, is_active } = req.validatedQuery as GetAdminWeddingListsParamsType

  const filters: Record<string, unknown> = {}
  if (typeof is_active === "boolean") {
    filters.is_active = is_active
  }
  if (q) {
    filters.couple_names = { $like: `%${q}%` }
  }

  const { data: weddingLists, metadata } = await query.graph({
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
      "metadata",
      "created_at",
      "updated_at",
      "products.*",
    ],
    filters,
    pagination: {
      skip: offset,
      take: limit,
      order: order ? parseOrderParam(order) : { created_at: "DESC" },
    },
  })

  res.json({
    wedding_lists: weddingLists,
    count: metadata?.count ?? weddingLists.length,
    offset,
    limit,
  })
}

/**
 * POST /admin/wedding-lists
 *
 * Create a new wedding list. Triggers the create-wedding-list workflow
 * which handles slug generation, validation, and Sales Channel creation.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminCreateWeddingListType>,
  res: MedusaResponse
) => {
  const validatedBody = req.validatedBody as PostAdminCreateWeddingListType

  const { result } = await createWeddingListWorkflow(req.scope).run({
    input: validatedBody,
  })

  res.status(201).json({
    wedding_list: result,
  })
}

