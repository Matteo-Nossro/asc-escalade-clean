/**
 * POST /api/send-registration-email
 * Envoie un email de confirmation d'inscription à l'utilisateur via Resend.
 * Body : { registrationId, email, name, eventTitle, eventDate, price }
 */
import { Resend } from 'resend'

interface RegistrationEmailPayload {
  registrationId: string
  email: string
  name: string
  eventTitle: string
  eventDate?: string
  price: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const resend = new Resend(config.resendApiKey)

  const body = await readBody<RegistrationEmailPayload>(event)
  const { email, name, eventTitle, eventDate, price } = body

  if (!email || !name || !eventTitle) {
    throw createError({ statusCode: 400, statusMessage: 'Paramètres manquants' })
  }

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const priceLabel = price > 0 ? `${price}€` : 'Gratuite'
  const paymentNote = price > 0
    ? `<p style="margin:0 0 12px;font-size:14px;color:#334155;">Vous allez être redirigé(e) vers HelloAsso pour finaliser le paiement de <strong>${price}€</strong>.</p>`
    : `<p style="margin:0 0 12px;font-size:14px;color:#334155;">Cette sortie est <strong>gratuite</strong>. Votre inscription est confirmée.</p>`

  const html = `<!DOCTYPE html>
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
                    <span style="display:inline-block;background:#7FD857;color:#0F1729;font-weight:800;font-size:13px;padding:4px 10px;border-radius:20px;letter-spacing:.3px;">
                      ✓ Inscription enregistrée
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
              <p style="margin:0 0 8px;font-size:16px;color:#0f172a;">Bonjour <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
                Votre demande d'inscription à la sortie <strong>${eventTitle}</strong> a bien été enregistrée.
              </p>
            </td>
          </tr>

          <!-- Détails -->
          <tr>
            <td style="background:#ffffff;padding:0 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px;">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#64748b;">Sortie</td>
                  <td style="padding:6px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${eventTitle}</td>
                </tr>
                ${formattedDate ? `<tr>
                  <td style="padding:6px 0;font-size:14px;color:#64748b;">Date</td>
                  <td style="padding:6px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${formattedDate}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#64748b;">Tarif</td>
                  <td style="padding:6px 0;font-size:14px;font-weight:600;color:#7FD857;text-align:right;">${priceLabel}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Note paiement -->
          <tr>
            <td style="background:#ffffff;padding:8px 40px 28px;">
              ${paymentNote}
              <p style="margin:0;font-size:14px;color:#64748b;">À bientôt sur le rocher !</p>
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

  const { error } = await resend.emails.send({
    from: 'ASC Escalade <noreply@asc.nossereau.fr>',
    replyTo: 'contact@asc.nossereau.fr',
    to: email,
    subject: `Inscription confirmée — ${eventTitle}`,
    html,
  })

  if (error) {
    console.error('[send-registration-email] Resend error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
