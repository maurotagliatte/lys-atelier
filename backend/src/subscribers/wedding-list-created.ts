import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WEDDING_LIST_MODULE } from "../modules/wedding-list"
import type WeddingListModuleService from "../modules/wedding-list/service"
// sendEmail and welcomeTemplate are ready for use once couple_email is available
// import { sendEmail } from "../lib/email"
// import { welcomeTemplate } from "../lib/email-templates"

/**
 * Subscriber: wedding-list-created
 *
 * Listens for the custom "wedding-list.created" event emitted after
 * a new wedding list is successfully created via the workflow.
 *
 * Currently logs the creation. In a future phase this will trigger
 * a welcome email to the couple with their list URL and setup instructions.
 */
export default async function weddingListCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const weddingListId = data.id

  logger.info(
    `[wedding-list-created] New wedding list created: ${weddingListId}`
  )

  try {
    const weddingListService = container.resolve<WeddingListModuleService>(
      WEDDING_LIST_MODULE
    )

    const weddingList = await weddingListService.retrieveWeddingList(
      weddingListId
    )

    if (!weddingList) {
      logger.warn(
        `[wedding-list-created] Wedding list ${weddingListId} not found. ` +
          "Skipping notification."
      )
      return
    }

    logger.info(
      `[wedding-list-created] Wedding list details:\n` +
        `  Couple: ${weddingList.couple_names}\n` +
        `  Slug: ${weddingList.slug}\n` +
        `  Wedding date: ${weddingList.wedding_date}\n` +
        `  Active: ${weddingList.is_active}`
    )

    // Prepare welcome email data
    const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000"
    const listUrl = `${storefrontUrl}/lista/${weddingList.slug}`

    // NOTE: The wedding list model does not yet have a couple_email field.
    // Once the model is extended, uncomment and use:
    // if (coupleEmail) {
    //   await sendEmail({
    //     to: coupleEmail,
    //     subject: `Sua lista de casamento foi criada - ${weddingList.couple_names}`,
    //     html: welcomeTemplate({
    //       coupleNames: weddingList.couple_names,
    //       slug: weddingList.slug,
    //       weddingDate: String(weddingList.wedding_date),
    //       listUrl,
    //     }),
    //   })
    //   logger.info(`[wedding-list-created] Welcome email sent to couple`)
    // }

    logger.info(
      `[wedding-list-created] Welcome email ready for ` +
        `"${weddingList.couple_names}". List URL: ${listUrl}`
    )
  } catch (error) {
    logger.error(
      `[wedding-list-created] Failed to process creation event ` +
        `for wedding list ${weddingListId}: ` +
        `${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "wedding-list.created",
}
