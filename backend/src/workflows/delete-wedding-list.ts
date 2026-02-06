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
import type WeddingListModuleService from "../modules/wedding-list/service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeleteWeddingListInput = {
  id: string
}

// ---------------------------------------------------------------------------
// Step 1 - Soft-delete the wedding list
// ---------------------------------------------------------------------------

const softDeleteWeddingListStep = createStep(
  "soft-delete-wedding-list",
  async (input: DeleteWeddingListInput, { container }) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    // Fetch the record before soft-deleting to store compensation data.
    const existing = await weddingListService.retrieveWeddingList(input.id)

    if (!existing) {
      throw new Error(`Wedding list with ID "${input.id}" not found.`)
    }

    await weddingListService.softDeleteWeddingLists([input.id])

    return new StepResponse(
      { id: input.id, slug: existing.slug },
      { id: input.id }
    )
  },
  async (compensationData: { id: string }, { container }) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    await weddingListService.restoreWeddingLists([compensationData.id])
  }
)

// ---------------------------------------------------------------------------
// Step 2 - Deactivate the linked sales channel (do NOT delete)
// ---------------------------------------------------------------------------

const deactivateSalesChannelStep = createStep(
  "deactivate-sales-channel",
  async (input: { wedding_list_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: weddingListData } = await query.graph({
      entity: "wedding_list",
      fields: ["sales_channel.id", "sales_channel.is_disabled"],
      filters: { id: input.wedding_list_id },
    })

    if (
      !weddingListData?.length ||
      !weddingListData[0].sales_channel
    ) {
      // No linked sales channel; nothing to deactivate.
      return new StepResponse(null)
    }

    const salesChannel = weddingListData[0].sales_channel as {
      id: string
      is_disabled: boolean
    }

    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    await salesChannelService.updateSalesChannels({
      id: salesChannel.id,
      is_disabled: true,
    })

    return new StepResponse(
      { sales_channel_id: salesChannel.id },
      {
        sales_channel_id: salesChannel.id,
        was_disabled: salesChannel.is_disabled,
      }
    )
  },
  async (
    compensationData: {
      sales_channel_id: string
      was_disabled: boolean
    } | null,
    { container }
  ) => {
    if (!compensationData) {
      return
    }

    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    // Restore the previous disabled state on rollback.
    await salesChannelService.updateSalesChannels({
      id: compensationData.sales_channel_id,
      is_disabled: compensationData.was_disabled,
    })
  }
)

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export const deleteWeddingListWorkflow = createWorkflow(
  "delete-wedding-list",
  (input: DeleteWeddingListInput) => {
    const deletedData = softDeleteWeddingListStep(input)

    const salesChannelResult = deactivateSalesChannelStep({
      wedding_list_id: input.id,
    })

    return new WorkflowResponse({
      id: deletedData.id,
      slug: deletedData.slug,
      sales_channel: salesChannelResult,
    })
  }
)
