import { defineLink } from "@medusajs/framework/utils"
import SalesChannelModule from "@medusajs/medusa/sales-channel"
import WeddingListModule from "../modules/wedding-list"

export default defineLink(
  WeddingListModule.linkable.weddingList,
  SalesChannelModule.linkable.salesChannel
)
