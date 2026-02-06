import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import WeddingListModule from "../modules/wedding-list"

export default defineLink(
  {
    linkable: WeddingListModule.linkable.weddingList,
    isList: true,
  },
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  }
)
