---
name: asc-review
description: Lance le sous-agent reviewer (check.mjs + relecture manuelle) sur le diff courant, ou sur une feature si un slug est donné.
argument-hint: "[slug]"
disable-model-invocation: true
---

Argument : `$ARGUMENTS`

- Si un slug est fourni et que `docs/features/<slug>/` existe : lance `reviewer` avec « Relis le diff de la feature <slug> (spec.md + plan.md), écris docs/features/<slug>/review.md ».
- Sinon : lance `reviewer` avec « Pas de feature : relis le diff courant (git status + git diff), écris docs/features/_review-courante.md ».

Ne lis pas le diff toi-même. Rends à l'utilisateur le compte rendu du reviewer tel quel, puis propose de corriger les bloquants. Un bloquant de moins de 20 lignes dans un seul fichier, tu le corriges toi-même ; sinon, tu le délègues à l'agent du domaine concerné.
