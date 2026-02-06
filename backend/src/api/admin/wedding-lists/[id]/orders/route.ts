import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { parseOrderParam } from "../../utils"
import type { GetAdminWeddingListOrdersParamsType } from "../../validators"

/**
 * GET /admin/wedding-lists/:id/orders
 *
 * Retrieve all orders associated with a specific wedding list.
 * This serves as the gift report for the couple, showing who bought what.
 *
 * Orders are linked through the Sales Channel associated with the wedding list.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<GetAdminWeddingListOrdersParamsType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { offset, limit, order, status } = req.validatedQuery as GetAdminWeddingListOrdersParamsType

  // First, verify the wedding list exists and get its sales_channel_id
  const { data: weddingLists } = await query.graph({
    entity: "wedding_list",
    fields: [
      "id",
      "couple_names",
      "wedding_date",
      "slug",
      "sales_channel.id",
    ],
    filters: { id },
  })

  const weddingList = weddingLists[0]

  if (!weddingList) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wedding list with id "${id}" not found`
    )
  }

  // Build order filters scoped to this wedding list's sales channel
  const orderFilters: Record<string, unknown> = {}

  if (weddingList.sales_channel?.id) {
    orderFilters.sales_channel_id = weddingList.sales_channel.id
  }

  if (status) {
    orderFilters.status = status
  }

  // Query orders linked to this wedding list's sales channel
  const { data: orders, metadata } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "created_at",
      "updated_at",
      "email",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "shipping_total",
      "discount_total",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
      "shipping_address.*",
      "billing_address.*",
      "payments.*",
      "sales_channel.*",
    ],
    filters: orderFilters,
    pagination: {
      skip: offset,
      take: limit,
      order: order ? parseOrderParam(order) : { created_at: "DESC" },
    },
  })

  // Compute summary statistics for the report
  const summary = computeOrderSummary(orders)

  res.json({
    wedding_list: {
      id: weddingList.id,
      couple_names: weddingList.couple_names,
      wedding_date: weddingList.wedding_date,
      slug: weddingList.slug,
    },
    orders,
    summary,
    count: metadata?.count ?? orders.length,
    offset,
    limit,
  })
}

/**
 * Compute summary statistics from the orders for the report.
 */
function computeOrderSummary(orders: Record<string, any>[]) {
  let totalRevenue = 0
  let totalOrders = orders.length
  let totalItems = 0
  const uniqueGuests = new Set<string>()
  const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {}

  for (const order of orders) {
    totalRevenue += Number(order.total ?? 0)

    if (order.email) {
      uniqueGuests.add(order.email)
    }

    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        totalItems += Number(item.quantity ?? 1)

        const productName = item.variant?.product?.title ?? item.title ?? "Unknown"
        const productId = item.variant?.product?.id ?? item.product_id ?? "unknown"

        if (!productCounts[productId]) {
          productCounts[productId] = { name: productName, quantity: 0, revenue: 0 }
        }
        productCounts[productId].quantity += Number(item.quantity ?? 1)
        productCounts[productId].revenue += Number(item.total ?? 0)
      }
    }
  }

  const topProducts = Object.entries(productCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  return {
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    total_items: totalItems,
    unique_guests: uniqueGuests.size,
    top_products: topProducts,
  }
}

