/**
 * POST /api/contact
 * Formulaire de contact public — envoie un email à l'équipe via Resend.
 * Protections : validation, honeypot, délai minimum, rate-limit IP.
 */
import { Resend } from 'resend'
import { escapeHtml } from '../utils/escapeHtml'

// Rate limit en mémoire : max 3 envois / heure / IP
const ipLog = new Map<string, number[]>()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, subject, message, botField, timestamp } = body

  // 1. Honeypot — bot qui remplit le champ caché → rejeté silencieusement
  if (botField) return { success: true }

  // 2. Soumission trop rapide (< 3s) → probablement un bot
  if (!timestamp || Date.now() - timestamp < 3000)
    throw createError({ statusCode: 400, statusMessage: 'Soumission trop rapide' })

  // 3. Validation basique
  if (!name || name.trim().length < 2 || name.length > 100)
    throw createError({ statusCode: 400, statusMessage: 'Nom invalide' })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw createError({ statusCode: 400, statusMessage: 'Email invalide' })
  if (!message || message.trim().length < 10 || message.length > 2000)
    throw createError({ statusCode: 400, statusMessage: 'Message invalide (10–2000 caractères)' })

  // 4. Rate limit : max 3 envois / heure / IP
  const ip = getRequestIP(event) ?? 'unknown'
  const now = Date.now()
  const history = (ipLog.get(ip) ?? []).filter(t => now - t < 3_600_000)
  if (history.length >= 3)
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives, réessayez dans une heure.' })
  ipLog.set(ip, [...history, now])

  // 5. Envoi via Resend
  const config = useRuntimeConfig(event)
  const resend = new Resend(config.resendApiKey)

  // Strip CRLF du sujet pour éviter toute injection de header email
  const cleanSubject = subject?.trim().replace(/[\r\n]+/g, ' ').slice(0, 200) ?? ''
  const cleanName = name.trim()
  const cleanEmail = email.trim()

  const subjectLine = cleanSubject
    ? `[Contact] ${cleanSubject} — ${cleanName}`
    : `[Contact] Message de ${cleanName}`

  const { error } = await resend.emails.send({
    from: 'ASC Escalade <noreply@asc.nossereau.fr>',
    to: 'matnoss@gmail.com',
    replyTo: cleanEmail,
    subject: subjectLine,
    html: `
      <p><strong>Nom :</strong> ${escapeHtml(cleanName)}</p>
      <p><strong>Email :</strong> ${escapeHtml(cleanEmail)}</p>
      ${cleanSubject ? `<p><strong>Sujet :</strong> ${escapeHtml(cleanSubject)}</p>` : ''}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
      <p style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(message.trim()).replace(/\n/g, '<br>')}</p>
    `,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Erreur envoi email' })
  }

  return { success: true }
})
