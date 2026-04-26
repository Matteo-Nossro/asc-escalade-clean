# Fonctionnalités du site ASC Escalade

## 1. Pages publiques (contenu Storyblok)

| Page | Route | Description |
|---|---|---|
| Accueil | `/` | Hero, actualités récentes, prochains événements, CTA adhésion |
| Club | `/club` | Histoire, équipe, statistiques, galerie, timeline, partenaires, initiateurs |
| Tarifs | `/tarifs` | Grille tarifaire, planning des créneaux, groupes en accordéon, bon à savoir |
| Sorties | `/sorties` | Présentation du concept, liste des sorties disponibles |
| Actualités | `/actualites` | Liste des articles de blog |
| Article | `/posts/[slug]` | Détail d'un article |
| Contact | `/contact` | Formulaire de contact + informations du club |

### Blocs UI réutilisables (Storyblok)
- Accordéons, boutons, CTA, carrousel (Embla), galerie, texte+image, tabs, before/after slider

---

## 2. Authentification

| Fonctionnalité | Détail |
|---|---|
| Connexion | Email/mot de passe + OAuth Google + OAuth Microsoft |
| Récupération mot de passe | Envoi d'un lien de réinitialisation par email |
| Inscription | Formulaire multi-étapes (adulte ou parent avec enfants) |
| Callback OAuth | Gestion des redirections Google/Microsoft |
| Middleware global | Protège `/admin/*`, `/profil`, `/mes-inscriptions` |
| Middleware guest | Empêche un utilisateur connecté d'accéder à `/login` et `/register` |

### Flux d'inscription (5 étapes)
1. Type de compte (adulte / parent)
2. Informations personnelles (nom, prénom, date de naissance, téléphone)
3. Adresse avec autocomplétion (API Base Adresse Nationale)
4. *(Parents)* Ajout des profils enfants
5. Confirmation

---

## 3. Espace utilisateur connecté

### Profil (`/profil`)
- Modifier ses informations personnelles (nom, email, téléphone, adresse)
- Photo de profil (URL)
- Changer son mot de passe
- Consulter ses informations club (numéro de licence, groupe, passeport)
- Ajouter / modifier les profils enfants (parents)
- Basculer entre son profil et celui d'un enfant

### Mes inscriptions (`/mes-inscriptions`)
- Voir ses adhésions aux groupes et leur statut (confirmé / en attente)
- Voir ses inscriptions aux événements
- Se désinscrire d'un groupe ou d'un événement
- Gérer les inscriptions de toute la famille (enfants inclus)

---

## 4. Gestion famille & enfants

- Un parent peut avoir plusieurs profils enfants
- Niveaux d'accès parent → enfant : `full` (gestion complète), `register` (inscription uniquement), `read` (lecture seule)
- Ajout d'enfants à l'inscription ou depuis le profil
- Les enfants n'ont pas de compte Auth (pas d'email requis)
- Adresse indépendante ou héritée de celle du parent

---

## 5. Groupes & événements

### Groupes (séances d'escalade)
- Consulter les groupes disponibles (niveau, horaire, capacité, prix, encadrants)
- S'inscrire dans un groupe → demande en attente → validation admin
- Se désinscrire d'un groupe
- Un parent peut inscrire ses enfants dans un groupe

### Événements / sorties
- Consulter les événements à venir (date, lieu, difficulté, nb max, prix)
- S'inscrire à un événement
- Annuler une inscription
- Un parent peut inscrire ses enfants

### Workflow de validation (admin)
1. L'utilisateur initie une demande d'inscription
2. La demande apparaît dans la liste "En attente" du tableau de bord admin
3. L'admin examine via une modale (détails utilisateur/groupe, note, prévisualisation email)
4. L'admin approuve ou rejette → email automatique envoyé via Resend
5. La demande est marquée confirmée ou rejetée avec la date de traitement

---

## 6. Tableau de bord admin (`/admin/dashboard`)

> Accessible aux rôles : `admin`, `secretary`, `initiateur`

### KPIs
- Nombre total de membres
- Demandes en attente
- Membres confirmés dans des groupes
- Groupes actifs

### Gestion des membres
- Recherche par nom/email
- Filtres par rôle, statut d'inscription, statut du membre
- Pagination
- Export CSV de tous les membres
- Créer un membre (avec ou sans compte email)
- Modifier : infos personnelles, licence, rôles, groupe, liens enfants
- Activer / désactiver un membre
- Supprimer un membre

### Gestion des groupes
- Liste des groupes (nom, niveau, capacité, horaires, membres, encadrants, référent)
- Créer / modifier un groupe (nom, niveau, capacité, prix, tranches d'âge, horaires, encadrants, référent)
- Voir et gérer les membres d'un groupe (statut, retrait)
- Supprimer un groupe
- Vue en lecture seule pour les initiateurs

### Gestion des demandes en attente
- Liste des demandes groupes & événements
- Modale de revue avec approbation/rejet + note admin + email prévisualisé

---

## 7. API serveur

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/register` | POST | Création de compte (profil + rôle + enfants) |
| `/api/contact` | POST | Envoi du formulaire de contact (rate limiting 3 req/h/IP, honeypot) |
| `/api/admin/members` | GET | Liste des membres (param `exportAll=true` pour CSV) |
| `/api/admin/create-member` | POST | Création d'un membre admin + envoi lien reset mot de passe |
| `/api/admin/send-email` | POST | Envoi email notification approbation/rejet (Resend) |
| `/api/revalidate` | POST | Webhook Storyblok → invalide le cache ISR Netlify |

---

## 8. Intégrations externes

| Service | Usage |
|---|---|
| **Storyblok** | CMS headless pour tout le contenu public |
| **Supabase** | Base de données PostgreSQL + authentification |
| **Resend** | Emails transactionnels (contact, notifications, reset) |
| **Umami** | Analytics sans cookie |
| **API Base Adresse Nationale** | Autocomplétion d'adresse (inscription & profil) |
| **Google / Microsoft OAuth** | Connexion sociale |

---

## 9. Sécurité & performances

- **CSP** — headers Content-Security-Policy (autorise l'iframe Storyblok pour l'édition live)
- **HSTS** — HTTPS forcé
- **Rate limiting** — formulaire de contact (3 req/h/IP)
- **Honeypot** — champ caché anti-bot sur le formulaire de contact
- **RLS Supabase** — Row-Level Security sur les données sensibles
- **SSR** — rendu serveur pour le SEO
- **ISR** — pages statiques régénérées à la demande (webhook Storyblok)
- **Images optimisées** — Storyblok CDN + `@nuxt/image`
- **GSAP** — animations d'entrée sur les composants publics

---

## 10. Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `parent` | Espace membre, inscriptions, gestion enfants |
| `initiateur` | Tableau de bord admin en lecture seule |
| `secretary` | Tableau de bord admin complet (membres, groupes, demandes) |
| `admin` | Accès total |
