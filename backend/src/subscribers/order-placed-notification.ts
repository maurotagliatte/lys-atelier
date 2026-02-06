import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import {
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import { WEDDING_LIST_MODULE } from "../modules/wedding-list"
import { sendEmail } from "../lib/email"
import {
  // giftReceivedTemplate is ready for use once couple_email is available
  purchaseConfirmationTemplate,
} from "../lib/email-templates"

/**
 * Subscriber: order-placed-notification
 *
 * Listens for the "order.placed" event and prepares notification data
 * for the couple who owns the wedding list linked to this order's
 * sales channel. The actual email dispatch (SendGrid / Resend) will
 * be wired in a later phase.
 */
export default async function orderPlacedNotificationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const orderId = data.id

  logger.info(`[order-placed-notification] Processing order ${orderId}`)

  try {
    const orderService = container.resolve(Modules.ORDER)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Retrieve the order with its sales channel information.
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address"],
    })

    if (!order) {
      logger.warn(
        `[order-placed-notification] Order ${orderId} not found. Skipping.`
      )
      return
    }

    // Try to find which wedding list this order belongs to via
    // the sales channel link.
    const salesChannelId = order.sales_channel_id

    if (!salesChannelId) {
      logger.info(
        `[order-placed-notification] Order ${orderId} has no sales channel. ` +
          "Not a wedding list order."
      )
      return
    }

    // Query the wedding list linked to this sales channel.
    const { data: weddingLists } = await query.graph({
      entity: "wedding_list",
      fields: [
        "id",
        "couple_names",
        "slug",
        "custom_message",
      ],
      filters: {
        sales_channel: {
          id: salesChannelId,
        },
      },
    })

    if (!weddingLists?.length) {
      logger.info(
        `[order-placed-notification] No wedding list linked to sales channel ` +
          `${salesChannelId} for order ${orderId}. Not a wedding list order.`
      )
      return
    }

    const weddingList = weddingLists[0]

    const notificationData = {
      order_id: orderId,
      order_display_id: order.display_id,
      wedding_list_id: weddingList.id,
      couple_names: weddingList.couple_names,
      slug: weddingList.slug,
      customer_email: order.email,
      shipping_address: order.shipping_address,
      items: order.items?.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      total: order.total,
      currency_code: order.currency_code,
    }

    logger.info(
      `[order-placed-notification] Wedding list order prepared for ` +
        `"${weddingList.couple_names}" (${weddingList.slug}). ` +
        `Order #${order.display_id}, total: ${order.currency_code} ${order.total}`
    )

    // Format total for display
    const formattedTotal = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: order.currency_code?.toUpperCase() || "BRL",
    }).format(Number(order.total) / 100)

    // 1. Email to couple
    // NOTE: The wedding list model does not yet have a couple_email field.
    // Once the model is extended, uncomment and use:
    // if (coupleEmail) {
    //   const coupleHtml = giftReceivedTemplate({
    //     coupleNames: weddingList.couple_names,
    //     guestEmail: order.email || "desconhecido",
    //     items: notificationData.items || [],
    //     total: formattedTotal,
    //     currencyCode: order.currency_code || "BRL",
    //     orderDisplayId: order.display_id,
    //     slug: weddingList.slug,
    //   })
    //   await sendEmail({
    //     to: coupleEmail,
    //     subject: `Novo presente recebido - ${weddingList.couple_names}`,
    //     html: coupleHtml,
    //   })
    //   logger.info(`[order-placed-notification] Gift notification sent to couple`)
    // }
    logger.info(
      `[order-placed-notification] Would send gift notification to couple ` +
        `for list "${weddingList.slug}"`
    )

    // 2. Email to guest (order.email)
    if (order.email) {
      const guestHtml = purchaseConfirmationTemplate({
        coupleNames: weddingList.couple_names,
        items: (notificationData.items || []).map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
        total: formattedTotal,
        currencyCode: order.currency_code || "BRL",
        orderDisplayId: order.display_id,
        slug: weddingList.slug,
      })

      await sendEmail({
        to: order.email,
        subject: `Confirmacao de compra - Presente para ${weddingList.couple_names}`,
        html: guestHtml,
      })

      logger.info(
        `[order-placed-notification] Purchase confirmation email sent to ${order.email}`
      )
    }
  } catch (error) {
    logger.error(
      `[order-placed-notification] Failed to process order ${orderId}: ` +
        `${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
