# Revue — enfants-fiabilite

Verdict : OK (aucun bloquant)
check.mjs : 0 erreur / 0 avertissement. Typecheck et tests : porte de qualité verte (764/764, typecheck 186 = baseline).

## Bloquants
Aucun.

## Importants
Aucun.

## Mineurs
- `server/api/register.post.ts:50` : le 400 « Compte utilisateur introuvable » se distingue des 403 neutres, donc il indique si un userId existe. Le userId est un UUID non devinable, donc le risque est faible. À aligner si on veut une neutralité totale.
- `app/pages/register.vue:~503` : le texte « déjà utilisée » n'est plus substitué que pour un 409. Un 400 ou 500 dont le message contient « déjà » s'affiche maintenant tel quel. C'est voulu (plan T2).
- `app/pages/profil.vue:~957` : le bloc `{ ... }` anonyme laisse la structure de l'ancien `if`. C'est fonctionnel mais peu lisible, et un commentaire suffirait. La requête `parent_access` part désormais pour tout adhérent, ce que la spec accepte (aucune section affichée sans lien).
- Compensation : si l'insertion du rôle `parent` échoue (dernière étape), les enfants et leurs liens sont supprimés et la réservation est libérée, donc aucun état partiel. La reprise ne peut pas laisser un rôle `parent` sans enfant.

## Vérifié (sans défaut)
- Spec : Q1 (rôle accordé en dernier, `completeProfile.ts` étape 4), Q2 (3 appels de compensation journalisés avec leur étape, erreur d'origine relancée), Q3 (`23505` donne 409 avant le `try`, donc pas de compensation), Q4 (`:41`, `:52` et `:60` utilisent la même constante `NEUTRAL_403`, 403 inchangé), Q10 (conditions de `profil.vue` et de `MemberModal.vue`).
- Fuite d'état : les trois 403 renvoient une chaîne identique. Le texte mentionne la connexion sans dire si le compte existe ou est confirmé.
- Sécurité : service role uniquement côté serveur, entrées validées par `validateProfileInput`, aucun secret côté client.
- Périmètre : aucun fichier hors plan modifié, aucune migration ajoutée. Les tests écrits d'abord (T0) sont des fichiers nouveaux non suivis, sans historique de modification.
