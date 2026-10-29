---
name: blok
description: Crée un blok Storyblok complet — composant depuis template.vue, enregistrement dans app/plugins/storyblok.ts, vérification asc-rules, entrée dans docs/storyblok.md, champs à créer à la main dans Storyblok. Utilisable par l'utilisateur (/blok) et par le sous-agent storyblok-dev.
argument-hint: <technical-name-avec-tirets> [description / champs souhaités]
allowed-tools: Bash(node .claude/skills/blok/scripts/register-blok.mjs *) Bash(node .claude/skills/asc-rules/scripts/check.mjs *)
---

Blok demandé : $ARGUMENTS

## Qui exécute ?
- **Session principale (orchestrateur)** : si l'usage ou les champs ne sont pas clairs, pose **une** question groupée. Lance ensuite `storyblok-dev` avec « Applique la skill `blok` : <nom> — <description, champs> », puis `graphify update .` une fois qu'il a terminé. Réponds en 10 lignes max : fichiers, puis **tableau des champs à créer dans Storyblok**. Propose `/asc-review` si le composant dépasse ~80 lignes.
- **storyblok-dev** : suis la procédure ci-dessous.

## Procédure (storyblok-dev)
1. **Nom** : technical name en minuscules et tirets, préfixé par sa section (`tarifs-…`, `club-…`, `bloc-…`). Le script refuse underscores et majuscules.
2. **Composant** : copie [template.vue](template.vue) vers `app/storyblok/<section>/<NomPascal>.vue`, puis adapte les champs. Pour un bloc du kit `bloc-*`, pars plutôt d'un bloc voisin de `app/storyblok/blocs/` (`_SectionShell` avec `fond`, `anchor_id`, `surtitre`, `titre`). Un sous-composant interne s'appelle `_Nom.vue` et ne s'enregistre pas.
3. **Enregistrement** (idempotent) :
   `node .claude/skills/blok/scripts/register-blok.mjs <technical-name> app/storyblok/<section>/<NomPascal>.vue`
4. **Vérification** : `node .claude/skills/asc-rules/scripts/check.mjs app/storyblok/<section>/<NomPascal>.vue`. Corrige jusqu'à ce que la commande ne renvoie plus rien, avertissements de couleur compris, sauf s'ils sont justifiés.
5. **Doc** : ajoute une ligne dans la section adaptée de `docs/storyblok.md` (« Kit de blocs réutilisables » ou « Bloks par page »), au format `` | `technical-name` | `dossier/Fichier.vue` | rôle | ``.
6. **Champs Storyblok** : complète la section « Côté Storyblok » de `docs/features/<slug>/spec.md`. Sans feature, mets ce tableau dans ton compte rendu :
   | Technical name | Type (nestable / content type) | Champs (nom : type Storyblok) | Notes |
7. Ne lance pas `graphify update` : c'est l'orchestrateur ou le doc-writer qui s'en charge.
