export default defineEventHandler((event) => {
    deleteCookie(event, '__sanity_preview')
    return sendRedirect(event, '/')
})
