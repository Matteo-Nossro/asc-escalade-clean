// app/utils/authRedirect.ts
/** Lien de retour des e-mails de confirmation d'inscription (source unique). */
export const signupConfirmationRedirect = (origin?: string): string =>
  `${origin ?? window.location.origin}/callback?type=signup`
