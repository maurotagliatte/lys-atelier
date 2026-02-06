import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { configureWeddingListProductsWorkflow } from "../../../../workflows/configure-wedding-list-products"
import { deleteWeddingListWorkflow } from "../../../../workflows/delete-wedding-list"
import type WeddingListModuleService from "../../../../modules/wedding-list/service"
import type { PutAdminUpdateWeddingListType } from "../validators"

/**
 * GET /admin/wedding-lists/:id
 *
 * Retrieve a single wedding list by its ID, including linked products.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

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
      "metadata",
      "created_at",
      "updated_at",
      "products.*",
      "products.variants.*",
      "products.variants.prices.*",
      "products.images.*",
    ],
    filters: {
      id,
    },
  })

  const weddingList = weddingLists[0]

  if (!weddingList) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wedding list with id "${id}" not found`
    )
  }

  res.json({
    wedding_list: weddingList,
  })
}

/**
 * PUT /admin/wedding-lists/:id
 *
 * Update an existing wedding list. Only provided fields are updated.
 * If slug is changed, validates uniqueness before applying.
 */
export const PUT = async (
  req: AuthenticatedMedusaRequest<PutAdminUpdateWeddingListType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const weddingListService = req.scope.resolve<WeddingListModuleService>("wedding_list")
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const body = req.validatedBody as PutAdminUpdateWeddingListType

  // Verify the wedding list exists
  const { data: existing } = await query.graph({
    entity: "wedding_list",
    fields: ["id"],
    filters: { id },
  })

  if (!existing[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wedding list with id "${id}" not found`
    )
  }

  // If slug is being changed, validate uniqueness
  if (body.slug) {
    const { data: slugConflict } = await query.graph({
      entity: "wedding_list",
      fields: ["id"],
      filters: {
        slug: body.slug,
        id: { $ne: id },
      },
    })

    if (slugConflict.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Slug "${body.slug}" is already in use by another wedding list`
      )
    }
  }

  // Extract product_ids for separate handling via workflow
  const { product_ids, ...updateData } = body

  const updatedList = await weddingListService.updateWeddingLists(
    { id },
    updateData
  )

  // If product_ids provided, update product links via workflow
  if (product_ids !== undefined) {
    await configureWeddingListProductsWorkflow(req.scope).run({
      input: {
        wedding_list_id: id,
        product_ids,
      },
    })
  }

  // Refetch with linked data
  const { data: refreshed } = await query.graph({
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
    filters: { id },
  })

  res.json({
    wedding_list: refreshed[0] ?? updatedList,
  })
}

/**
 * DELETE /admin/wedding-lists/:id
 *
 * Soft-delete a wedding list and deactivate its sales channel
 * using the delete-wedding-list workflow.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the wedding list exists
  const { data: existing } = await query.graph({
    entity: "wedding_list",
    fields: ["id", "couple_names"],
    filters: { id },
  })

  if (!existing[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wedding list with id "${id}" not found`
    )
  }

  await deleteWeddingListWorkflow(req.scope).run({
    input: { id },
  })

  res.status(200).json({
    id,
    object: "wedding_list",
    deleted: true,
  })
}
