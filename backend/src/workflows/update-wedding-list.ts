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

type UpdateWeddingListInput = {
  id: string
  couple_names?: string
  wedding_date?: string
  couple_photo_url?: string | null
  primary_color?: string
  secondary_color?: string
  font_family?: string
  custom_message?: string | null
  slug?: string
  is_active?: boolean
  pix_enabled?: boolean
  boleto_enabled?: boolean
  credit_card_enabled?: boolean
}

// ---------------------------------------------------------------------------
// Step 1 - Validate update data and fetch current state for compensation
// ---------------------------------------------------------------------------

const validateUpdateData = createStep(
  "validate-update-data",
  async (input: UpdateWeddingListInput, { container }) => {
    if (!input.id) {
      throw new Error("Wedding list ID is required for updates.")
    }

    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    // Fetch the existing record so we can restore it on rollback.
    const existing = await weddingListService.retrieveWeddingList(input.id)

    if (!existing) {
      throw new Error(`Wedding list with ID "${input.id}" not found.`)
    }

    if (input.couple_names !== undefined && input.couple_names.trim().length < 3) {
      throw new Error(
        "couple_names must be at least 3 characters when provided."
      )
    }

    if (input.wedding_date !== undefined) {
      const parsedDate = new Date(input.wedding_date)

      if (isNaN(parsedDate.getTime())) {
        throw new Error(
          "wedding_date must be a valid ISO 8601 date string."
        )
      }
    }

    if (input.slug !== undefined) {
      const isAvailable = await weddingListService.validateSlugAvailability(
        input.slug
      )

      // Allow keeping the same slug the record already has.
      if (!isAvailable && existing.slug !== input.slug) {
        throw new Error(
          `The slug "${input.slug}" is already taken. Please choose a different one.`
        )
      }
    }

    return new StepResponse(
      { input, existing },
      { existing }
    )
  }
)

// ---------------------------------------------------------------------------
// Step 2 - Update the wedding list entity
// ---------------------------------------------------------------------------

const updateWeddingListStep = createStep(
  "update-wedding-list-entity",
  async (
    input: {
      data: UpdateWeddingListInput
      previous: Record<string, unknown>
    },
    { container }
  ) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    const updatePayload: Record<string, unknown> = {}

    if (input.data.couple_names !== undefined) {
      updatePayload.couple_names = input.data.couple_names.trim()
    }
    if (input.data.wedding_date !== undefined) {
      updatePayload.wedding_date = new Date(input.data.wedding_date)
    }
    if (input.data.couple_photo_url !== undefined) {
      updatePayload.couple_photo_url = input.data.couple_photo_url
    }
    if (input.data.primary_color !== undefined) {
      updatePayload.primary_color = input.data.primary_color
    }
    if (input.data.secondary_color !== undefined) {
      updatePayload.secondary_color = input.data.secondary_color
    }
    if (input.data.font_family !== undefined) {
      updatePayload.font_family = input.data.font_family
    }
    if (input.data.custom_message !== undefined) {
      updatePayload.custom_message = input.data.custom_message
    }
    if (input.data.slug !== undefined) {
      updatePayload.slug = input.data.slug
    }
    if (input.data.is_active !== undefined) {
      updatePayload.is_active = input.data.is_active
    }
    if (input.data.pix_enabled !== undefined) {
      updatePayload.pix_enabled = input.data.pix_enabled
    }
    if (input.data.boleto_enabled !== undefined) {
      updatePayload.boleto_enabled = input.data.boleto_enabled
    }
    if (input.data.credit_card_enabled !== undefined) {
      updatePayload.credit_card_enabled = input.data.credit_card_enabled
    }

    const updatedWeddingList = await weddingListService.updateWeddingLists({
      id: input.data.id,
      ...updatePayload,
    })

    return new StepResponse(updatedWeddingList, {
      id: input.data.id,
      previous: input.previous,
    })
  },
  async (
    compensationData: { id: string; previous: Record<string, unknown> },
    { container }
  ) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    // Restore the previous state on rollback.
    await weddingListService.updateWeddingLists({
      id: compensationData.id,
      couple_names: compensationData.previous.couple_names,
      wedding_date: compensationData.previous.wedding_date,
      couple_photo_url: compensationData.previous.couple_photo_url,
      primary_color: compensationData.previous.primary_color,
      secondary_color: compensationData.previous.secondary_color,
      font_family: compensationData.previous.font_family,
      custom_message: compensationData.previous.custom_message,
      slug: compensationData.previous.slug,
      is_active: compensationData.previous.is_active,
      pix_enabled: compensationData.previous.pix_enabled,
      boleto_enabled: compensationData.previous.boleto_enabled,
      credit_card_enabled: compensationData.previous.credit_card_enabled,
    })
  }
)

// ---------------------------------------------------------------------------
// Step 3 - Update the linked sales channel name when couple_names changes
// ---------------------------------------------------------------------------

const updateSalesChannelStep = createStep(
  "update-sales-channel",
  async (
    input: {
      wedding_list_id: string
      couple_names?: string
      is_active?: boolean
    },
    { container }
  ) => {
    // If neither the name nor the active status changed, skip.
    if (input.couple_names === undefined && input.is_active === undefined) {
      return new StepResponse(null)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: weddingListData } = await query.graph({
      entity: "wedding_list",
      fields: ["sales_channel.id", "sales_channel.name", "sales_channel.is_disabled"],
      filters: { id: input.wedding_list_id },
    })

    if (
      !weddingListData?.length ||
      !weddingListData[0].sales_channel
    ) {
      // No linked sales channel -- nothing to do.
      return new StepResponse(null)
    }

    const salesChannel = weddingListData[0].sales_channel as {
      id: string
      name: string
      is_disabled: boolean
    }

    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    const updatePayload: Record<string, unknown> = {
      id: salesChannel.id,
    }

    if (input.couple_names !== undefined) {
      updatePayload.name = `Lista - ${input.couple_names}`
    }

    if (input.is_active !== undefined) {
      updatePayload.is_disabled = !input.is_active
    }

    const updatedSalesChannel =
      await salesChannelService.updateSalesChannels(updatePayload)

    return new StepResponse(updatedSalesChannel, {
      id: salesChannel.id,
      previous_name: salesChannel.name,
      previous_is_disabled: salesChannel.is_disabled,
    })
  },
  async (
    compensationData: {
      id: string
      previous_name: string
      previous_is_disabled: boolean
    } | null,
    { container }
  ) => {
    if (!compensationData) {
      return
    }

    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    await salesChannelService.updateSalesChannels({
      id: compensationData.id,
      name: compensationData.previous_name,
      is_disabled: compensationData.previous_is_disabled,
    })
  }
)

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export const updateWeddingListWorkflow = createWorkflow(
  "update-wedding-list",
  (input: UpdateWeddingListInput) => {
    const { input: validatedInput, existing } = validateUpdateData(input)

    const updatedWeddingList = updateWeddingListStep({
      data: validatedInput,
      previous: existing,
    })

    const updatedSalesChannel = updateSalesChannelStep({
      wedding_list_id: validatedInput.id,
      couple_names: validatedInput.couple_names,
      is_active: validatedInput.is_active,
    })

    return new WorkflowResponse({
      wedding_list: updatedWeddingList,
      sales_channel: updatedSalesChannel,
    })
  }
)
