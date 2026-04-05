# Plan de test — ASC Escalade

> **Légende statut :** ✅ OK · ❌ KO · ⚠️ Partiel · 🐛 Bug connu · ⏭️ Non testé

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
| PR13 | *(Parent)* Basculer vers le profil d'un enfant | Infos de l'enfant chargées dans le formulaire | | |
| PR14 | *(Parent)* Sauvegarder les infos d'un enfant | Données de l'enfant persistées | | |

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
| MG08 | *(Parent)* Section inscriptions enfants visible | Groupes des enfants listés séparément | | |
| MG09 | *(Parent)* Inscrire un enfant à un groupe | Via le modal, profil enfant sélectionnable | | |
| MG10 | *(Parent)* Retirer un enfant d'un groupe | Inscription supprimée | | |

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

| # | Scénario | Résultat attendu | Statut | Notes |
|---|----------|-----------------|--------|-------|
| MB01 | Tableau des membres chargé | Colonnes : Nom, Licence, Email, Formule, Créneau, Statut, Actions | | |
| MB02 | Recherche par nom | Filtre les lignes en temps réel | | |
| MB03 | Pagination (5 par page) | Navigation entre les pages fonctionne | | |
| MB04 | Ouvrir modal "Modifier" | Formulaire pré-rempli avec données existantes | | |
| MB05 | Modifier le nom d'un membre | Valeur persistée en base après sauvegarde | | |
| MB06 | Changer le statut (actif/inactif/en attente) | Statut mis à jour | | |
| MB07 | Supprimer un membre | Confirmation demandée, membre retiré de la liste | | |
| MB08 | Export CSV | Fichier téléchargé avec toutes les colonnes attendues | | |
| MB09 | 🐛 Ajouter un membre (Bug connu) | Le membre n'est pas créé en base (bug documenté) | 🐛 | BUG #1 |
| MB10 | 🐛 Basculer le statut via le menu action | Changement non persisté en base (bug documenté) | 🐛 | BUG #2 |

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

## 10. API & intégrations

| # | Endpoint | Scénario | Résultat attendu | Statut | Notes |
|---|----------|----------|-----------------|--------|-------|
| API01 | `POST /api/admin/create-member` | Création avec email + infos valides | Compte Supabase Auth créé, profil inséré | | |
| API02 | `POST /api/admin/create-member` | Avec `groupId` | Inscription au groupe créée en plus | | |
| API03 | `POST /api/revalidate` | Payload Storyblok valide + bon secret | Cache Netlify purgé, status 202 | | |
| API04 | `POST /api/revalidate` | Secret incorrect | Requête rejetée (401 ou erreur) | | |

---

## 11. Responsive design

| # | Breakpoint | Page | Résultat attendu | Statut | Notes |
|---|-----------|------|-----------------|--------|-------|
| RS01 | Mobile (375px) | `/login` | Formulaire lisible, bouton accessible | | |
| RS02 | Mobile (375px) | `/profil` | Champs en colonne, pas de débordement | | |
| RS03 | Mobile (375px) | `/mes-inscriptions` | Cartes lisibles, boutons accessibles | | |
| RS04 | Mobile (375px) | `/admin/dashboard` | Tableau scrollable horizontalement | | |
| RS05 | Tablette (768px) | `/admin/dashboard` | Mise en page correcte | | |
| RS06 | Desktop (1280px) | Toutes pages | Navigation desktop, pas de régression | | |

---

## 12. Persistance des données

| # | Action | Vérification | Statut | Notes |
|---|--------|-------------|--------|-------|
| DB01 | Modifier le profil → recharger la page | Valeurs modifiées toujours présentes | | |
| DB02 | Rejoindre un groupe → recharger la page | Groupe toujours dans la liste | | |
| DB03 | Modifier un membre admin → recharger | Modification toujours en base | | |
| DB04 | Créer un groupe → recharger | Groupe toujours présent | | |
| DB05 | Supprimer un membre → recharger | Membre absent de la liste | | |
| DB06 | Approuver une demande → recharger | Demande absente de la liste, statut confirmed | | |

---

## Résumé

| Catégorie | Total | ✅ OK | ❌ KO | ⚠️ Partiel | 🐛 Bug connu | ⏭️ Non testé |
|-----------|-------|-------|-------|-----------|-------------|-------------|
| Authentification | 11 | | | | | |
| Navigation | 10 | | | | | |
| Pages publiques | 7 | | | | | |
| Profil | 14 | | | | | |
| Mes inscriptions | 14 | | | | | |
| Admin KPI | 5 | | | | | |
| Admin Membres | 10 | | | | 2 | |
| Admin Groupes | 9 | | | | | |
| Admin Demandes | 7 | | | | | |
| API | 4 | | | | | |
| Responsive | 6 | | | | | |
| Persistance | 6 | | | | | |
| **Total** | **103** | | | | **2** | |

---

> **Bugs documentés**
> - 🐛 **BUG #1** (`MB09`) — `saveMember()` ne crée pas de membre en mode "ajout" (condition `editMode` bloque l'INSERT)
> - 🐛 **BUG #2** (`MB10`) — `toggleStatus()` ne persiste pas en base (mise à jour locale uniquement)
