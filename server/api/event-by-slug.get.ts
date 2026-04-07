/**
 * GET /api/event-by-slug?slug=:slug
 * Retourne l'event Supabase correspondant au slug Storyblok.
 * Utilise la colonne `slug` existante (TEXT UNIQUE).
 */
export default defineEventHandler(async (event) => {
  const slug = getQuery(event).slug as string | undefined

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Paramètre slug manquant' })
  }

  const supabase = useSupabaseServiceClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Événement non trouvé' })
  }

  return data
})
