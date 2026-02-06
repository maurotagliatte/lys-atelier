import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import { WEDDING_LIST_MODULE } from "../modules/wedding-list"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfigureProductsInput = {
  wedding_list_id: string
  product_ids: string[]
}

// ---------------------------------------------------------------------------
// Step 1 - Validate that all product IDs exist
// ---------------------------------------------------------------------------

const validateProductIds = createStep(
  "validate-product-ids",
  async (input: ConfigureProductsInput, { container }) => {
    if (!input.wedding_list_id) {
      throw new Error("wedding_list_id is required.")
    }

    if (!input.product_ids?.length) {
      throw new Error("At least one product_id is required.")
    }

    const productService = container.resolve(Modules.PRODUCT)

    const products = await productService.listProducts(
      { id: input.product_ids },
      { select: ["id"], take: input.product_ids.length }
    )

    const foundIds = new Set(products.map((p: { id: string }) => p.id))
    const missingIds = input.product_ids.filter((id) => !foundIds.has(id))

    if (missingIds.length > 0) {
      throw new Error(
        `The following product IDs were not found: ${missingIds.join(", ")}`
      )
    }

    return new StepResponse({
      wedding_list_id: input.wedding_list_id,
      product_ids: input.product_ids,
    })
  }
)

// ---------------------------------------------------------------------------
// Step 2 - Create links between products and the wedding list
// ---------------------------------------------------------------------------

const linkProductsToWeddingList = createStep(
  "link-products-to-wedding-list",
  async (
    input: { wedding_list_id: string; product_ids: string[] },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.product_ids.map((productId) => ({
      [WEDDING_LIST_MODULE]: {
        wedding_list_id: input.wedding_list_id,
      },
      [Modules.PRODUCT]: {
        product_id: productId,
      },
    }))

    await link.create(links)

    return new StepResponse(
      {
        wedding_list_id: input.wedding_list_id,
        product_ids: input.product_ids,
      },
      {
        wedding_list_id: input.wedding_list_id,
        product_ids: input.product_ids,
      }
    )
  },
  async (
    compensationData: { wedding_list_id: string; product_ids: string[] },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = compensationData.product_ids.map((productId) => ({
      [WEDDING_LIST_MODULE]: {
        wedding_list_id: compensationData.wedding_list_id,
      },
      [Modules.PRODUCT]: {
        product_id: productId,
      },
    }))

    await link.dismiss(links)
  }
)

// ---------------------------------------------------------------------------
// Step 3 - Assign products to the wedding list's sales channel
// ---------------------------------------------------------------------------

const assignProductsToSalesChannel = createStep(
  "assign-products-to-sales-channel",
  async (
    input: { wedding_list_id: string; product_ids: string[] },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: weddingListData } = await query.graph({
      entity: "wedding_list",
      fields: ["sales_channel.id"],
      filters: { id: input.wedding_list_id },
    })

    if (
      !weddingListData?.length ||
      !weddingListData[0].sales_channel
    ) {
      throw new Error(
        `No sales channel linked to wedding list "${input.wedding_list_id}". ` +
          "Ensure the wedding list was created through the proper workflow."
      )
    }

    const salesChannelId = (
      weddingListData[0].sales_channel as { id: string }
    ).id

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.product_ids.map((productId) => ({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: salesChannelId,
      },
    }))

    await link.create(links)

    return new StepResponse(
      {
        sales_channel_id: salesChannelId,
        product_ids: input.product_ids,
      },
      {
        sales_channel_id: salesChannelId,
        product_ids: input.product_ids,
      }
    )
  },
  async (
    compensationData: {
      sales_channel_id: string
      product_ids: string[]
    },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = compensationData.product_ids.map((productId) => ({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: compensationData.sales_channel_id,
      },
    }))

    await link.dismiss(links)
  }
)

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export const configureWeddingListProductsWorkflow = createWorkflow(
  "configure-wedding-list-products",
  (input: ConfigureProductsInput) => {
    const validated = validateProductIds(input)

    const linkedProducts = linkProductsToWeddingList({
      wedding_list_id: validated.wedding_list_id,
      product_ids: validated.product_ids,
    })

    const salesChannelAssignment = assignProductsToSalesChannel({
      wedding_list_id: validated.wedding_list_id,
      product_ids: validated.product_ids,
    })

    return new WorkflowResponse({
      wedding_list_id: validated.wedding_list_id,
      linked_product_ids: linkedProducts.product_ids,
      sales_channel_id: salesChannelAssignment.sales_channel_id,
    })
  }
)
