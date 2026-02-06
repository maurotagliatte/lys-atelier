import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

/**
 * Tests for the sendEmail function from src/lib/email.ts.
 *
 * We mock the `resend` module entirely to avoid making real API calls.
 * The sendEmail function creates a Resend instance internally using `new`,
 * so the mock must expose a class (not a plain function).
 */

const mockSend = vi.fn()

vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

// Dynamic import after the mock is registered so the module picks it up
let sendEmail: typeof import("../../lib/email").sendEmail

beforeEach(async () => {
  mockSend.mockReset()

  // Clear the cached module so each test gets a fresh import
  vi.resetModules()

  // Re-register the mock after resetModules (vitest hoists vi.mock but
  // resetModules clears the module cache, so we need to re-declare it)
  vi.mock("resend", () => {
    return {
      Resend: class MockResend {
        emails = { send: mockSend }
      },
    }
  })

  const emailModule = await import("../../lib/email")
  sendEmail = emailModule.sendEmail
})

afterEach(() => {
  delete process.env.RESEND_API_KEY
  delete process.env.FROM_EMAIL
  delete process.env.FROM_NAME
})

describe("sendEmail", () => {
  const emailParams = {
    to: "test@example.com",
    subject: "Test Subject",
    html: "<p>Hello</p>",
  }

  it("should return null when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY
    const result = await sendEmail(emailParams)
    expect(result).toBeNull()
  })

  it("should not call resend.emails.send when API key is missing", async () => {
    delete process.env.RESEND_API_KEY
    await sendEmail(emailParams)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it("should call resend.emails.send with correct params when API key is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key_123"
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null })

    await sendEmail(emailParams)

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      })
    )
  })

  it("should include the from field with default name and email", async () => {
    process.env.RESEND_API_KEY = "re_test_key_123"
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null })

    await sendEmail(emailParams)

    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.from).toContain("Lys Atelier")
    expect(callArgs.from).toContain("noreply@lysatelier.com.br")
  })

  it("should return { id } on successful send", async () => {
    process.env.RESEND_API_KEY = "re_test_key_123"
    mockSend.mockResolvedValue({
      data: { id: "email_abc" },
      error: null,
    })

    const result = await sendEmail(emailParams)
    expect(result).toEqual({ id: "email_abc" })
  })

  it("should return null when resend returns an error", async () => {
    process.env.RESEND_API_KEY = "re_test_key_123"
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key", statusCode: 403 },
    })

    const result = await sendEmail(emailParams)
    expect(result).toBeNull()
  })
})
