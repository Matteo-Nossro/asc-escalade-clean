/**
 * POST /api/sync-event
 * Webhook Storyblok : synchronise les sorties publiées dans la table `events`.
 * - published  → upsert (conflict sur storyblok_uuid)
 * - unpublished / deleted → delete
 *
 * Colonnes existantes utilisées : slug, title, starts_at, location, max_participants, price
 * Colonnes ajoutées par la migration : storyblok_uuid, event_date, current_participants
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // --- Vérification du secret ---
  const signature = getHeader(event, 'webhook-signature')
  if (!signature || signature !== config.storyblokWebhookSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Secret invalide' })
  }

  const body = await readBody(event)
  const { action, story_id } = body

  if (!story_id) {
    throw createError({ statusCode: 400, statusMessage: 'story_id manquant' })
  }

  // --- Fetch de la story via l'API Storyblok ---
  const storyRes = await $fetch<{ story: any }>(
    `https://api.storyblok.com/v2/cdn/stories/${story_id}`,
    {
      query: { token: process.env.STORYBLOK_TOKEN },
      ignoreResponseError: true,
    }
  ).catch(() => null)

  const story = storyRes?.story
  if (!story) {
    return { ok: true, skipped: true }
  }

  // --- Filtre : uniquement les posts de type 'sortie' ---
  if (story.content?.component !== 'post' || story.content?.type !== 'sortie') {
    return { ok: true, skipped: true }
  }

  const supabase = useSupabaseServiceClient()

  if (action === 'published') {
    // eventDate Storyblok : "YYYY-MM-DD HH:MM" → starts_at (timestamptz) + event_date (date)
    const rawDate: string | undefined = story.content.eventDate
    const startsAt = rawDate
      ? new Date(rawDate.replace(' ', 'T') + ':00').toISOString()
      : new Date().toISOString()
    const eventDate = rawDate ? rawDate.split(' ')[0] : null

    const fields = {
      storyblok_uuid: story.uuid,
      slug: story.slug,
      title: story.content.title ?? story.name,
      starts_at: startsAt,
      event_date: eventDate,
      max_participants: story.content.maxParticipants ?? 0,
      price: story.content.price ?? 0,
      location: story.content.location ?? null,
      // current_participants exclu → conserve la valeur existante sur update
    }

    // Vérifie si un event manuel (sans storyblok_uuid) existe déjà avec ce slug.
    // Si oui → on lui assigne le storyblok_uuid (merge) plutôt que d'insérer un doublon.
    const { data: existingBySlug } = await supabase
      .from('events')
      .select('id')
      .eq('slug', story.slug)
      .is('storyblok_uuid', null)
      .maybeSingle()

    let error: any

    if (existingBySlug) {
      // Merge : mise à jour de l'event manuel existant
      ;({ error } = await supabase
        .from('events')
        .update(fields)
        .eq('id', existingBySlug.id))
    } else {
      // Upsert normal sur storyblok_uuid (index partiel events_storyblok_uuid_idx)
      ;({ error } = await supabase
        .from('events')
        .upsert(fields, { onConflict: 'storyblok_uuid' }))
    }

    if (error) {
      console.error('[sync-event] Erreur upsert:', error)
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { ok: true, action: existingBySlug ? 'merged' : 'upserted', slug: story.slug }
  }

  if (action === 'unpublished' || action === 'deleted') {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('storyblok_uuid', story.uuid)

    if (error) {
      console.error('[sync-event] Erreur delete:', error)
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { ok: true, action: 'deleted', uuid: story.uuid }
  }

  return { ok: true, skipped: true }
})
