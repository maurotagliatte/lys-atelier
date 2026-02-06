import { Resend } from "resend"

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@lysatelier.com.br"
const FROM_NAME = process.env.FROM_NAME || "Lys Atelier"

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail(
  params: SendEmailParams
): Promise<{ id: string } | null> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email send")
    return null
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })

  if (error) {
    console.error("[email] Failed to send:", error)
    return null
  }

  return data
}
