---
name: resume
description: Reprend une feature en cours à partir de docs/features/<slug>/status.md et plan.md, sans relire le reste.
argument-hint: <slug>
disable-model-invocation: true
---

Feature à reprendre : `$ARGUMENTS`

1. Lis **uniquement** `docs/features/$ARGUMENTS/status.md` et `docs/features/$ARGUMENTS/plan.md` (pour un cadrage sans plan : seulement les titres de section d'`options.md`). Si le dossier n'existe pas, liste les dossiers de `docs/features/` (hors `_TEMPLATE`) et demande lequel reprendre.
2. Résume l'état à l'utilisateur en 5 lignes max : phase, tâches faites, tâche suivante, blocages.
3. S'il n'y a pas de `plan.md` mais qu'`options.md` existe, c'est un cadrage en cours. Sans section « Décision », reprends `/cadrage` à l'étape 4 (discussion). Avec une décision mais sans `spec.md`, reprends à l'étape 5. Si `spec.md` existe, dis de lancer `/feature <slug>`.
4. Si `plan.md` n'est pas validé, montre le plan et attends la validation. Sinon, reprends le cycle du skill `/feature` à partir de la phase indiquée (étapes 4 à 6 : implémentation, qa, reviewer, doc-writer), avec les mêmes règles de délégation.
5. Tâche ⛔ : montre le blocage et demande comment trancher avant de relancer l'agent.
