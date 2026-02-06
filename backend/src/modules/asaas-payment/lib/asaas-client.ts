/**
 * Asaas REST API Client
 *
 * Typed wrapper around the Asaas v3 REST API using the native fetch() API.
 * Handles authentication, error parsing, and response typing for all
 * payment-related endpoints.
 */

import type {
  AsaasApiError,
  AsaasCustomer,
  AsaasPaginatedResponse,
  AsaasPayment,
  AsaasPixQrCode,
  CreateCustomerInput,
  CreatePaymentInput,
} from "./types"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SANDBOX_BASE_URL = "https://sandbox.asaas.com/api/v3"
const PRODUCTION_BASE_URL = "https://api.asaas.com/v3"

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class AsaasClientError extends Error {
  public readonly statusCode: number
  public readonly errors: AsaasApiError["errors"]

  constructor(message: string, statusCode: number, errors: AsaasApiError["errors"] = []) {
    super(message)
    this.name = "AsaasClientError"
    this.statusCode = statusCode
    this.errors = errors
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

interface AsaasClientConfig {
  apiKey: string
  baseUrl?: string
}

export class AsaasClient {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config: AsaasClientConfig) {
    if (!config.apiKey) {
      throw new Error("Asaas API key is required")
    }

    this.apiKey = config.apiKey
    this.baseUrl = (config.baseUrl ?? SANDBOX_BASE_URL).replace(/\/+$/, "")
  }

  // -----------------------------------------------------------------------
  // Customers
  // -----------------------------------------------------------------------

  async createCustomer(data: CreateCustomerInput): Promise<AsaasCustomer> {
    return this.post<AsaasCustomer>("/customers", data)
  }

  async listCustomers(params?: {
    cpfCnpj?: string
    email?: string
    externalReference?: string
  }): Promise<AsaasPaginatedResponse<AsaasCustomer>> {
    const query = params ? this.buildQuery(params) : ""
    return this.get<AsaasPaginatedResponse<AsaasCustomer>>(`/customers${query}`)
  }

  // -----------------------------------------------------------------------
  // Payments
  // -----------------------------------------------------------------------

  async createPayment(data: CreatePaymentInput): Promise<AsaasPayment> {
    return this.post<AsaasPayment>("/payments", data)
  }

  async getPayment(id: string): Promise<AsaasPayment> {
    return this.get<AsaasPayment>(`/payments/${encodeURIComponent(id)}`)
  }

  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return this.get<AsaasPixQrCode>(
      `/payments/${encodeURIComponent(paymentId)}/pixQrCode`
    )
  }

  async refundPayment(id: string, value?: number): Promise<AsaasPayment> {
    const body = value !== undefined ? { value } : undefined
    return this.post<AsaasPayment>(
      `/payments/${encodeURIComponent(id)}/refund`,
      body
    )
  }

  async deletePayment(id: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(
      "DELETE",
      `/payments/${encodeURIComponent(id)}`
    )
  }

  // -----------------------------------------------------------------------
  // HTTP helpers
  // -----------------------------------------------------------------------

  private get defaultHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      access_token: this.apiKey,
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const init: RequestInit = {
      method,
      headers: this.defaultHeaders,
    }

    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }

    let response: Response

    try {
      response = await fetch(url, init)
    } catch (err) {
      throw new AsaasClientError(
        `Network error calling Asaas API: ${(err as Error).message}`,
        0
      )
    }

    if (!response.ok) {
      let apiError: AsaasApiError | undefined

      try {
        apiError = (await response.json()) as AsaasApiError
      } catch {
        // Response body was not valid JSON; ignore.
      }

      const errorDescriptions =
        apiError?.errors?.map((e) => e.description).join("; ") ??
        response.statusText

      throw new AsaasClientError(
        `Asaas API error (${response.status}): ${errorDescriptions}`,
        response.status,
        apiError?.errors ?? []
      )
    }

    return (await response.json()) as T
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path)
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body)
  }

  private buildQuery(params: Record<string, string | undefined>): string {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined
    ) as [string, string][]

    if (entries.length === 0) return ""

    const searchParams = new URLSearchParams(entries)
    return `?${searchParams.toString()}`
  }
}

export { SANDBOX_BASE_URL, PRODUCTION_BASE_URL }
