import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  PostAdminCreateWeddingList,
  PutAdminUpdateWeddingList,
  GetAdminWeddingListsParams,
  GetAdminWeddingListOrdersParams,
} from "./admin/wedding-lists/validators"

export default defineMiddlewares({
  routes: [
    // ----------------------------------------------------------------
    // Admin: List wedding lists (GET /admin/wedding-lists)
    // ----------------------------------------------------------------
    {
      matcher: "/admin/wedding-lists",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetAdminWeddingListsParams, {
          defaults: ["id", "couple_names", "slug", "is_active", "created_at"],
          isList: true,
        }),
      ],
    },

    // ----------------------------------------------------------------
    // Admin: Create wedding list (POST /admin/wedding-lists)
    // ----------------------------------------------------------------
    {
      matcher: "/admin/wedding-lists",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminCreateWeddingList),
      ],
    },

    // ----------------------------------------------------------------
    // Admin: Get single wedding list (GET /admin/wedding-lists/:id)
    // No query validation needed - just route params
    // ----------------------------------------------------------------

    // ----------------------------------------------------------------
    // Admin: Update wedding list (PUT /admin/wedding-lists/:id)
    // ----------------------------------------------------------------
    {
      matcher: "/admin/wedding-lists/:id",
      method: "PUT",
      middlewares: [
        validateAndTransformBody(PutAdminUpdateWeddingList),
      ],
    },

    // ----------------------------------------------------------------
    // Admin: Delete wedding list (DELETE /admin/wedding-lists/:id)
    // No body/query validation needed
    // ----------------------------------------------------------------

    // ----------------------------------------------------------------
    // Admin: Get orders for a wedding list (GET /admin/wedding-lists/:id/orders)
    // ----------------------------------------------------------------
    {
      matcher: "/admin/wedding-lists/:id/orders",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetAdminWeddingListOrdersParams, {
          defaults: [
            "id",
            "display_id",
            "status",
            "total",
            "email",
            "created_at",
          ],
          isList: true,
        }),
      ],
    },

    // ----------------------------------------------------------------
    // Store routes: Public, no body validation needed for GET endpoints
    // GET /store/wedding-lists/:slug
    // GET /store/wedding-lists/by-subdomain/:subdomain
    // These are read-only and only use route params
    // ----------------------------------------------------------------
  ],
})
