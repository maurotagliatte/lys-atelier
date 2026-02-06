import { Module } from "@medusajs/framework/utils"
import WeddingListModuleService from "./service"

export const WEDDING_LIST_MODULE = "wedding_list"

export default Module(WEDDING_LIST_MODULE, {
  service: WeddingListModuleService,
})
