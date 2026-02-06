/**
 * Asaas Webhook Route
 *
 * POST /hooks/asaas
 *
 * Receives payment event notifications from Asaas and forwards them
 * to Medusa's payment processing pipeline so order statuses are
 * updated automatically.
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { timingSafeEqual } from "crypto"

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN
    const headers = req.headers as Record<string, string | string[] | undefined>

    // Validate the webhook access token when configured
    if (webhookToken) {
      const receivedToken = headers["asaas-access-token"]

      if (!receivedToken || typeof receivedToken !== 'string' || !safeCompare(receivedToken, webhookToken)) {
        res.status(401).json({ error: "Invalid webhook token" })
        return
      }
    }

    const body = req.body as Record<string, unknown>

    if (!body?.event || !body?.payment) {
      res.status(400).json({ error: "Missing event or payment in payload" })
      return
    }

    const paymentModuleService = req.scope.resolve("paymentModuleService") as {
      processEvent(
        providerId: string,
        payload: {
          data: Record<string, unknown>
          headers: Record<string, string | string[] | undefined>
          rawData: unknown
        }
      ): Promise<void>
    }

    await paymentModuleService.processEvent("pp_asaas_asaas", {
      data: body,
      headers: headers,
      rawData: req.body,
    })

    res.status(200).json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"

    // Log but still return 200 to prevent Asaas from retrying
    // indefinitely on application errors.
    console.error("Asaas webhook processing error:", message)
    res.status(200).json({ received: true, error: message })
  }
}
