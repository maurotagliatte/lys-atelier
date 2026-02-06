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

type CreateWeddingListInput = {
  couple_names: string
  wedding_date: string
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

const RESERVED_SLUGS = new Set([
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
  "assets",
  "static",
  "media",
  "images",
  "app",
  "dashboard",
  "login",
  "signup",
  "register",
  "account",
  "settings",
  "help",
  "support",
  "status",
  "blog",
  "docs",
  "store",
  "shop",
  "checkout",
  "cart",
  "payment",
  "webhook",
  "webhooks",
  "health",
  "metrics",
  "graphql",
])

// ---------------------------------------------------------------------------
// Step 1 - Validate wedding list input data
// ---------------------------------------------------------------------------

const validateWeddingListData = createStep(
  "validate-wedding-list-data",
  async (input: CreateWeddingListInput) => {
    if (!input.couple_names || input.couple_names.trim().length < 3) {
      throw new Error(
        "couple_names is required and must be at least 3 characters."
      )
    }

    if (!input.wedding_date) {
      throw new Error("wedding_date is required.")
    }

    const parsedDate = new Date(input.wedding_date)

    if (isNaN(parsedDate.getTime())) {
      throw new Error(
        "wedding_date must be a valid ISO 8601 date string."
      )
    }

    return new StepResponse({
      ...input,
      couple_names: input.couple_names.trim(),
      wedding_date: parsedDate.toISOString(),
    })
  }
)

// ---------------------------------------------------------------------------
// Step 2 - Generate a URL-safe slug from couple names
// ---------------------------------------------------------------------------

const generateSlug = createStep(
  "generate-slug",
  async (
    input: { couple_names: string; wedding_date: string; slug?: string },
    { container }
  ) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    // If a custom slug was explicitly provided, use it as-is.
    if (input.slug) {
      return new StepResponse(input.slug)
    }

    const slug = await weddingListService.generateUniqueSlug(
      input.couple_names,
      input.wedding_date
    )

    return new StepResponse(slug)
  }
)

// ---------------------------------------------------------------------------
// Step 3 - Validate slug is not reserved and is available
// ---------------------------------------------------------------------------

const validateSlugAvailability = createStep(
  "validate-slug-availability",
  async (input: { slug: string }, { container }) => {
    const slug = input.slug

    if (RESERVED_SLUGS.has(slug)) {
      throw new Error(
        `The slug "${slug}" is reserved and cannot be used. ` +
          "Please choose a different name."
      )
    }

    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    const isAvailable = await weddingListService.validateSlugAvailability(slug)

    if (!isAvailable) {
      throw new Error(
        `The slug "${slug}" is already taken. ` +
          "Please choose a different name."
      )
    }

    return new StepResponse(slug)
  }
)

// ---------------------------------------------------------------------------
// Step 4 - Create the wedding list entity
// ---------------------------------------------------------------------------

const createWeddingListStep = createStep(
  "create-wedding-list-entity",
  async (
    input: CreateWeddingListInput & { slug: string },
    { container }
  ) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    const weddingList = await weddingListService.createWeddingLists({
      couple_names: input.couple_names,
      wedding_date: new Date(input.wedding_date),
      couple_photo_url: input.couple_photo_url ?? null,
      primary_color: input.primary_color ?? "#d4af37",
      secondary_color: input.secondary_color ?? "#ffffff",
      font_family: input.font_family ?? "Playfair Display",
      custom_message: input.custom_message ?? null,
      slug: input.slug,
      is_active: input.is_active ?? true,
      pix_enabled: input.pix_enabled ?? true,
      boleto_enabled: input.boleto_enabled ?? false,
      credit_card_enabled: input.credit_card_enabled ?? false,
    })

    return new StepResponse(weddingList, weddingList.id)
  },
  async (weddingListId: string, { container }) => {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    await weddingListService.deleteWeddingLists(weddingListId)
  }
)

// ---------------------------------------------------------------------------
// Step 5 - Create a corresponding Medusa Sales Channel
// ---------------------------------------------------------------------------

const createSalesChannelStep = createStep(
  "create-sales-channel",
  async (
    input: { couple_names: string; slug: string },
    { container }
  ) => {
    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    const salesChannel = await salesChannelService.createSalesChannels({
      name: `Lista - ${input.couple_names}`,
      description: `Sales channel for wedding list: ${input.slug}`,
      is_disabled: false,
    })

    return new StepResponse(salesChannel, salesChannel.id)
  },
  async (salesChannelId: string, { container }) => {
    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

    await salesChannelService.deleteSalesChannels(salesChannelId)
  }
)

// ---------------------------------------------------------------------------
// Step 6 - Link wedding list to its sales channel
// ---------------------------------------------------------------------------

const linkWeddingListToSalesChannel = createStep(
  "link-wedding-list-to-sales-channel",
  async (
    input: { wedding_list_id: string; sales_channel_id: string },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.create({
      [WEDDING_LIST_MODULE]: {
        wedding_list_id: input.wedding_list_id,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: input.sales_channel_id,
      },
    })

    return new StepResponse({
      wedding_list_id: input.wedding_list_id,
      sales_channel_id: input.sales_channel_id,
    })
  },
  async (
    data: { wedding_list_id: string; sales_channel_id: string },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss({
      [WEDDING_LIST_MODULE]: {
        wedding_list_id: data.wedding_list_id,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: data.sales_channel_id,
      },
    })
  }
)

// ---------------------------------------------------------------------------
// Step 7 - Create a publishable API key for this sales channel
// ---------------------------------------------------------------------------

const createPublishableApiKeyStep = createStep(
  "create-publishable-api-key",
  async (
    input: { couple_names: string; sales_channel_id: string },
    { container }
  ) => {
    const apiKeyService = container.resolve(Modules.API_KEY)

    const apiKey = await apiKeyService.createApiKeys({
      title: `Lista - ${input.couple_names}`,
      type: "publishable",
      created_by: "system",
    })

    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.create({
      [Modules.API_KEY]: {
        api_key_id: apiKey.id,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: input.sales_channel_id,
      },
    })

    return new StepResponse(
      { api_key_id: apiKey.id, token: apiKey.token },
      { api_key_id: apiKey.id, sales_channel_id: input.sales_channel_id }
    )
  },
  async (
    data: { api_key_id: string; sales_channel_id: string },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    await link.dismiss({
      [Modules.API_KEY]: {
        api_key_id: data.api_key_id,
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: data.sales_channel_id,
      },
    })

    const apiKeyService = container.resolve(Modules.API_KEY)

    await apiKeyService.deleteApiKeys(data.api_key_id)
  }
)

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export const createWeddingListWorkflow = createWorkflow(
  "create-wedding-list",
  (input: CreateWeddingListInput) => {
    const validatedData = validateWeddingListData(input)

    const slug = generateSlug({
      couple_names: validatedData.couple_names,
      wedding_date: validatedData.wedding_date,
      slug: input.slug,
    })

    const validatedSlug = validateSlugAvailability({ slug })

    const weddingList = createWeddingListStep({
      ...validatedData,
      slug: validatedSlug,
    })

    const salesChannel = createSalesChannelStep({
      couple_names: validatedData.couple_names,
      slug: validatedSlug,
    })

    linkWeddingListToSalesChannel({
      wedding_list_id: weddingList.id,
      sales_channel_id: salesChannel.id,
    })

    const apiKeyResult = createPublishableApiKeyStep({
      couple_names: validatedData.couple_names,
      sales_channel_id: salesChannel.id,
    })

    return new WorkflowResponse({
      wedding_list: weddingList,
      sales_channel: salesChannel,
      publishable_api_key: apiKeyResult,
    })
  }
)
