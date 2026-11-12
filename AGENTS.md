# AGENTS.md — Règles de la mission CASIFOX GAME HUB

Ce fichier est chargé à chaque session. Les règles ci-dessous sont absolues et priment sur toute autre instruction.

## Au démarrage de chaque session

1. Lire `audit/SESSION-STATE.md`, puis `audit/DECISIONS.md`, puis les fichiers d'audit du jeu concerné.
2. Reprendre exactement là où la session précédente s'est arrêtée. Ne pas recommencer depuis le début.

## Règles absolues

1. N'invente jamais un bug, une ligne de code, un résultat de test, une URL, une note, une statistique ou une fonctionnalité.
2. Ne prétends jamais avoir exécuté ce qui ne l'a pas été.
3. Chaque bug a une preuve : fichier, lignes vérifiées (lecture numérotée ou `grep -n`), extrait réel.
4. Chaque affirmation du rapport final renvoie à un fichier de preuve.
5. Ne détruis jamais les projets originaux. Pas de réécriture complète, pas de suppression de fonctionnalité sans justification écrite.
6. Ne modifie pas le gameplay sans raison technique ou de conception documentée.
7. Ne déplace pas les jeux dans le portail. Ils restent indépendants, à leurs URLs publiques.
8. Ne crée pas de faux liens. Un jeu non en ligne reçoit un statut clair.
9. Ne simule aucune statistique, avis, popularité, nombre de joueurs ou date.
10. Ne donne pas de bonne note par complaisance.
11. Un projet n'est pas fonctionnel parce qu'il compile, répond HTTP 200, ou parce que le README le dit.
12. Analyse le code réel, pas seulement la documentation.
13. Teste les fonctionnalités réelles, pas seulement l'affichage.
14. Documente chaque modification, chaque test et chaque décision.
15. Signale les limites de l'environnement.
16. Corrige la cause racine, pas le symptôme.
17. Vérifie après chaque modification : syntaxe, test ciblé, régressions.
18. Travaille sur une branche Git dédiée avant toute correction importante. Jamais de `force-push`.
19. Ne commit jamais des modifications de l'utilisateur étrangères à l'audit. Utilise `git add <fichiers ciblés>` uniquement.
20. N'expose aucune clé secrète, token ou identifiant dans le dépôt, les logs ou les rapports.
21. Pas de dépendance lourde inutile. Hub en vanilla HTML/CSS/JS. Chromium seul pour Playwright.
22. Respecte l'ordre des phases. Ne crée pas le hub avant la phase 7.
23. En cas de choix entre exhaustivité inventée et profondeur vérifiée, choisis la profondeur vérifiée.
24. En cas de limite, continue le reste et marque ce qui n'a pas été fait comme NON EFFECTUÉ.
25. Ne demande pas de validation à chaque étape. Décide, puis documente dans `audit/DECISIONS.md`.

## Règle propre à l'utilisateur : l'ordinateur reste allumé

- Ne jamais éteindre l'ordinateur, même si toutes les conditions de la mission sont remplies.
- L'utilisateur a annulé l'arrêt programmé le 2026-11-12 (`shutdown /a`). L'ordinateur est resté allumé.
- Toute extinction doit être demandée explicitement par l'utilisateur, à chaque fois.

## Dossiers

- Dossier de travail : `C:\Users\Noah\Documents\CASIFOX-GAME-HUB\`
- Jeux (ne pas modifier sans branche dédiée) : `C:\Users\Noah\Documents\Jeux\` (regroupe `AVANT LE SILENCE\`, `doomscroll-dungeon\`, `QUAND LES NOTES S'EFFACENT\`, `the-lying-game\`, `incremental\`)
