/**
 * POST /api/admin/send-email
 * Envoie un email de notification (acceptation/refus) via Resend.
 */
import { Resend } from 'resend'

interface EmailPayload {
  to: string
  userName: string
  action: 'approve' | 'reject'
  requestType: 'group' | 'event'
  targetName: string
  targetDetail?: string
  adminNote?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const resend = new Resend(config.resendApiKey)

  const body = await readBody<EmailPayload>(event)
  const { to, userName, action, requestType, targetName, targetDetail, adminNote } = body

  console.log('[send-email] payload:', { to, userName, action, requestType, targetName })

  if (!to || !userName || !action || !targetName) {
    console.error('[send-email] Paramètres manquants:', { to, userName, action, targetName })
    throw createError({ statusCode: 400, statusMessage: 'Paramètres manquants' })
  }

  const isApproval = action === 'approve'
  const typeLabel = requestType === 'group' ? 'au groupe' : "à l'événement"
  const subject = isApproval
    ? `Inscription confirmée — ${targetName}`
    : `Inscription refusée — ${targetName}`

  const html = buildEmailHtml({ isApproval, typeLabel, userName, targetName, targetDetail, adminNote })

  const { error } = await resend.emails.send({
    from: 'ASC Escalade <noreply@asc.nossereau.fr>',
    replyTo: 'contact@asc.nossereau.fr',
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[send-email] Resend error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})

function buildEmailHtml(opts: {
  isApproval: boolean
  typeLabel: string
  userName: string
  targetName: string
  targetDetail?: string
  adminNote?: string
}): string {
  const { isApproval, typeLabel, userName, targetName, adminNote } = opts

  const accentColor = isApproval ? '#7FD857' : '#f97316'
  const statusLabel = isApproval ? 'Inscription confirmée' : 'Inscription refusée'
  const statusIcon = isApproval ? '✓' : '✗'

  const messageBody = isApproval
    ? `Votre demande d'inscription ${typeLabel} <strong>${targetName}</strong> a été <strong>acceptée</strong>.`
    : `Votre demande d'inscription ${typeLabel} <strong>${targetName}</strong> n'a pas pu être acceptée.`

  const noteBlock = adminNote ? `
    <tr>
      <td style="padding: 0 40px 16px; background:#ffffff">
        <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">${adminNote}</p>
      </td>
    </tr>` : ''

  const footer = isApproval
    ? `<p style="margin:0;font-size:14px;color:#64748b;">À bientôt au club !</p>`
    : `<p style="margin:0;font-size:14px;color:#64748b;">N'hésitez pas à nous contacter si vous souhaitez plus d'informations.</p>`

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#0F1729;border-radius:12px 12px 0 0;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:${accentColor};color:#0F1729;font-weight:800;font-size:13px;padding:4px 10px;border-radius:20px;letter-spacing:.3px;">
                      ${statusIcon} ${statusLabel}
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:13px;font-weight:700;color:#7FD857;letter-spacing:.5px;">ASC ESCALADE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 8px;">
              <p style="margin:0 0 8px;font-size:16px;color:#0f172a;">Bonjour <strong>${userName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">${messageBody}</p>
            </td>
          </tr>

          ${noteBlock}

          <!-- Footer message -->
          <tr>
            <td style="background:#ffffff;padding:8px 40px 28px;">
              ${footer}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff;padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;">
            </td>
          </tr>

          <!-- Club footer -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:20px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0F1729;">ASC Escalade</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#94a3b8;">Chevigny-Saint-Sauveur</p>
                  </td>
                  <td align="right">
                    <a href="mailto:contact@asc.nossereau.fr" style="font-size:12px;color:#7FD857;text-decoration:none;">contact@asc.nossereau.fr</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
