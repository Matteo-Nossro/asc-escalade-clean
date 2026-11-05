# Plan de test — ASC Escalade

> Tests automatisés (Vitest, Playwright, typecheck) : voir [docs/architecture.md § Tests](architecture.md#tests). Ce fichier liste les scénarios **manuels**.

> **Légende statut :** ✅ OK · ❌ KO · ⚠️ Partiel · 🐛 Bug connu · ⏭️ Non testé

> **Étape préalable à toute campagne de tests manuels : le serveur de dev tourne avec le dernier code.**
> 1. Arrêter puis relancer `npm run dev`. Une modification de `nuxt.config.ts`, d'un plugin, d'un middleware ou d'un fichier `app/utils/` n'est pas toujours rechargée à chaud.
> 2. Ouvrir le site à l'adresse réellement servie : **`https://localhost:3000`**. En dev, `devServer.https` est activé, donc pas de `http://`. Puis recharger sans le cache (Ctrl+Maj+R).
> 3. Contrôle rapide pour les tests de liens d'e-mail : dans l'onglet Réseau des outils de développement, la requête `…/auth/v1/signup` doit contenir `redirect_to=https%3A%2F%2Flocalhost%3A3000%2Fcallback%3Ftype%3Dsignup`. Sinon, le code servi n'est pas le dernier.
> 4. Pour les tests de liens d'e-mail, vérifier aussi les réglages du dashboard du dev ([docs/dev/supabase-dev.md](dev/supabase-dev.md)) : URLs de redirection et Site URL.

---

## 1. Authentification

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| A01 | Connexion email + mot de passe valide | Redirige vers `/admin/dashboard` | | |
| A02 | Connexion avec email inexistant | Message d'erreur affiché | | |
| A03 | Connexion avec mot de passe incorrect | Message d'erreur affiché | | |
| A04 | Formulaire soumis vide | Validation bloque la soumission | | |
| A05 | Bouton "afficher/masquer" mot de passe | Bascule entre `text` et `password` | | |
| A06 | Déconnexion | Session effacée, redirection vers `/login` | | |
| A07 | Accès `/admin` sans être connecté | Redirige vers `/login?redirect=...` | | |
| A08 | Accès `/admin` connecté sans rôle admin | Redirige vers `/` | | |
| A09 | Accès `/login` déjà connecté | Redirige vers `/` | | |
| A10 | Accès `/profil` sans être connecté | Redirige vers `/login` | | |
| A11 | Accès `/mes-inscriptions` sans être connecté | Redirige vers `/login` | | |
| A12 | Clic "Mot de passe oublié" sur `/login` | Formulaire email de récupération affiché | | |
| A13 | Soumettre email valide pour reset | Message de confirmation affiché, email envoyé | | |
| A14 | Soumettre email invalide pour reset | Erreur de validation affichée | | |
| A15 | Clic "Retour à la connexion" depuis forgotMode | Formulaire de connexion réaffiché | | |
| A16 | Accès `/callback?type=recovery` (lien email) | Redirige vers `/profil?resetPassword=true` | | |
| A17 | Formulaire reset sur `/profil` | Champs nouveau mot de passe et confirmation affichés | | |
| A18 | Soumettre reset avec mots de passe différents | Erreur "Les mots de passe ne correspondent pas" | | |
| A19 | Soumettre reset valide | Mot de passe mis à jour, confirmation affichée | | |

---

## 2. Navigation & Layout

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| N01 | Header desktop — logo et liens visibles | Tous les liens s'affichent | | |
| N02 | Header mobile — menu burger visible | Menu desktop masqué, burger présent | | |
| N03 | Ouverture du menu mobile | Panneau latéral s'ouvre | | |
| N04 | Fermeture du menu mobile (clic ×) | Panneau se ferme | | |
| N05 | Fermeture du menu mobile (clic lien) | Panneau se ferme et navigation s'effectue | | |
| N06 | Non connecté — bouton "Connexion" dans le header | Bouton visible | | |
| N07 | Connecté — avatar/initiales dans le header | Avatar affiché à la place du bouton connexion | | |
| N08 | Menu utilisateur connecté | Liens : Mon profil, Mes inscriptions, Déconnexion | | |
| N09 | Menu utilisateur staff | Lien supplémentaire "Administration" visible | | |
| N10 | Responsive — tableau admin sur mobile | Scroll horizontal ou mise en page adaptée | | |

---

## 3. Pages publiques (Storyblok)

| # | Page | Scénario | Résultat attendu | Statut | Notes |
|---|------|----------|-----------------|--------|-------|
| P01 | `/` | Chargement de la home | Page s'affiche sans erreur | | |
| P02 | `/club` | Chargement de la page Club | Contenu Storyblok affiché | | |
| P03 | `/tarifs` | Chargement de la page Tarifs | Contenu Storyblok affiché | | |
| P04 | `/contact` | Chargement de la page Contact | Contenu Storyblok affiché | | |
| P05 | `/sorties` | Chargement de la page Sorties | Contenu Storyblok affiché | | |
| P06 | `/actualites` | Chargement des actualités | Liste des articles affichée | | |
| P07 | `/posts/[slug]` | Accès à un article de blog | Contenu de l'article affiché | | |

---

## 4. Profil utilisateur (`/profil`)

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| PR01 | Affichage du profil | Toutes les infos pré-remplies | | |
| PR02 | Section infos club | Champs en lecture seule (licence, groupe, etc.) | | |
| PR03 | Modification prénom/nom | Valeur mise à jour dans le champ | | |
| PR04 | Modification email | Valeur mise à jour dans le champ | | |
| PR05 | Modification téléphone / mobile | Valeur mise à jour dans le champ | | |
| PR06 | Bouton "Enregistrer" désactivé sans modification | Bouton grisé si aucun changement | | |
| PR07 | Sauvegarde des modifications | Données persistées en base après rechargement | | |
| PR08 | Message de succès après sauvegarde | Alerte verte affichée | | |
| PR09 | Message d'erreur si sauvegarde échoue | Alerte rouge affichée | | |
| PR10 | Autocomplétion adresse (3+ caractères) | Suggestions de l'API BAN affichées | | |
| PR11 | Sélection d'une suggestion d'adresse | Champs adresse, CP, ville remplis automatiquement | | |
| PR12 | Mise à jour URL avatar | Photo de profil mise à jour | | |
| PR13 | *(Parent, 1 enfant)* Basculer vers le profil de l'enfant | Infos de l'enfant chargées dans le formulaire | | |
| PR14 | *(Parent, 1 enfant)* Sauvegarder les infos de l'enfant | Données de l'enfant persistées sans affecter le parent | | |
| PR15 | *(Parent, 2 enfants)* Onglets de basculement | 2 onglets enfants disponibles en plus du profil parent | | |
| PR16 | *(Parent, 2 enfants)* Basculer entre les deux enfants | Formulaire rechargé avec les infos du bon enfant | | |
| PR17 | *(Parent, 2 enfants)* Modifier les infos du 2e enfant | Données du 2e enfant persistées, 1er enfant inchangé | | |

---

## 5. Mes inscriptions (`/mes-inscriptions`)

### 5a. Groupes

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MG01 | Affichage des groupes inscrits | Liste avec nom, niveau, statut, créneaux, date | | |
| MG02 | Badge statut (confirmé / en attente) | Couleur et libellé corrects | | |
| MG03 | Quitter un groupe | Inscription supprimée, liste mise à jour | | |
| MG04 | Ouvrir le modal "Rejoindre un groupe" | Modal s'affiche avec les groupes disponibles | | |
| MG05 | Groupe plein — bouton rejoindre désactivé | Bouton grisé | | |
| MG06 | Groupe déjà rejoint — bouton désactivé | Bouton grisé | | |
| MG07 | Rejoindre un groupe disponible | Inscription créée, modal fermé, liste rafraîchie | | |
| MG08 | *(Parent, 1 enfant)* Section inscriptions enfant visible | Groupes de l'enfant listés séparément | | |
| MG09 | *(Parent, 1 enfant)* Inscrire l'enfant à un groupe | Via le modal, profil enfant sélectionnable | | |
| MG10 | *(Parent, 1 enfant)* Retirer l'enfant d'un groupe | Inscription supprimée | | |
| MG14 | *(Parent, 2 enfants)* Sections séparées par enfant | Une section dédiée par enfant dans la page | | |
| MG15 | *(Parent, 2 enfants)* Inscrire chaque enfant à un groupe différent | Inscriptions créées indépendamment pour chaque enfant | | |
| MG16 | *(Parent, 2 enfants)* Retirer un enfant d'un groupe sans affecter l'autre | Seule l'inscription ciblée est supprimée | | |
| MG17 | *(Parent, 2 enfants)* Filtrage par âge par enfant | Groupes disponibles filtrés selon la date de naissance de chaque enfant | | |
| MG11 | Rejoindre un groupe — âge incompatible | Groupe absent de la liste des disponibles | | |
| MG12 | Tous groupes filtrés par âge → aucun disponible | Message "Aucun groupe disponible pour cette tranche d'âge" affiché | | |
| MG13 | Tranche d'âge affichée sous les créneaux | Texte "Nés XXXX–XXXX" visible dans la carte du groupe | | |

### 5b. Événements

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| ME01 | Affichage des événements inscrits | Liste avec titre, date, statut, date d'inscription | | |
| ME02 | Badge statut événement | en attente / confirmé / annulé | | |
| ME03 | Annuler une inscription à un événement | Statut = annulé, liste mise à jour | | |
| ME04 | Événement annulé — bouton "annuler" masqué | Bouton absent ou désactivé | | |

---

## 6. Admin — Dashboard KPI

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| K01 | Carte "Total membres" | Affiche le nombre total de profils | | |
| K02 | Carte "Licences actives" | Affiche le nombre de membres actifs | | |
| K03 | Carte "Places disponibles" | 180 − nb membres | | |
| K04 | Carte "Demandes en attente" | Nombre de demandes `status=pending` | | |
| K05 | KPI mis à jour après approbation d'une demande | Compteur "en attente" décrémenté | | |

---

## 7. Admin — Gestion des membres

### 7a. Tableau & actions

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MB01 | Tableau des membres chargé | Colonnes : Nom, Licence, Email, Formule, Créneau, Statut, Actions | | |
| MB02 | Recherche par nom | Filtre les lignes en temps réel | | |
| MB03 | Pagination (5 par page) | Navigation entre les pages fonctionne | | |
| MB04 | Ouvrir modal "Modifier" | Formulaire pré-rempli avec données existantes | | |
| MB05 | Modifier le nom d'un membre | Valeur persistée en base après sauvegarde | | |
| MB06 | Changer le statut (actif/inactif/en attente) | Statut mis à jour | | |
| MB07 | Supprimer un membre | Confirmation demandée, membre retiré de la liste | | |
| MB08 | Export CSV | Fichier `.csv` téléchargé avec BOM UTF-8, séparateur `;`, 30 colonnes (ID, Email, Prénom, Nom, Naissance, Rôles, Groupes confirmés…) | | |
| MB09 | Ajouter un membre sans email | Profil créé en base (UUID autonome, sans compte Auth) | | |
| MB10 | Basculer le statut via le menu action | Changement persisté en base, toast affiché | | |

### 7b. Formulaire de création — validation des champs

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MB11 | Ouvrir modal création | Titre "Ajouter un adhérent", tous les champs vides | | |
| MB12 | Soumettre sans prénom | Erreur "Le prénom est requis" sous le champ | | |
| MB13 | Soumettre sans nom | Erreur "Le nom est requis" sous le champ | | |
| MB14 | Email avec format invalide (ex : "abc") | Erreur "Format d'email invalide" | | |
| MB15 | Licence invalide (lettres ou moins de 6 chiffres) | Erreur "Numéro de licence invalide (6 à 10 chiffres)" | | |
| MB16 | Renseigner une date de naissance | Âge calculé automatiquement à côté du champ | | |
| MB17 | Champs administratifs — toggle Paiement reçu | Libellé bascule "Oui" / "Non" | | |
| MB18 | Champs administratifs — toggle Formulaire d'inscription | Libellé bascule "Oui" / "Non" | | |
| MB19 | Champs administratifs — Certificat médical / Assurance FFME | Valeurs sélectionnables dans le select | | |

### 7c. Création d'un membre simple

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MB20 | Créer un membre (prénom + nom uniquement) | Profil autonome créé en base (sans compte Auth), apparaît dans le tableau | | |
| MB21 | Créer avec email | Compte Supabase Auth créé + profil inséré | | |
| MB22 | Créer avec type de licence | Formule persistée en base | | |
| MB23 | Créer avec un ou plusieurs groupes cochés | Inscription(s) au(x) groupe(s) créée(s) | | |
| MB24 | Créer avec tous les champs administratifs remplis | Toutes les valeurs persistées en base | | |

### 7d. Création d'un membre parent + enfants

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MB25 | Cocher le rôle "Parent" | Section "Enfants liés" apparaît | | |
| MB26 | Décocher le rôle "Parent" | Section "Enfants liés" disparaît | | |
| MB27 | Créer un parent sans enfant lié | Compte créé avec rôle parent, aucun `parent_access` | | |
| MB28 | Créer un parent + 1 enfant lié | `parent_access` créé en base pour cet enfant | | |
| MB29 | Créer un parent + 2 enfants liés | Deux `parent_access` créés en base | | |
| MB30 | Créer un parent + 3 enfants ou plus | Tous les `parent_access` créés | | |
| MB31 | Tenter de lier le même enfant deux fois | Bouton "Lier" désactivé / enfant absent de la liste | | |

### 7e. Modification d'un parent existant

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MB32 | Ouvrir modal édition d'un parent avec enfants | Liste des enfants déjà liés chargée | | |
| MB33 | Ajouter un enfant à un parent existant | `parent_access` créé, enfant apparaît dans la liste | | |
| MB34 | Ajouter un 2e puis un 3e enfant | Chaque lien créé indépendamment, liste mise à jour | | |
| MB35 | Retirer un enfant lié (bouton ×) | `parent_access` supprimé, enfant retiré de la liste | | |
| MB36 | Retirer tous les enfants d'un parent | Liste affiche "Aucun enfant lié" | | |

---

## 8. Admin — Gestion des groupes

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| GR01 | Affichage liste des groupes | Nom, niveau, nb membres / capacité, créneaux | | |
| GR02 | Format créneau | "Lundi 20h00 – 22h00" | | |
| GR03 | Créer un groupe | Modal vide → formulaire → sauvegarde → apparaît dans la liste | | |
| GR04 | Ajouter un créneau dans le modal groupe | Nouvelle ligne de saisir heure/jour ajoutée | | |
| GR05 | Supprimer un créneau dans le modal groupe | Ligne retirée du formulaire | | |
| GR06 | Modifier un groupe | Modal pré-rempli → modification → persistée en base | | |
| GR07 | Supprimer un groupe | Confirmation → groupe retiré de la liste | | |
| GR08 | Voir les membres d'un groupe | Modal avec la liste des membres | | |
| GR09 | Retirer un membre d'un groupe | Membre retiré de la liste dans le modal | | |
| GR10 | Créer un groupe avec tranche d'âge | Champs "De l'année" / "À l'année" remplis → sauvegarde → badge âge visible dans la liste | | |
| GR11 | Modifier un groupe — changer la tranche d'âge | Nouvelle valeur persistée en base après rechargement | | |
| GR12 | Créer un groupe sans tranche d'âge | Aucun badge âge affiché dans la liste | | |
| GR13 | Tranche d'âge affichée dans l'accordéon public | Icône gâteau + "Années de référence" visibles dans GroupsAccordion | | |

---

## 9. Admin — Demandes d'inscription en attente

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| RQ01 | Section visible uniquement si demandes présentes | Section masquée si 0 demande | | |
| RQ02 | Affichage d'une demande | Type de demande, nom cible, nom utilisateur | | |
| RQ03 | Approuver une demande | status=confirmed, notification_log créé, disparaît de la liste | | |
| RQ04 | Rejeter une demande | Modal avec champ "motif" obligatoire | | |
| RQ05 | Rejeter avec motif | status=cancelled, admin_note sauvegardée, notification créée | | |
| RQ06 | Champ note optionnel à l'approbation | Champ présent mais non bloquant | | |
| RQ07 | Horodatage `reviewed_at` | Champ rempli après approbation/rejet | | |

---

## 10. Inscriptions de l'année N-1 (`/mes-inscriptions`)

> Fonctionnalité WIP — affichage en lecture seule des créneaux confirmés de l'année précédente

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| NM01 | Membre avec inscriptions confirmées en N-1 | Section "Saison précédente" visible avec liste des groupes | ⏭️ | WIP |
| NM02 | Membre sans inscription N-1 | Section absente ou message "Aucune inscription" | ⏭️ | WIP |
| NM03 | Créneaux N-1 affichés | Nom du groupe, niveau, créneaux (jour + horaires) | ⏭️ | WIP |
| NM04 | Parent — créneaux N-1 enfant | Section N-1 visible par enfant | ⏭️ | WIP |

---

## 11. API & intégrations

| # | Endpoint | Scénario | Résultat attendu | Statut | Notes |
|---|----------|----------|-----------------|--------|-------|
| API01 | `POST /api/admin/create-member` | Création avec email + infos valides | Compte Supabase Auth créé, profil inséré | | |
| API02 | `POST /api/admin/create-member` | Avec `groupId` | Inscription au groupe créée en plus | | |
| API03 | `POST /api/revalidate` | Payload Storyblok valide + bon secret | Cache Netlify purgé, status 202 | | |
| API04 | `POST /api/revalidate` | Secret incorrect | Requête rejetée (401 ou erreur) | | |

---

## 12. Responsive design

| # | Breakpoint | Page | Résultat attendu | Statut | Notes |
|---|-----------|------|-----------------|--------|-------|
| RS01 | Mobile (375px) | `/login` | Formulaire lisible, bouton accessible | | |
| RS02 | Mobile (375px) | `/profil` | Champs en colonne, pas de débordement | | |
| RS03 | Mobile (375px) | `/mes-inscriptions` | Cartes lisibles, boutons accessibles | | |
| RS04 | Mobile (375px) | `/admin/dashboard` | Tableau scrollable horizontalement | | |
| RS05 | Tablette (768px) | `/admin/dashboard` | Mise en page correcte | | |
| RS06 | Desktop (1280px) | Toutes pages | Navigation desktop, pas de régression | | |

### 12a. Captures visuelles avant / après (`e2e/visual/captures.spec.ts`)
11 pages (accueil, actualités, un post, club, tarifs, sorties, contact, register, login, profil adhérent, dashboard admin) × 1440 et 390 px, animations neutralisées, comptes de test pour profil et admin, aucune écriture en base. Sans `CAPTURES_OUT`, le spec est ignoré.
- Capturer : `CAPTURES_OUT=<dossier> E2E_SKIP_BUILD=1 npx playwright test e2e/visual/captures.spec.ts` (après un `npm run build` à jour) ; `CAPTURES_OVERWRITE=1` pour écraser des PNG existants.
- Comparer : ajouter `CAPTURES_COMPARE=<dossier de référence>` → `<dossier>/diff/*.png` et `rapport-comparaison.json` (seuil 0.1, ≤ 0,1 % de pixels).
- Limite : le seuil est aveugle aux nuances proches (`#7FD857` → `#6bc546` passe) ; il détecte la mise en page, pas l'identité des couleurs. Le calendrier de l'accueil surligne le jour courant : comparer le même jour.
- Référence conservée : `docs/features/harmonisation-couleurs/captures/avant/` (2026-10-29), point de départ du cadrage du design ordinateur.

---

## 13. Persistance des données

| # | Action | Vérification | Statut | Notes |
|---|--------|-------------|--------|-------|
| DB01 | Modifier le profil → recharger la page | Valeurs modifiées toujours présentes | | |
| DB02 | Rejoindre un groupe → recharger la page | Groupe toujours dans la liste | | |
| DB03 | Modifier un membre admin → recharger | Modification toujours en base | | |
| DB04 | Créer un groupe → recharger | Groupe toujours présent | | |
| DB05 | Supprimer un membre → recharger | Membre absent de la liste | | |
| DB06 | Approuver une demande → recharger | Demande absente de la liste, statut confirmed | | |

---

## 14. Admin — HelloAsso (socle)

> Lot `helloasso-socle`. Déjà automatisé (Vitest), non répété ici : client et jeton (`tests/server/utils/helloasso.test.ts`), rôles des 6 routes (`helloasso-roles.test.ts`), contrat de la route de test, validation de `season`, rendu et masquage du composant (`tests/components/admin/HelloAssoConfig.test.ts`, avec `fetch` simulé), frontière « aucun appel HelloAsso hors du client ». Les scénarios ci-dessous exigent la **vraie** sandbox, le vrai rendu NuxtUI ou la base de dev.
> Prérequis : variables `NUXT_HELLOASSO_*` de la sandbox (dont `ENVIRONMENT=sandbox`), comptes de test admin / secrétaire / initiateur.

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| HA01 | Admin, `/admin/dashboard` : cliquer « Tester la connexion » (sandbox) | Chargement sur le bouton, puis « Connexion HelloAsso opérationnelle » ; 2 vérifications cochées (données publiques, transactions) ; slug de l'association de test affiché | | |
| HA02 | Lecture du badge d'environnement après HA01 | Badge jaune plein « SANDBOX (test) », bien visible et distinct d'un badge « Production » (gris, discret) ; texte et contraste lisibles | | |
| HA03 | Cliquer deux fois de suite sur « Tester la connexion » | Même résultat ; `helloasso_tokens` garde une seule ligne `sandbox` et son jeton n'est pas renouvelé au 2e clic (`updated_at` inchangé) | | Vérifier dans Supabase (dev), sans copier de valeur de jeton |
| HA04 | Retirer `NUXT_HELLOASSO_ENVIRONMENT` (ou une clé), relancer le serveur et tester | Message d'erreur clair citant le **nom** de la clé manquante, aucune valeur secrète affichée, aucun appel à HelloAsso | | Remettre la variable ensuite |
| HA05 | Client API sans le privilège `AccessTransactions` (si reproductible dans le back-office sandbox) | Bloc rouge « Droits insuffisants pour les transactions » avec « privilège AccessTransactions manquant » et l'indication de vérifier les droits du client API ; la vérification « données publiques » reste cochée | | Optionnel : cas couvert en simulation |
| HA06 | Connecté en **secrétaire**, ouvrir le dashboard | Liste des formulaires visible avec saison et état Actif / Inactif en lecture seule ; pas de « Tester la connexion », pas de « Synchroniser maintenant », pas de formulaire d'ajout, pas de switch | | Contrôle du rendu réel |
| HA07 | Connecté en **initiateur** | Le bloc « HelloAsso — Configuration » n'apparaît pas | | |
| HA08 | Admin : ajouter un formulaire (slug, libellé, type) en choisissant la saison suivante | Toast « Formulaire ajouté » ; la ligne apparaît avec « Saison AAAA-AAAA » correspondant au choix ; `season` renseignée en base ; le sélecteur revient sur la saison en cours | | |
| HA09 | Admin : activer puis désactiver un formulaire avec le switch, puis recharger | État conservé après rechargement ; le switch NuxtUI 4 (`USwitch`) est visible, réagit au clic et son état est lisible | | Point signalé par T5 : rendu à valider à l'œil |
| HA10 | Admin : « Synchroniser maintenant » (sandbox) | Synchronisation terminée sans erreur, via le client (aucun jeton visible dans les logs ni l'onglet Réseau) ; compteur d'adhérents mis à jour | | Rapprochement inchangé (refonte au lot 2) |
| HA11 | `node scripts/check-helloasso-socle-db.mjs` sur le projet de **dev** | Tableau de vérifications : 0 ÉCHEC, code de sortie 0 ; aucune clé ni mot de passe affiché ; aucune ligne de test résiduelle dans `helloasso_forms` | | À relancer à la porte de qualité et après toute modification de la migration |
| HA12 | Avant déploiement en prod : relire `helloasso_forms` après la migration | Aucune ligne sans `season` ; lignes existantes sur `2025-2026` ; doublon `(Membership, test-rls)` traité au préalable | | Blocage connu, voir `docs/features/helloasso-socle/plan.md` risque n° 1 |

---

## 15. Authentification et profils (`auth-profils`)

> Lot `auth-profils`. Déjà automatisé (Vitest), non répété ici : `/api/register` et `/api/profile/complete` (identité, non-écrasement, rôle `parent`, enfants), `create-member`, `useAuth` partagé, middleware (complétion, garde `/admin`), page `/completer-profil`, menu « Administration » avec le vrai `useAuth`. Les scénarios ci-dessous exigent un vrai navigateur, de vrais fournisseurs OAuth ou la base de dev.
> Prérequis : projet Supabase de **dev**, migration `20261029_auth_profils.sql` poussée, comptes de test admin / secrétaire. Pour OAuth : un compte Google et un compte Microsoft jamais inscrits sur le site.
> Parcours e2e rare (envoie un vrai e-mail, limité en débit) : `E2E_ALLOW_WRITES=1 E2E_SEND_EMAIL=1 E2E_SKIP_BUILD=1 npx playwright test e2e/auth-profils.spec.ts --grep "@email"`. S'il est sauté à cause de la limite d'envoi, ce n'est pas un échec.
> Base de dev : `node scripts/check-auth-profils-db.mjs` (T1b) à relancer après toute modification de la migration.

### 15a. Inscription par e-mail (`/register`)

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AP01 | Inscription adulte sans enfant (étapes 1 à 3, bouton « terminer »), e-mail jamais utilisé | Écran de succès (étape 4) sans fausse erreur ; en base : profil « En attente », `profile_completed_at` renseigné, **aucun** rôle `parent` (attribué seulement si des enfants sont déclarés, décision R1-a) | | Pas de 409 malgré la ligne créée par le trigger |
| AP02 | Inscription avec 2 enfants | 2 profils enfants « En attente » créés, liens `parent_access` ; une re-soumission ne duplique pas les enfants | | |
| AP03 | Inscription avec un e-mail déjà utilisé | Message « Cette adresse email est déjà utilisée », retour à l'étape 2, aucune écriture | | |
| AP04 | Inscription : valeurs saisies (téléphone, adresse) | Conservées en base ; une valeur vide du formulaire n'écrase pas l'enrichissement FFME existant | | |
| AP05 | Étape 3 : saisir un enfant sans l'ajouter, revenir à l'étape 2 puis retourner à l'étape 3 | La saisie de l'enfant en cours (et ses erreurs) est conservée ; les enfants déjà ajoutés aussi | | Régression corrigée pendant la feature (brouillon porté par la page, `tests/components/auth/ChildrenForm.draft.test.ts`) |
| AP06 | Après l'inscription, ouvrir `/profil` sans avoir confirmé l'e-mail | Pas de boucle de redirection ; selon la configuration Supabase : renvoi vers `/login` ou vers `/completer-profil` | | |

### 15b. Complétion OAuth (Google, Microsoft)

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AP07 | Première connexion via **Google** (compte jamais inscrit) | Retour sur `/callback`, puis redirection vers `/completer-profil` ; prénom et nom pré-remplis depuis Google si fournis | | |
| AP08 | Première connexion via **Microsoft** (compte jamais inscrit) | Idem AP07 | | |
| AP09 | `/completer-profil` : valider sans enfant | Message « en attente de validation par le bureau » ; profil « En attente », `profile_completed_at` renseigné, **aucun** rôle `parent` | | Différence voulue avec `/register` |
| AP10 | `/completer-profil` : valider avec un enfant | Rôle `parent` attribué, enfant « En attente » créé avec lien `parent_access` | | |
| AP11 | Après AP09, ouvrir `/profil` et `/mes-inscriptions` | Accès autorisé (profil complété), plus de renvoi vers la complétion | | |
| AP12 | Profil complété : ouvrir `/completer-profil` à la main | Redirection vers `/profil` | | |
| AP13 | Profil incomplet : ouvrir `/profil`, `/mes-inscriptions`, `/admin/dashboard` | Redirection vers `/completer-profil` dans les trois cas | | |
| AP14 | `/completer-profil` : lien de déconnexion | Session fermée, retour sur `/login` ou `/` | | |
| AP15 | Reconnexion OAuth d'un compte déjà complété | Pas de passage par `/completer-profil` | | |
| AP16 | Lecture du profil en échec (bloquer la requête `profiles` dans l'onglet Réseau) puis ouvrir `/profil` | Remplacé par `auth-erreur-profil` : la page n'affiche plus de contenu dépendant du profil mais un message avec « Réessayer », y compris sur `/admin` (aucune redirection) | | Voir § 17 (AE01 à AE09) ; `tests/middleware/auth.global.error-state.test.ts` |

### 15c. Validation par le bureau et création par un admin

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AP17 | Admin : dashboard, un profil « En attente » issu de AP01 ou AP09 | Le profil apparaît parmi les membres en attente ; le passer à « Actif » persiste après rechargement | | |
| AP18 | Membre validé (AP17) : se reconnecter | Accès normal à `/profil` et `/mes-inscriptions`, pas de nouveau passage par la complétion | | |
| AP19 | Admin : ajouter un membre avec e-mail, statut laissé par défaut | Profil « Actif », `profile_completed_at` renseigné ; l'invité n'est pas renvoyé vers `/completer-profil` | | Un statut choisi (Inactif / En attente) est conservé |
| AP20 | Admin : ajouter un membre dont le compte est déjà enrichi (téléphone, licence FFME), champs du formulaire vides | Téléphone et licence conservés (pas écrasés par du vide) | | |
| AP21 | Admin : créer un membre dont le profil était déjà complété | La date d'origine de `profile_completed_at` est conservée | | Corrigé pendant la feature (`tests/server/api/admin/create-member.completed-at.test.ts`) |

### 15d. Menu « Administration » et état partagé

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AP22 | Se connecter en **admin** via `/login` | Sans recharger la page, le menu utilisateur du header affiche « Administration » (desktop et mobile) | | Corrigé par `useAuth` partagé + plugin `auth-sync` |
| AP23 | Se connecter en **secrétaire**, puis en initiateur | « Administration » visible ; ouverture de `/admin/dashboard` autorisée | | |
| AP24 | Se connecter en simple adhérent | « Administration » absente ; `/admin/dashboard` renvoie vers `/` | | |
| AP25 | Se déconnecter puis se reconnecter avec un autre compte (sans recharger) | Menu et rôles du **nouveau** compte, aucune trace du précédent (profil, rôles) | | |
| AP26 | Ouvrir le dashboard admin juste après la connexion | Le bloc HelloAsso et les actions admin s'affichent sans rechargement | | |
| AP27 | Une seule lecture de `profiles` et de `user_roles` par connexion (onglet Réseau) | Pas de requêtes en double entre header, middleware et page | | |

### 15e. Retour des liens d'e-mail (R2)

> Déjà automatisé (Vitest) : `emailRedirectTo` de `signUp`, `resendSignupConfirmation` (sent / rate_limited / error), page `/callback` (lien invalide en query et en hash, confirmation sans session, `type=recovery`), middleware (`error_code` renvoyé vers `/callback`), bouton de renvoi sur `/login`, et le parcours « compte sans complétion → `/login` → `/completer-profil` ». R2b (Vitest) : validation de l'e-mail du renvoi sur `/login`, écran `callback-auth-error` pour les erreurs autres que `otp_expired`, attente de session de `/callback` (3 s maximum, redirection immédiate si déjà connecté), source unique de l'URL de retour. Les scénarios ci-dessous exigent de vrais e-mails (limités en débit : ne pas les enchaîner) et la configuration Supabase. Prérequis : `/callback` dans les URLs de redirection autorisées du projet (`docs/mise-en-prod.md` § 5).

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AP28 | Inscription (`/register`), puis premier clic sur le lien de l'e-mail de confirmation | Retour sur `/callback?type=signup` (et non sur la page d'accueil) : « Adresse e-mail confirmée », bouton « Se connecter » vers `/login`, inscription en attente de validation par le bureau | | R2-a, R2-d |
| AP29 | Cliquer une seconde fois sur le même lien | Page `/callback` avec « Ce lien n'est plus valide » (déjà utilisé, expiré ou remplacé), bouton « Se connecter », formulaire de renvoi | | R2-c ; avant R2 : retour muet sur `/?error=access_denied&error_code=otp_expired` |
| AP30 | Ouvrir à la main `/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` puis `/club/histoire?error_code=otp_expired` | Dans les deux cas, renvoi vers `/callback` avec l'écran « n'est plus valide » (aucune page blanche, aucun message muet) | | R2-e ; couvert aussi en lecture seule par `e2e/email-link.spec.ts` |
| AP31 | Sur `/callback` (lien invalide), saisir l'adresse d'un compte non confirmé et valider | Message « Si une inscription non confirmée existe pour cette adresse, un nouvel e-mail vient d'être envoyé… » ; un e-mail arrive ; son lien ramène sur « Adresse e-mail confirmée » ; l'ancien lien est invalide | | R2-b, R2-c ; même message pour une adresse inconnue (aucune fuite sur l'existence du compte) |
| AP32 | Renvoyer plusieurs fois de suite (formulaire de `/callback` ou bouton de `/login`) | À la limite d'envoi, message demandant de patienter ; pas d'écran d'erreur technique | | R2-b ; à ne tenter qu'une fois, consomme le quota d'envoi |
| AP33 | `/login` avec un compte jamais confirmé (bon mot de passe) | « Veuillez confirmer votre adresse email » + bouton « Renvoyer l'e-mail de confirmation » qui utilise l'e-mail saisi ; mêmes messages qu'AP31 | | R2-f |
| AP34 | Compte créé par `signUp` seul (sans passage par `/api/register`, profil du trigger : non complété, « En attente », aucun rôle), e-mail confirmé, connexion par `/login` sans `redirect` | Arrivée sur `/completer-profil` (et non sur `/admin/dashboard` ni `/`) | | R2-g ; couvert par `tests/pages/login.resend.test.ts` |
| AP35 | Lien de réinitialisation de mot de passe expiré ou déjà utilisé | `/callback` : « n'est plus valide » et « Se connecter », **sans** formulaire de renvoi ; `/login` propose « Mot de passe oublié » | | R2-c (`type=recovery`) |
| AP36 | Retour d'un refus Google / Microsoft (annuler sur l'écran de consentement) ou d'une erreur serveur d'authentification sur `/callback` (`?error=access_denied&error_code=bad_oauth_state`, ou `#error=server_error`) | Écran « La connexion n'a pas abouti » (`callback-auth-error`) et bouton « Se connecter » vers `/login`, **sans** formulaire de renvoi, sans redirection ; le texte technique (`error_description`) n'est jamais affiché | | R2b-3 ; seul `error_code=otp_expired` garde l'écran « n'est plus valide » (AP29) |
| AP37 | Sur `/login`, après un échec « e-mail non confirmé », vider le champ e-mail (ou y saisir `abc`) puis cliquer « Renvoyer l'e-mail de confirmation » | Aucun e-mail envoyé ; message sous le champ : « L'adresse email est requise » (champ vide) ou « Format d'email invalide » | | R2b-1 ; couvert par `tests/pages/login.resend-validation.test.ts` |
| AP38 | Cliquer sur le lien de confirmation d'inscription sur une connexion lente (session ouverte après plus de 0,5 s) | Jamais d'écran « Adresse e-mail confirmée » si la session s'ouvre : arrivée directe sur `/completer-profil` (profil incomplet) ; « Adresse e-mail confirmée » seulement si aucune session n'arrive au bout de 3 s | | R2b-4 ; à observer avec le réseau bridé dans les outils du navigateur |
| AP39 | Inscription par e-mail, puis « Renvoyer l'e-mail de confirmation » depuis `/login` ou `/callback` : comparer les liens des deux e-mails | Les deux liens ramènent sur `/callback?type=signup` (même URL de retour, définie dans `app/utils/authRedirect.ts`) | | R2b-5 ; couvert par `tests/utils/authRedirect.test.ts` ; consomme le quota d'envoi |
| AP40 | Ouvrir à la main `https://localhost:3000/?code=0b9c7e2a-4d51-4f0e-9a3b-6c1d2e3f4a5b` (UUID quelconque), puis `/profil?code=0b9c7e2a-4d51-4f0e-9a3b-6c1d2e3f4a5b&x=1#h` | Arrivée sur `/callback` (query et hash conservés) puis, en moins de 5 s, sur `/login` : aucun message d'erreur affiché, aucune page blanche | | R2c-1, R2c-2 ; couvert par `tests/middleware/auth.global.code-return.test.ts`, `tests/pages/callback.code-exchange.test.ts` et `e2e/email-link.spec.ts` |
| AP41 | Ouvrir `https://localhost:3000/?code=abc` et `/tarifs?code=abc` | Aucune redirection : le paramètre `code` n'est pas un UUID, la page reste affichée | | R2c-1 |
| AP42 | Avec la Site URL du dev volontairement laissée sur `https://localhost:3000` et `/callback**` retirée des Redirect URLs, s'inscrire puis cliquer le lien de l'e-mail | Supabase retombe sur `/?code=…` : renvoi automatique vers `/callback`, session ouverte, arrivée sur `/completer-profil` (profil incomplet) ou `/profil` ; jamais de retour muet sur l'accueil | | R2c ; consomme le quota d'envoi ; remettre ensuite la configuration de `docs/dev/supabase-dev.md` |
| AP43 | Ouvrir le lien de confirmation dans un **autre navigateur** que celui de l'inscription (vérificateur PKCE absent) | Après 3 s, « Adresse e-mail confirmée » + « Se connecter » (type=signup) ; aucune erreur technique affichée | | R2c-2 ; échange refusé silencieusement ; consomme le quota d'envoi |

### 15f. Fiabilité des enfants (`enfants-fiabilite`)

> Automatisé (Vitest) : ordre rôle `parent` après enfants, journal de compensation, 23505 vers 409, message 403 neutre, enfants selon liens `parent_access` (`/profil`, `MemberModal`). Les scénarios ci-dessous couvrent le rendu réel et les cas difficiles à provoquer.

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AP44 | Inscription avec un enfant dont la création échoue (ex. donnée refusée par la base) | Erreur affichée ; le compte n'a pas le rôle `parent` en base (`user_roles`) | | Q1 ; provoquer l'échec côté dev uniquement |
| AP45 | Inscription réussie avec 2 enfants, puis sans enfant | Avec enfants : rôle `parent` + enfants sur `/profil` ; sans enfant : aucun rôle `parent` | | Q1, comportement nominal |
| AP46 | Après un échec d'inscription (AP44), consulter les logs du serveur | Une ligne `console.error` par étape de compensation en erreur, avec le nom de l'étape ; le client reçoit la même erreur qu'avant | | Q2 |
| AP47 | Compte non confirmé (inscrit il y a plus d'une heure) refait une inscription | Message « Impossible de finaliser l'inscription. Si vous avez déjà un compte, connectez-vous ; sinon, recommencez l'inscription. » affiché tel quel sur `/register` ; HTTP 403 | | Q4 ; vérifier aussi avec une autre adresse e-mail |
| AP48 | Adhérent sans rôle `parent` mais avec lien `parent_access` : ouvrir `/profil` et sa fiche dans `MemberModal`. Puis un adhérent sans lien | Avec lien : enfants affichés dans les deux vues ; sans lien : aucune section enfants | | Q10 |

---

## 16. Sécurité BDD (`securite-bdd`)

> Passe 1 : annuaire `member_directory`, fonctions de rôle déplacées dans `private`, `search_path = ''`, droits explicites HelloAsso. Déjà automatisé, non répété ici : `node scripts/check-securite-bdd.mjs` (sections A, B, C, D et non-régression, avec les vrais comptes du dev, dont le cas Q24 en SQL), `tests/composables/useGroups.test.ts`, `tests/hooks/agent-guard.test.ts`, `e2e/securite-bdd.spec.ts` (visiteur → `/tarifs`). Les scénarios ci-dessous contrôlent le rendu réel et le ressenti par rôle.
> Prérequis : dev avec migrations A à D appliquées ; comptes de test visiteur (sans session), adhérent, secrétaire, admin ; onglet Réseau ouvert (aucune erreur `permission denied for schema private`, `42501` ni 5xx).

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| SB01 | **Visiteur** (sans session) : `/tarifs` (accordéon des groupes) | Noms du référent et des moniteurs affichés ; aucune photo ; la requête `member_directory` est en GET, 200, et ne renvoie que `id` et `full_name` | | Annuaire ; avant la passe, `avatar_url` et tous les profils étaient lisibles |
| SB02 | **Visiteur** : depuis la console, requête REST avec la clé publique sur `member_directory` en `PATCH`, `DELETE`, `POST`, puis `GET ?select=avatar_url` | Chaque écriture est refusée, `profiles` inchangé ; la lecture de `avatar_url` renvoie une erreur de colonne inconnue | | Couvert par le script ; à refaire à la main une fois |
| SB03 | **Adhérent** : `/mes-inscriptions`, ouvrir « Rejoindre un groupe » | Référent et moniteurs affichés comme pour le visiteur ; aucun autre adhérent n'est lisible dans `profiles` (soi et famille seulement) | | |
| SB04 | **Staff** (secrétaire puis admin) : `/admin/dashboard`, section des groupes | Référent et moniteurs affichés ; tableau des membres, rôles et demandes chargés sans erreur | | Les policies appellent `private.has_role` / `private.is_admin_or_secretary` |
| SB05 | Connexion par `/login` avec admin, secrétaire, initiateur, adhérent | Redirections et menu inchangés (A01, A08, N09) : « Administration » visible pour staff seulement ; aucune erreur dans la console ni le Réseau | | Fonctions de rôle déplacées dans `private` |
| SB06 | Inscription par `/register` (avec 1 enfant, puis sans) | Compte et profil créés (« En attente »), enfant créé et lié ; aucune erreur serveur ; confirmation par e-mail comme AP01 / AP45 | | Triggers `handle_new_user` et `enrich_profile_from_temps_user` ; consomme le quota d'envoi |
| SB07 | Adhérent connecté, console : appeler `rpc/has_role` et `rpc/is_admin_or_secretary` ; idem sans session | Refus dans les deux cas (fonctions introuvables dans l'API) | | Couvert par le script ; contrôle manuel optionnel |
| SB08 | **Secrétaire** : passer un profil « En attente » à « Actif » (AP17), recharger | Statut persisté, aucune erreur ; l'adhérent concerné accède ensuite à `/profil` (AP18). Le même PATCH de statut sur un tiers depuis la console d'un **adhérent** est refusé | | Trigger `profiles_block_status_change` |
| SB09 | **Secrétaire** : approuver une demande d'inscription (RQ03), en rejeter une avec motif (RQ05) | `confirmed` / `cancelled`, `admin_note` et `reviewed_at` renseignés, notification créée. Adhérent : peut annuler sa propre inscription (ME03) mais pas la passer à `confirmed` ni écrire `admin_note` (console) | | Trigger `registrations_block_user_status_change` (migration C) |
| SB10 | **Admin** : « Tester la connexion » (HA01) deux fois, puis « Synchroniser maintenant » (HA10) | Connexion opérationnelle ; une seule ligne `sandbox` dans `helloasso_tokens`, jeton non renouvelé au 2e clic (HA03) ; synchronisation sans erreur ; aucun `42501` dans les logs du serveur | | Migration D : `service_role` garde SELECT / INSERT / UPDATE, plus DELETE |
| SB11 | Historique des synchronisations (`helloasso_sync_runs`) : lire la table depuis la session secrétaire, puis admin, puis adhérent (console, clé publique) | Secrétaire et admin lisent les lignes ; adhérent et visiteur : 0 ligne ; écriture refusée à tous les rôles clients | | Aucun écran d'historique dans l'interface à ce jour ; le serveur n'écrit pas encore cette table (lot `helloasso-sync`) : scénario à compléter alors |
| SB12 | `node scripts/check-securite-bdd.mjs` puis `node scripts/check-helloasso-socle-db.mjs` sur le dev | 0 ÉCHEC pour les deux ; le second (81 OK) nettoie `helloasso_tokens` et `helloasso_sync_runs` par `pg` (`SUPABASE_DEV_DB_URL`) : aucune ligne `t1b-check-` ni `+secu-` résiduelle | | À relancer à la porte de qualité |

---

## 17. Échec de lecture du profil (`auth-erreur-profil`)

> Q25 et Q26. Déjà automatisé (Vitest), non répété ici : réessai unique du middleware (2 lectures de `profiles` pour une navigation en échec persistant), absence de redirection, porte `AuthPageGate` (message, « Réessayer », « Se déconnecter »), branchement dans `app.vue`, `/admin/**` en `ssr: false` et `sitemap: false` (`tests/utils/nuxtConfig.routeRules.test.ts`), coquille de `/admin` sans donnée, retrait de `loading` / `error` de `useAuth`. Les scénarios ci-dessous exigent un vrai navigateur.
> Prérequis : projet de dev, compte adhérent (avec profil complété), compte admin. Pour provoquer l'échec : outils de développement, onglet Réseau, **bloquer l'URL de requête** contenant `/rest/v1/profiles` (clic droit sur la requête, « Bloquer l'URL de la requête »), puis recharger la page. Pour rétablir : retirer le blocage. Servir le code à jour (voir l'étape préalable en tête de fichier : `nuxt.config.ts` a changé).

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| AE01 | Adhérent connecté, lecture du profil bloquée, ouvrir `/profil` (rechargement complet) | Bloc d'erreur « Impossible de charger votre profil » avec boutons « Réessayer » et « Se déconnecter » ; aucune donnée du profil visible ; l'URL reste `/profil` ; exactement 2 requêtes `profiles` dans le Réseau (lecture + 1 réessai) | | Q25 ; l'en-tête reste affiché |
| AE02 | Admin connecté, lecture du profil bloquée, ouvrir `/admin/dashboard` (rechargement complet) | Même bloc d'erreur à la place du tableau de bord ; aucun KPI, aucune liste de membres, même brièvement ; aucune requête `/api/admin/*` ; aucune redirection vers `/` ni `/login` ; l'URL reste `/admin/dashboard` | | Q25 ; `/admin/**` en `ssr: false` : pas de coquille rendue côté serveur |
| AE03 | Sur le bloc d'erreur (AE01), cliquer « Réessayer » alors que le blocage est toujours actif | Bouton désactivé le temps de la lecture, une seule requête `profiles` de plus ; le message reste affiché ; pas de redirection | | Q25 |
| AE04 | Sur le bloc d'erreur (AE01), retirer le blocage du Réseau puis cliquer « Réessayer » | La page `/profil` s'affiche avec les données, **sans rechargement** et sur la même URL ; le bloc disparaît ; en-tête avec les initiales | | Q25 |
| AE05 | « Réessayer » réussi dans deux cas : (a) adhérent sur `/admin/dashboard`, (b) compte au profil incomplet sur `/profil` | (a) une seule redirection vers `/` ; (b) une seule redirection vers `/completer-profil` ; jamais vers `/login` | | Q25, redirections normales après chargement |
| AE06 | Sur le bloc d'erreur, blocage toujours actif, cliquer « Se déconnecter » | Session fermée, retour sur `/login` ; le lien fonctionne sans l'en-tête ni la lecture du profil ; reconnexion possible ensuite | | Q25, seule issue garantie si le réessai échoue en boucle |
| AE07 | Échec ponctuel : bloquer la requête `profiles`, puis la débloquer avant d'ouvrir `/profil` par la navigation interne (menu) | Navigation normale, aucun message d'erreur ; si la première lecture échoue et la seconde réussit, la page s'affiche sans bloc | | Q25 ; difficile à provoquer exactement : un blocage « une seule fois » (extension ou réseau instable) |
| AE08 | Lecture du profil bloquée : ouvrir `/`, `/tarifs`, `/club`, `/login` | Pages publiques affichées normalement, sans bloc d'erreur ; `/login` utilisable | | Q25, pages publiques hors porte |
| AE09 | Sur `/login`, saisir un mauvais mot de passe, puis connexion réussie avec le bon | Message d'erreur de connexion habituel ; **aucun** bloc « Impossible de charger votre profil » : un échec de connexion n'est pas un échec de lecture du profil | | Q26 |

---

## Résumé

| Catégorie | Total | ✅ OK | ❌ KO | ⚠️ Partiel | 🐛 Bug connu | ⏭️ Non testé |
|-----------|-------|-------|-------|-----------|-------------|-------------|
| Authentification | 19 | | | | | |
| Navigation | 10 | | | | | |
| Pages publiques | 7 | | | | | |
| Profil | 17 | | | | | |
| Mes inscriptions | 20 | | | | | |
| Admin KPI | 5 | | | | | |
| Admin Membres | 36 | | | | | |
| Admin Groupes | 13 | | | | | |
| Admin Demandes | 7 | | | | | |
| Inscriptions N-1 | 4 | | | | | 4 |
| API | 4 | | | | | |
| Responsive | 6 | | | | | |
| Persistance | 6 | | | | | |
| Admin HelloAsso (socle) | 12 | | | | | |
| Authentification et profils (auth-profils) | 43 | | | | | |
| Fiabilité des enfants (enfants-fiabilite) | 5 | | | | | |
| Sécurité BDD (securite-bdd) | 12 | | | | | |
| Échec de lecture du profil (auth-erreur-profil) | 9 | | | | | |
| **Total** | **235** | | | | | **4** |

---

> **Bugs résolus**
> - ✅ **BUG #1** (résolu) — `create-member.post.ts` accepte désormais la création sans email : profil autonome (UUID indépendant, sans compte Auth) si email absent, Auth + profil si email fourni.
> - ✅ **BUG #2** (résolu) — `toggleStatus()` persistait déjà en base (code corrigé avant la rédaction de ce plan).
