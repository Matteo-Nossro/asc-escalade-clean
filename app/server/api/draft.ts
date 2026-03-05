export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const config = useRuntimeConfig()

    // Vérifier le secret
    if (query.secret !== config.sanityPreviewSecret) {
        throw createError({
            statusCode: 401,
            message: 'Invalid token'
        })
    }

    // Activer le cookie de preview
    setCookie(event, '__sanity_preview', 'true', {
        httpOnly: false, // ⚠️ Important : false pour que JavaScript puisse y accéder
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none', // ⚠️ Important pour les iframes
        maxAge: 60 * 60 * 24 // 24h
    })

    // Rediriger vers la page demandée
    const redirectTo = (query.slug as string) || '/'
    return sendRedirect(event, redirectTo)
})
