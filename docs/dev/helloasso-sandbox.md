# HelloAsso — essai en sandbox (développeur)

> Page technique, pour le développeur. Le guide destiné au bureau (`docs/guide-exploitation.md`) y renvoie seulement.
> Mise en prod (ordre des opérations, variables de prod, secret du webhook) : [../mise-en-prod.md](../mise-en-prod.md).

La **sandbox** HelloAsso est un espace de test : elle a ses propres clés, son slug et ses propres URL. On peut y vérifier la connexion sans encaisser de vrai paiement.

1. **Créer l'association de test** sur `https://auth.helloasso-sandbox.com/inscription` (bouton « Créer mon asso de test »). Pour un premier paiement de test, il faut valider le compte avec des documents fictifs.
2. **Récupérer les clés** dans le back-office sandbox (`www.helloasso-sandbox.com`) : identifiant et secret du client API, slug de l'organisation. Les clés de production et de sandbox sont distinctes. L'emplacement exact de la clé API n'est pas documenté par HelloAsso : à confirmer à l'écran.
3. **Renseigner les variables** chez l'hébergeur (ou dans `.env` en local) :

| Variable | Valeur |
|---|---|
| `NUXT_HELLOASSO_ENVIRONMENT` | `sandbox`. **Obligatoire, sans valeur par défaut** : sans elle, la synchronisation renvoie `config_missing` et le test de connexion échoue à l'étape « config » |
| `NUXT_HELLOASSO_CLIENT_ID` | identifiant du client API sandbox |
| `NUXT_HELLOASSO_CLIENT_SECRET` | secret du client API sandbox |
| `NUXT_HELLOASSO_ORG_SLUG` | slug de l'association de test |
| `NUXT_HELLOASSO_API_URL` (facultative) | par défaut `https://api.helloasso-sandbox.com/v5` |
| `NUXT_HELLOASSO_TOKEN_URL` (facultative) | par défaut `https://api.helloasso-sandbox.com/oauth2/token` |
| `NUXT_HELLOASSO_WEBHOOK_SECRET` (facultative en sandbox) | secret du webhook ; **sans lui, le webhook refuse toutes les notifications (503)** |

Les anciennes variables `HELLOASSO_*` restent lues au build, en repli. Les URL par défaut ont été validées le 2026-10-28 : jeton obtenu, renouvellement OK, liste des formulaires OK, et droit `AccessTransactions` présent en sandbox.

4. **Tester** : tableau de bord admin, section « HelloAsso — Configuration », bouton « Tester la connexion ». Le résultat attendu affiche l'environnement `sandbox`, le slug et deux contrôles en « ok ». Si le message « privilège AccessTransactions manquant » apparaît, vérifiez les droits du client API dans le back-office HelloAsso.
5. **Scripts de contrôle** (à lancer depuis la racine du dépôt ; ils lisent `.env` eux-mêmes et n'affichent aucune valeur secrète) :
   - `node scripts/helloasso-sandbox-check.mjs` : refait les 4 appels de validation sur la sandbox (jeton, refresh, `formTypes`, `items?pageSize=1`) et n'affiche que les URL, les codes HTTP et la structure des réponses ;
   - `node scripts/check-helloasso-socle-db.mjs` : vérifie les accès (RLS, RPC de verrou) et les contraintes de la base avec les comptes de test. Il ne tourne que sur le projet de développement.

**Bascule sandbox ↔ production** : remplacer les identifiants, le secret, le slug et `NUXT_HELLOASSO_ENVIRONMENT` (`production` ou `sandbox`), retirer les URL facultatives si elles ont été renseignées, puis relancer « Tester la connexion ». Le jeton est rangé par environnement dans la base : aucune purge n'est nécessaire, les deux jetons coexistent.
