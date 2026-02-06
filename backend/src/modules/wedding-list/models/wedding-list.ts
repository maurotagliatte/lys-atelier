import { model } from "@medusajs/framework/utils"

export const WeddingList = model.define("wedding_list", {
  id: model.id().primaryKey(),
  couple_names: model.text(),
  wedding_date: model.dateTime(),
  couple_photo_url: model.text().nullable(),
  primary_color: model.text().default("#d4af37"),
  secondary_color: model.text().default("#ffffff"),
  font_family: model.text().default("Playfair Display"),
  custom_message: model.text().nullable(),
  slug: model.text().unique(),
  is_active: model.boolean().default(true),
  pix_enabled: model.boolean().default(true),
  boleto_enabled: model.boolean().default(false),
  credit_card_enabled: model.boolean().default(false),
})
