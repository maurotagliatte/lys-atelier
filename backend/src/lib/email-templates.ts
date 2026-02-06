/**
 * Transactional email templates for Lys Atelier.
 *
 * All templates use inline CSS for maximum email-client compatibility.
 * Content is in Brazilian Portuguese (pt-BR).
 */

const BRAND_COLOR = "#b08968"
const BRAND_LIGHT = "#f5ebe0"
const TEXT_PRIMARY = "#3d3228"
const TEXT_SECONDARY = "#6b5e52"
const BORDER_COLOR = "#e6ddd4"

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lys Atelier</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8f5;font-family:'Georgia','Times New Roman',serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#faf8f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${BORDER_COLOR};">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:400;color:#ffffff;letter-spacing:2px;">
                LYS ATELIER
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:${BRAND_LIGHT};border-top:1px solid ${BORDER_COLOR};text-align:center;">
              <p style="margin:0;font-size:12px;color:${TEXT_SECONDARY};line-height:1.6;">
                Lys Atelier &mdash; Listas de Casamento
              </p>
              <p style="margin:4px 0 0 0;font-size:11px;color:${TEXT_SECONDARY};">
                Este e-mail foi enviado automaticamente. Por favor, nao responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function formatItemsTable(
  items: Array<{ title: string; quantity: number; unitPrice?: number }>,
  currencyCode: string,
  showPrice: boolean
): string {
  const rows = items
    .map((item) => {
      const priceCell = showPrice
        ? `<td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};font-size:14px;color:${TEXT_PRIMARY};text-align:right;">
            ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode.toUpperCase() }).format(Number(item.unitPrice || 0) / 100)}
          </td>`
        : ""
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};font-size:14px;color:${TEXT_PRIMARY};">
          ${escapeHtml(item.title)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};font-size:14px;color:${TEXT_SECONDARY};text-align:center;">
          ${item.quantity}x
        </td>
        ${priceCell}
      </tr>`
    })
    .join("")

  const priceHeader = showPrice
    ? `<th style="padding:10px 12px;border-bottom:2px solid ${BRAND_COLOR};font-size:12px;color:${TEXT_SECONDARY};text-align:right;text-transform:uppercase;letter-spacing:1px;">Valor</th>`
    : ""

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
    <tr>
      <th style="padding:10px 12px;border-bottom:2px solid ${BRAND_COLOR};font-size:12px;color:${TEXT_SECONDARY};text-align:left;text-transform:uppercase;letter-spacing:1px;">Item</th>
      <th style="padding:10px 12px;border-bottom:2px solid ${BRAND_COLOR};font-size:12px;color:${TEXT_SECONDARY};text-align:center;text-transform:uppercase;letter-spacing:1px;">Qtd</th>
      ${priceHeader}
    </tr>
    ${rows}
  </table>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ---------------------------------------------------------------------------
// Template: Gift Received (sent to the couple)
// ---------------------------------------------------------------------------

export function giftReceivedTemplate(data: {
  coupleNames: string
  guestEmail: string
  items: Array<{ title: string; quantity: number }>
  total: string
  currencyCode: string
  orderDisplayId: number | string
  slug: string
}): string {
  const content = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:400;color:${BRAND_COLOR};">
      Parabens, ${escapeHtml(data.coupleNames)}!
    </h2>
    <p style="margin:0 0 24px 0;font-size:16px;color:${TEXT_PRIMARY};line-height:1.6;">
      Um convidado acabou de presentear voces! Confira os detalhes abaixo.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_LIGHT};border-radius:6px;padding:16px;margin-bottom:20px;">
      <tr>
        <td style="padding:12px 16px;">
          <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Pedido</p>
          <p style="margin:0;font-size:16px;color:${TEXT_PRIMARY};font-weight:600;">#${data.orderDisplayId}</p>
        </td>
        <td style="padding:12px 16px;text-align:right;">
          <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Convidado</p>
          <p style="margin:0;font-size:14px;color:${TEXT_PRIMARY};">${escapeHtml(data.guestEmail)}</p>
        </td>
      </tr>
    </table>

    ${formatItemsTable(data.items, data.currencyCode, false)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
      <tr>
        <td style="padding:12px 0;text-align:right;">
          <span style="font-size:13px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Total:&nbsp;&nbsp;</span>
          <span style="font-size:18px;font-weight:600;color:${TEXT_PRIMARY};">${escapeHtml(data.total)}</span>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0 0;font-size:14px;color:${TEXT_SECONDARY};line-height:1.6;text-align:center;">
      Voces podem acompanhar todos os presentes recebidos no painel administrativo da sua lista.
    </p>`

  return baseLayout(content)
}

// ---------------------------------------------------------------------------
// Template: Purchase Confirmation (sent to the guest)
// ---------------------------------------------------------------------------

export function purchaseConfirmationTemplate(data: {
  coupleNames: string
  items: Array<{ title: string; quantity: number; unitPrice: number }>
  total: string
  currencyCode: string
  orderDisplayId: number | string
  slug: string
}): string {
  const content = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:400;color:${BRAND_COLOR};">
      Obrigado pelo presente!
    </h2>
    <p style="margin:0 0 24px 0;font-size:16px;color:${TEXT_PRIMARY};line-height:1.6;">
      Seu presente para <strong>${escapeHtml(data.coupleNames)}</strong> foi confirmado.
      Muito obrigado pela sua generosidade!
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_LIGHT};border-radius:6px;margin-bottom:20px;">
      <tr>
        <td style="padding:12px 16px;">
          <p style="margin:0 0 4px 0;font-size:12px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Numero do pedido</p>
          <p style="margin:0;font-size:16px;color:${TEXT_PRIMARY};font-weight:600;">#${data.orderDisplayId}</p>
        </td>
      </tr>
    </table>

    ${formatItemsTable(data.items, data.currencyCode, true)}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;border-top:2px solid ${BRAND_COLOR};padding-top:12px;">
      <tr>
        <td style="padding:12px 0;text-align:right;">
          <span style="font-size:13px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Total:&nbsp;&nbsp;</span>
          <span style="font-size:20px;font-weight:600;color:${TEXT_PRIMARY};">${escapeHtml(data.total)}</span>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0 0;font-size:14px;color:${TEXT_SECONDARY};line-height:1.6;text-align:center;">
      ${escapeHtml(data.coupleNames)} serao notificados sobre o seu presente.
      Obrigado por fazer parte deste momento especial!
    </p>`

  return baseLayout(content)
}

// ---------------------------------------------------------------------------
// Template: Welcome (sent to the couple after list creation)
// ---------------------------------------------------------------------------

export function welcomeTemplate(data: {
  coupleNames: string
  slug: string
  weddingDate: string
  listUrl: string
}): string {
  const formattedDate = (() => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(data.weddingDate))
    } catch {
      return data.weddingDate
    }
  })()

  const content = `
    <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:400;color:${BRAND_COLOR};">
      Bem-vindos ao Lys Atelier!
    </h2>
    <p style="margin:0 0 24px 0;font-size:16px;color:${TEXT_PRIMARY};line-height:1.6;">
      Parabens, <strong>${escapeHtml(data.coupleNames)}</strong>!
      Sua lista de casamento foi criada com sucesso.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_LIGHT};border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 12px 0;font-size:12px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:1px;">Dados da sua lista</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:4px 0;font-size:14px;color:${TEXT_SECONDARY};width:120px;">Casal:</td>
              <td style="padding:4px 0;font-size:14px;color:${TEXT_PRIMARY};font-weight:600;">${escapeHtml(data.coupleNames)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:${TEXT_SECONDARY};">Data:</td>
              <td style="padding:4px 0;font-size:14px;color:${TEXT_PRIMARY};">${escapeHtml(formattedDate)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:${TEXT_SECONDARY};">Link da lista:</td>
              <td style="padding:4px 0;">
                <a href="${escapeHtml(data.listUrl)}" style="font-size:14px;color:${BRAND_COLOR};text-decoration:underline;">
                  ${escapeHtml(data.listUrl)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">
      Proximos passos
    </h3>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;background-color:${BRAND_COLOR};color:#ffffff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;">1</span>
        </td>
        <td style="padding:8px 0 8px 8px;font-size:14px;color:${TEXT_PRIMARY};line-height:1.5;">
          Adicione os presentes que desejam receber a sua lista.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;background-color:${BRAND_COLOR};color:#ffffff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;">2</span>
        </td>
        <td style="padding:8px 0 8px 8px;font-size:14px;color:${TEXT_PRIMARY};line-height:1.5;">
          Compartilhe o link da lista com seus convidados.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;background-color:${BRAND_COLOR};color:#ffffff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;">3</span>
        </td>
        <td style="padding:8px 0 8px 8px;font-size:14px;color:${TEXT_PRIMARY};line-height:1.5;">
          Acompanhe os presentes recebidos pelo painel administrativo.
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0 0;font-size:14px;color:${TEXT_SECONDARY};line-height:1.6;text-align:center;">
      Desejamos a voces um casamento lindo e cheio de amor!
    </p>`

  return baseLayout(content)
}
