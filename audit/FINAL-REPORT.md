# FINAL-REPORT — CASIFOX GAME HUB

Date : 2026-11-12. Mission : audit, tests réels, corrections, notation et portail des cinq jeux.

## 1. Résumé exécutif

Les cinq jeux ont été inventoriés, audités, construits et testés. **Les cinq sont publiés sur GitHub Pages et testés sur leur URL publique.** Sept anomalies ont été confirmées à l'exécution ; **les sept ont été corrigées**, poussées après tests et re-vérifiées en ligne. Le portail CASIFOX GAME HUB a été créé à partir des données réelles, **testé en local et sur son URL publique, puis publié**.

- 5 jeux en ligne, 0 lien mort.
- 7 bugs trouvés, 7 corrigés, 0 régression détectée sur les parcours rejoués.
- 2 suites de tests de jeux conservées et vertes : Doomscroll 35/35, The Lying Game 24/24. Quand les notes : 1 669 vérifications. AVANT : validation de contenu Python.
- 0 erreur JavaScript, 0 requête en échec et 0 débordement horizontal sur les parcours publics et les quatre tailles d'écran testées.

## 2. Tableau par jeu

| Jeu | URL | Statut | Bugs trouvés | Bugs corrigés | Note avant | Note après | Delta |
|---|---|---|---:|---:|---:|---:|---:|
| Doomscroll Dungeon | https://casifox.github.io/doomscroll-dungeon/ | EN LIGNE | 1 | 1 | 78 | **82** | +4 |
| The Lying Game | https://casifox.github.io/the-lying-game/ | EN LIGNE | 2 | 2 | 79 | **81** | +2 |
| Neon Jackpot | https://casifox.github.io/neon-jackpot/ | EN LIGNE | 3 | 3 | 74 | **80** | +6 |
| Quand les notes s'effacent | https://casifox.github.io/quand-les-notes-seffacent/ | EN LIGNE | 0 | 0 | 73 | **75** | +2 |
| AVANT LE SILENCE | https://casifox.github.io/avant-le-silence/ | EN LIGNE | 1 | 1 | 71 | **72** | +1 |
| CASIFOX GAME HUB | https://casifox.github.io/casifox-game-hub/ | EN LIGNE | 0 | 0 | — | — | — |

Détail des notes : `audit/SCORES.md`. Preuves des bugs : `audit/BUGS.md`. Corrections : `audit/CHANGELOG.md`.

## 3. Classement final

| Rang | Jeu | Note |
|---|---|---:|
| 1 | Doomscroll Dungeon | 82 |
| 2 | The Lying Game | 81 |
| 3 | Neon Jackpot | 80 |
| 4 | Quand les notes s'effacent | 75 |
| 5 | AVANT LE SILENCE | 72 |

Classement technique : Doomscroll 17/20, The Lying Game 17/20, Neon Jackpot 17/20, Quand les notes 16/20, AVANT 15/20.
Classement « plaisir de jeu » : Doomscroll 20/25, The Lying Game 19/25, Neon Jackpot 18/25, Quand les notes 16/25, AVANT 14/25.

## 4. Problèmes récurrents

- **Sauvegardes** : trois jeux remplaçaient ou perdaient une sauvegarde illisible sans copie de secours (Neon, AVANT) ou effaçaient l'ancienne avant d'écrire la nouvelle (Lying). La politique commune proposée est dans `IMPROVEMENTS.md` (IDEA-global-001).
- **Contenu rendu en HTML sans contrôle** : Neon (import de sauvegarde, XSS critique) et Doomscroll (graine). Corrigés par validation et échappement.
- **Minuteurs et écouteurs** : un minuteur de cadrage permanent dans The Lying Game. Les autres écouteurs vérifiés étaient correctement retirés.
- **Absence de tests** : Neon Jackpot n'a aucune suite de tests ; AVANT n'a pas de tests JavaScript. Les autres en ont.

## 5. Améliorations réalisées

- Validation du schéma de sauvegarde et échappement des champs affichés (Neon).
- Copie de secours horodatée avant remplacement d'une sauvegarde illisible (Neon, AVANT).
- `deepMerge` sans `__proto__` / `constructor` / `prototype` (Neon).
- Minuteur de cadrage portrait limité au portrait (Lying).
- Nouvelle partie sans effacement préalable de l'ancienne sauvegarde (Lying).
- Graine assainie au chargement (Doomscroll).
- Publication et tests des trois jeux qui n'étaient pas en ligne.
- Hub statique complet : accueil, cinq fiches, recherche, filtres, tris, classement, 404, responsive, mouvement réduit.

## 6. Métriques publiques (indicatives)

Chromium 158 headless, rendu logiciel. Les FPS ne représentent pas un appareil réel.

| Jeu | Requêtes | Poids | DOMContentLoaded / load | FPS moy. / min. |
|---|---|---:|---|---|
| Doomscroll Dungeon | 6 | 535 Ko | 0,52 s / 0,52 s | 6,6 / 5 |
| The Lying Game | 10 | 3,13 Mo | 3,20 s / 3,24 s | 14 / 12 |
| Neon Jackpot | 56 | 1,64 Mo | 0,98 s / 1,14 s | 5,8 / 4 |
| Quand les notes s'effacent | 81 | 1,05 Mo | 3,48 s / 3,64 s | 11,1 / 10 |
| AVANT LE SILENCE | 98 | 867 Ko | 0,19 s / 0,19 s | 60,6 / 60 |

Aucune erreur JavaScript, aucune réponse HTTP ≥ 400, aucune requête en échec sur les parcours publics.

## 7. Risques restants et éléments non vérifiés

- **Doomscroll** : 6 alertes npm dans les devDependencies (`vitest`, `vite`, `esbuild`, `tinypool`, `@vitest/mocker`), aucune dans le bundle livré. Correction majeure non appliquée.
- **Neon Jackpot** : aucune suite de tests ; import par fichier non automatisé (chemin équivalent testé via `localStorage`) ; pause non testée ; interface dense.
- **The Lying Game** : bundle de 1,44 Mo ; effet réel des touches de déplacement non mesuré ; fins non testées.
- **Quand les notes** : piano non testé automatiquement ; journées 2 à 7 non parcourues en entier ; FPS à confirmer.
- **AVANT LE SILENCE** : pas de tests JavaScript ; pas de pause ; version 0.8.0 ; chapitres 2 à 4 non parcourus en entier ; relecture historique hors périmètre.
- **Tous** : FPS et mémoire mesurés en headless ; pas de test sur appareil réel ni de test lecteur d'écran complet.
- **Hub** : publié et testé (21/21 tests publics, 404 personnalisée vérifiée). Limites : headless, pas de test lecteur d'écran complet.

## 8. Publication

| Élément | URL | Statut |
|---|---|---|
| Doomscroll Dungeon | https://casifox.github.io/doomscroll-dungeon/ | EN LIGNE, version servie = HEAD |
| The Lying Game | https://casifox.github.io/the-lying-game/ | EN LIGNE, workflow Pages |
| Neon Jackpot | https://casifox.github.io/neon-jackpot/ | EN LIGNE, version servie = HEAD |
| Quand les notes s'effacent | https://casifox.github.io/quand-les-notes-seffacent/ | EN LIGNE |
| AVANT LE SILENCE | https://casifox.github.io/avant-le-silence/ | EN LIGNE |
| CASIFOX GAME HUB | https://casifox.github.io/casifox-game-hub/ | EN LIGNE, 21/21 tests publics, 404 vérifiée |

Détail : `audit/PUBLICATION.md`.

## 9. Prochaines étapes recommandées

1. **P0** : surveiller les cinq URLs et le hub après chaque mise à jour ; conserver les tests ciblés.
2. **P1** : ajouter une suite de tests à Neon Jackpot (état, import, `deepMerge`) ; mettre à jour les devDependencies de Doomscroll ; tester le piano de Quand les notes et les fins de The Lying Game.
3. **P1** : politique commune de sauvegarde (IDEA-global-001).
4. **P2** : réduire le bundle de The Lying Game ; mesurer les performances sur appareil réel ; compléter l'audit du moteur de Quand les notes et des chapitres d'AVANT LE SILENCE.
5. **Contenu** : faire relire AVANT LE SILENCE par un historien et vérifier les droits des archives (hors périmètre technique, signalé dans le CHANGELOG du jeu).

## 10. Limites de la mission

- Modèle d'exécution `claude-haiku-5-5` (DECISIONS.md D-008), PowerShell 5.1, Chromium headless seulement.
- Lectures partielles de gros modules, listées dans chaque audit technique.
- Les notes qualitatives (gameplay, originalité, rejouabilité) sont des jugements argumentés, pas des mesures.
- Les sous-agents de la phase 3 ont été interrompus par la limite d'usage ; les tests ont été refaits directement (D-021).
- Aucune correction de gameplay n'a été faite.

## 11. Index des preuves

- Environnement : `audit/ENVIRONMENT.md`.
- Inventaire : `audit/INVENTORY.md`.
- Audits : `audit/TECHNICAL-AUDIT-<slug>.md` (5).
- Bugs : `audit/BUGS.md`, `audit/screenshots/<slug>/logs/targeted-*.json`.
- Tests des jeux : `audit/TEST-REPORT-<slug>.md` (5), `audit/screenshots/<slug>/`.
- Corrections : `audit/CHANGELOG.md`.
- Notes : `audit/SCORES.md`.
- Publication : `audit/PUBLICATION.md`.
- Hub : `audit/HUB-TEST-REPORT.md`, `audit/screenshots/hub/`.
- Décisions : `audit/DECISIONS.md` ; état : `audit/SESSION-STATE.md`.
- Améliorations : `audit/IMPROVEMENTS.md`.
