/**
 * Asaas Payment Provider - Type Definitions
 *
 * Complete TypeScript types for the Asaas REST API v3.
 * Reference: https://docs.asaas.com/reference
 */

// ---------------------------------------------------------------------------
// Enums / Unions
// ---------------------------------------------------------------------------

export type BillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"

export type PaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS"

export type WebhookEvent =
  | "PAYMENT_CREATED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"
  | "PAYMENT_ANTICIPATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_REFUND_IN_PROGRESS"
  | "PAYMENT_RECEIVED_IN_CASH_UNDONE"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
  | "PAYMENT_DUNNING_RECEIVED"
  | "PAYMENT_DUNNING_REQUESTED"
  | "PAYMENT_BANK_SLIP_VIEWED"
  | "PAYMENT_CHECKOUT_VIEWED"

// ---------------------------------------------------------------------------
// Credit Card
// ---------------------------------------------------------------------------

export interface CreditCardInput {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface CreditCardHolderInfoInput {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone?: string
  mobilePhone?: string
  addressComplement?: string
}

// ---------------------------------------------------------------------------
// Discount / Interest / Fine
// ---------------------------------------------------------------------------

export interface Discount {
  value: number
  dueDateLimitDays?: number
  type?: "FIXED" | "PERCENTAGE"
}

export interface Interest {
  value: number
  type?: "FIXED" | "PERCENTAGE"
}

export interface Fine {
  value: number
  type?: "FIXED" | "PERCENTAGE"
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export interface CreateCustomerInput {
  name: string
  cpfCnpj?: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
  additionalEmails?: string
  municipalInscription?: string
  stateInscription?: string
  groupName?: string
  company?: string
}

export interface AsaasCustomer {
  id: string
  dateCreated: string
  name: string
  email: string | null
  company: string | null
  phone: string | null
  mobilePhone: string | null
  address: string | null
  addressNumber: string | null
  complement: string | null
  province: string | null
  postalCode: string | null
  cpfCnpj: string | null
  personType: "FISICA" | "JURIDICA"
  deleted: boolean
  additionalEmails: string | null
  externalReference: string | null
  notificationDisabled: boolean
  city: number | null
  state: string | null
  country: string | null
  observations: string | null
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export interface CreatePaymentInput {
  customer: string
  billingType: BillingType
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
  discount?: Discount
  interest?: Interest
  fine?: Fine
  postalService?: boolean
  creditCard?: CreditCardInput
  creditCardHolderInfo?: CreditCardHolderInfoInput
  creditCardToken?: string
  remoteIp?: string
  callback?: {
    successUrl?: string
    autoRedirect?: boolean
  }
}

export interface AsaasPayment {
  id: string
  dateCreated: string
  customer: string
  paymentLink: string | null
  value: number
  netValue: number
  originalValue: number | null
  interestValue: number | null
  description: string | null
  billingType: BillingType
  confirmedDate: string | null
  creditCard: {
    creditCardNumber: string
    creditCardBrand: string
    creditCardToken: string
  } | null
  pixTransaction: {
    id: string
    qrCode: string | null
    expirationDate: string | null
  } | null
  status: PaymentStatus
  dueDate: string
  originalDueDate: string
  paymentDate: string | null
  clientPaymentDate: string | null
  installmentNumber: number | null
  invoiceUrl: string
  invoiceNumber: string
  externalReference: string | null
  deleted: boolean
  anticipated: boolean
  anticipable: boolean
  refunds: Array<{
    dateCreated: string
    status: string
    value: number
    description: string | null
    transactionReceiptUrl: string | null
  }> | null
  nossoNumero: string | null
  bankSlipUrl: string | null
  lastInvoiceViewedDate: string | null
  lastBankSlipViewedDate: string | null
  postalService: boolean
  transactionReceiptUrl: string | null
}

// ---------------------------------------------------------------------------
// PIX
// ---------------------------------------------------------------------------

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

// ---------------------------------------------------------------------------
// Paginated Response
// ---------------------------------------------------------------------------

export interface AsaasPaginatedResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export interface AsaasWebhookPayload {
  event: WebhookEvent
  payment: AsaasPayment
}

// ---------------------------------------------------------------------------
// Module Options
// ---------------------------------------------------------------------------

export interface AsaasPaymentProviderOptions {
  api_key: string
  base_url?: string
  webhook_token?: string
}

// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------

export interface AsaasApiError {
  errors: Array<{
    code: string
    description: string
  }>
}
