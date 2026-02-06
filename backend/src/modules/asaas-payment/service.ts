/**
 * Asaas Payment Provider Service for Medusa.js v2
 *
 * Implements the AbstractPaymentProvider contract so Medusa can orchestrate
 * payments through the Asaas gateway (PIX, Boleto, Credit Card).
 */

import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"

import { timingSafeEqual } from "crypto"
import { AsaasClient, AsaasClientError } from "./lib/asaas-client"
import type {
  AsaasPaymentProviderOptions,
  AsaasWebhookPayload,
  BillingType,
  PaymentStatus,
  WebhookEvent,
} from "./lib/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

type SessionData = Record<string, unknown>

/**
 * Maps an Asaas PaymentStatus to a Medusa PaymentSessionStatus.
 */
function mapAsaasStatusToMedusa(status: PaymentStatus): PaymentSessionStatus {
  const mapping: Record<PaymentStatus, PaymentSessionStatus> = {
    PENDING: PaymentSessionStatus.PENDING,
    RECEIVED: PaymentSessionStatus.AUTHORIZED,
    CONFIRMED: PaymentSessionStatus.AUTHORIZED,
    OVERDUE: PaymentSessionStatus.ERROR,
    REFUNDED: PaymentSessionStatus.CANCELED,
    RECEIVED_IN_CASH: PaymentSessionStatus.AUTHORIZED,
    REFUND_REQUESTED: PaymentSessionStatus.AUTHORIZED,
    REFUND_IN_PROGRESS: PaymentSessionStatus.AUTHORIZED,
    CHARGEBACK_REQUESTED: PaymentSessionStatus.ERROR,
    CHARGEBACK_DISPUTE: PaymentSessionStatus.ERROR,
    AWAITING_CHARGEBACK_REVERSAL: PaymentSessionStatus.ERROR,
    DUNNING_REQUESTED: PaymentSessionStatus.ERROR,
    DUNNING_RECEIVED: PaymentSessionStatus.ERROR,
    AWAITING_RISK_ANALYSIS: PaymentSessionStatus.PENDING,
  }

  return mapping[status] ?? PaymentSessionStatus.PENDING
}

/**
 * Maps an Asaas webhook event to a Medusa payment action.
 * Returns undefined for events we do not need to act on.
 */
function mapWebhookEventToAction(
  event: WebhookEvent
): PaymentActions | undefined {
  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return PaymentActions.SUCCESSFUL
    case "PAYMENT_REFUNDED":
    case "PAYMENT_PARTIALLY_REFUNDED":
      return PaymentActions.SUCCESSFUL
    case "PAYMENT_OVERDUE":
    case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
      return PaymentActions.FAILED
    case "PAYMENT_AUTHORIZED":
    case "PAYMENT_APPROVED_BY_RISK_ANALYSIS":
      return PaymentActions.AUTHORIZED
    default:
      return undefined
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

class AsaasPaymentProviderService extends AbstractPaymentProvider<AsaasPaymentProviderOptions> {
  static identifier = "asaas"

  protected readonly logger: Logger
  protected readonly options: AsaasPaymentProviderOptions
  protected readonly client: AsaasClient

  constructor(
    container: Record<string, unknown>,
    options: AsaasPaymentProviderOptions
  ) {
    super(container, options)

    this.logger = container.logger as Logger
    this.options = options

    this.client = new AsaasClient({
      apiKey: options.api_key,
      baseUrl: options.base_url,
    })
  }

  // -----------------------------------------------------------------------
  // Static validation
  // -----------------------------------------------------------------------

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.api_key || typeof options.api_key !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Asaas payment provider requires a valid `api_key` option."
      )
    }
  }

  // -----------------------------------------------------------------------
  // initiatePayment
  // -----------------------------------------------------------------------

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const {
      amount,
      currency_code,
      context,
      data: inputData,
    } = input

    const customerEmail = context?.customer?.email ?? (inputData?.email as string) ?? undefined
    const customerName =
      (context?.customer?.first_name as string ??
        context?.customer?.company_name as string) ??
      "Customer"
    const billingType: BillingType =
      (inputData?.billing_type as BillingType) ?? "PIX"
    const cpfCnpj = (inputData?.cpf_cnpj as string) ?? undefined

    // Resolve or create an Asaas customer
    let asaasCustomerId: string | undefined

    if (customerEmail || cpfCnpj) {
      const searchParams = cpfCnpj
        ? { cpfCnpj }
        : { email: customerEmail }

      const existing = await this.client.listCustomers(searchParams)

      if (existing.totalCount > 0) {
        asaasCustomerId = existing.data[0].id
      }
    }

    if (!asaasCustomerId) {
      const newCustomer = await this.client.createCustomer({
        name: customerName,
        email: customerEmail,
        cpfCnpj,
      })
      asaasCustomerId = newCustomer.id
    }

    // Create the Asaas payment
    // Amount from Medusa may be BigNumber; convert to number for Asaas (cents -> currency).
    const numericAmount = typeof amount === "number" ? amount : Number(amount)
    const valueInCurrency = numericAmount / 100

    const dueDate = this.buildDueDate()

    const payment = await this.client.createPayment({
      customer: asaasCustomerId,
      billingType,
      value: valueInCurrency,
      dueDate,
      description: (inputData?.description as string) ?? undefined,
      externalReference: (inputData?.session_id as string) ?? undefined,
    })

    // For PIX payments, eagerly fetch the QR code
    let pixQrCode: Record<string, unknown> | undefined

    if (billingType === "PIX") {
      try {
        const qr = await this.client.getPixQrCode(payment.id)
        pixQrCode = {
          encodedImage: qr.encodedImage,
          payload: qr.payload,
          expirationDate: qr.expirationDate,
        }
      } catch (err) {
        this.logger.warn(
          `Failed to fetch PIX QR code for payment ${payment.id}: ${(err as Error).message}`
        )
      }
    }

    return {
      id: payment.id,
      data: {
        id: payment.id,
        status: payment.status,
        asaas_customer_id: asaasCustomerId,
        billing_type: billingType,
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
        pix_qr_code: pixQrCode,
      } as SessionData,
    }
  }

  // -----------------------------------------------------------------------
  // authorizePayment
  // -----------------------------------------------------------------------

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const paymentSessionData = (input.data ?? {}) as SessionData
    const paymentId = paymentSessionData.id as string

    if (!paymentId) {
      return {
        status: "authorized" as PaymentSessionStatus,
        data: paymentSessionData,
      }
    }

    const payment = await this.client.getPayment(paymentId)
    const status = mapAsaasStatusToMedusa(payment.status)

    return {
      status: status as unknown as AuthorizePaymentOutput["status"],
      data: {
        ...paymentSessionData,
        status: payment.status,
      },
    }
  }

  // -----------------------------------------------------------------------
  // capturePayment
  // -----------------------------------------------------------------------

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const paymentSessionData = (input.data ?? {}) as SessionData
    const paymentId = paymentSessionData.id as string

    if (!paymentId) {
      return { data: paymentSessionData }
    }

    const payment = await this.client.getPayment(paymentId)

    return {
      data: {
        ...paymentSessionData,
        status: payment.status,
        captured_at: new Date().toISOString(),
      },
    }
  }

  // -----------------------------------------------------------------------
  // refundPayment
  // -----------------------------------------------------------------------

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const paymentSessionData = (input.data ?? {}) as SessionData
    const paymentId = paymentSessionData.id as string

    if (!paymentId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Asaas payment ID for refund"
      )
    }

    // Medusa sends amount in smallest currency unit (cents); may be BigNumber
    const numericAmount = typeof input.amount === "number" ? input.amount : Number(input.amount)
    const refundValue = numericAmount / 100

    const refunded = await this.client.refundPayment(paymentId, refundValue)

    return {
      data: {
        ...paymentSessionData,
        status: refunded.status,
        refunded_at: new Date().toISOString(),
        refund_amount: refundValue,
      },
    }
  }

  // -----------------------------------------------------------------------
  // cancelPayment
  // -----------------------------------------------------------------------

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const paymentSessionData = (input.data ?? {}) as SessionData
    const paymentId = paymentSessionData.id as string

    if (!paymentId) {
      return { data: paymentSessionData }
    }

    const deleted = await this.client.deletePayment(paymentId)

    return {
      data: {
        ...paymentSessionData,
        status: deleted.status,
        cancelled_at: new Date().toISOString(),
      },
    }
  }

  // -----------------------------------------------------------------------
  // deletePayment
  // -----------------------------------------------------------------------

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input)
  }

  // -----------------------------------------------------------------------
  // getPaymentStatus
  // -----------------------------------------------------------------------

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const paymentSessionData = (input.data ?? {}) as SessionData
    const paymentId = paymentSessionData.id as string

    if (!paymentId) {
      return { status: "pending" as PaymentSessionStatus }
    }

    try {
      const payment = await this.client.getPayment(paymentId)
      return { status: mapAsaasStatusToMedusa(payment.status) as unknown as GetPaymentStatusOutput["status"] }
    } catch {
      return { status: "error" as PaymentSessionStatus }
    }
  }

  // -----------------------------------------------------------------------
  // updatePayment
  // -----------------------------------------------------------------------

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Asaas does not support updating an existing payment's amount.
    // We return the existing session data unchanged.
    return { data: (input.data ?? {}) as SessionData }
  }

  // -----------------------------------------------------------------------
  // retrievePayment
  // -----------------------------------------------------------------------

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const paymentSessionData = (input.data ?? {}) as SessionData
    const paymentId = paymentSessionData.id as string

    if (!paymentId) {
      return { data: paymentSessionData }
    }

    const payment = await this.client.getPayment(paymentId)

    return {
      data: {
        ...paymentSessionData,
        status: payment.status,
        value: payment.value,
        net_value: payment.netValue,
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
      },
    }
  }

  // -----------------------------------------------------------------------
  // getWebhookActionAndData
  // -----------------------------------------------------------------------

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = payload.data as unknown as AsaasWebhookPayload
    const headers = payload.headers as Record<string, string>

    // Validate the webhook token if configured
    if (this.options.webhook_token) {
      const receivedToken = headers?.["asaas-access-token"]

      if (!receivedToken || typeof receivedToken !== 'string' || !safeCompare(receivedToken, this.options.webhook_token)) {
        this.logger.warn("Asaas webhook received with invalid access token")

        return {
          action: PaymentActions.NOT_SUPPORTED,
          data: {
            session_id: "",
            amount: 0,
          },
        }
      }
    }

    const event = body?.event
    const payment = body?.payment

    if (!event || !payment) {
      this.logger.warn("Asaas webhook received with missing event or payment data")

      return {
        action: PaymentActions.NOT_SUPPORTED,
        data: {
          session_id: "",
          amount: 0,
        },
      }
    }

    const action = mapWebhookEventToAction(event)

    if (!action) {
      return {
        action: PaymentActions.NOT_SUPPORTED,
        data: {
          session_id: payment.externalReference ?? "",
          amount: Math.round(payment.value * 100),
        },
      }
    }

    this.logger.info(
      `Asaas webhook: event=${event}, paymentId=${payment.id}, action=${action}`
    )

    return {
      action,
      data: {
        session_id: payment.externalReference ?? "",
        amount: Math.round(payment.value * 100),
      },
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Builds a due date string in YYYY-MM-DD format.
   * Defaults to 3 days from now for PIX/Boleto.
   */
  private buildDueDate(daysFromNow = 3): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString().split("T")[0]
  }
}

export default AsaasPaymentProviderService
