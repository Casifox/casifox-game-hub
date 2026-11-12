# SCORES — notation avant / après

Date : 2026-11-12. Grille : Gameplay 25, Originalité 15, Technique 20, Design/UX 15, Rejouabilité 15, Performance 10 = 100.

Méthode : chaque note s'appuie sur les faits vérifiés (audits, builds, tests, captures). Les critères qualitatifs (gameplay, originalité, rejouabilité) restent des jugements argumentés, pas des mesures. Les éléments non vérifiés sont signalés et ne gonflent pas la note. Les notes « avant » sont figées avant correction ; les notes « après » suivent les tests publics du 12/11.

## Classement global (après)

| Rang | Jeu | Note /100 | Delta |
|---|---|---:|---:|
| 1 | Doomscroll Dungeon | **82** | +4 |
| 2 | The Lying Game | **81** | +2 |
| 3 | Neon Jackpot | **80** | +6 |
| 4 | Quand les notes s'effacent | **75** | +2 |
| 5 | AVANT LE SILENCE | **72** | +1 |

Classement technique (critère Technique, /20) : 1. Doomscroll Dungeon (17), 2. The Lying Game (17), 3. Neon Jackpot (17), 4. Quand les notes s'effacent (16), 5. AVANT LE SILENCE (15). Départage : couverture de tests et chaîne de déploiement.

Classement « plaisir de jeu » (critère Gameplay, /25) : 1. Doomscroll Dungeon (20), 2. The Lying Game (19), 3. Neon Jackpot (18), 4. Quand les notes s'effacent (16), 5. AVANT LE SILENCE (14).

---

## Doomscroll Dungeon — `doomscroll-dungeon`

### Avant : 78/100
- Gameplay : 20/25 — boucle d'action lisible (aimer, commenter, partager, esquiver), 30 s de partie réelles sans erreur, texte qui progresse.
- Originalité : 13/15 — satire du doomscroll transformée en donjon, identité forte.
- Technique : 14/20 — build TypeScript propre, 35/35 tests, mais graine relue sans contrôle et 6 alertes dans les outils de développement.
- Design/UX : 13/15 — 6 cartes affichées, tutoriel clair, tactile, 4 tailles d'écran sans débordement.
- Rejouabilité : 11/15 — graines, étages, scores ; non mesurée sur plusieurs parties.
- Performance : 7/10 — bundle 156 Ko, 6 requêtes, 535 Ko ; FPS headless non représentatif.
- Points forts : tests réels, boucle courte, identité visuelle, tactile.
- Points faibles : XSS de graine (mineure), dépendances de dev vulnérables.
- Vérifié : build, 35 tests, parcours public complet, version servie = build local.
- Non vérifié : partie complète, fin de partie, FPS sur appareil réel.
- SHA baseline : `88ef6cc10ef6befd0edeb8efd7bb56a64a2db859`.

### Après : 82/100
- Gameplay : 20/25 — inchangé.
- Originalité : 13/15 — inchangé.
- Technique : 17/20 — graine assainie au chargement (`1b2d05b`), T-DOOM-01 réussi ; les 6 alertes de dev restent.
- Design/UX : 13/15 — inchangé.
- Rejouabilité : 12/15 — +1 pour la graine fiabilisée (partage de graines sans injection).
- Performance : 7/10 — inchangé.
- Delta : **+4** (technique +3, rejouabilité +1).
- SHA après : `1b2d05b0d4cc35048cadb20b687d32e38c228d08`, déployé.

---

## The Lying Game — `the-lying-game`

### Avant : 79/100
- Gameplay : 19/25 — aventure puzzle en 5 chapitres, prologue et déplacement réels, dialogues.
- Originalité : 14/15 — le jeu ment au joueur, concept fort.
- Technique : 16/20 — typecheck, 24/24 tests, build reproductible ; minuteur permanent et sauvegarde effacée avant écriture.
- Design/UX : 14/15 — écran titre, HUD, pause, tactile, 4 tailles d'écran sans débordement.
- Rejouabilité : 10/15 — narratif, 5 chapitres ; rejouabilité non mesurée.
- Performance : 6/10 — bundle 1,44 Mo (398 Ko gzip), 10 requêtes, 3,13 Mo.
- Points forts : tests, direction artistique, concept, déploiement par workflow.
- Points faibles : minuteur actif en paysage, sauvegarde fragile, poids.
- Vérifié : typecheck, 24 tests, build, parcours public complet.
- Non vérifié : fins, chapitres 2 à 5 en jeu, effet réel des touches sur le personnage.
- SHA baseline : `be0aae551335b284ef70c2b07d0844f85058a455`.

### Après : 81/100
- Gameplay : 19/25 — inchangé.
- Originalité : 14/15 — inchangé.
- Technique : 17/20 — deux bugs corrigés (`1ac3495`), T-LYING-01/02 réussis.
- Design/UX : 14/15 — inchangé.
- Rejouabilité : 10/15 — inchangé.
- Performance : 7/10 — minuteur de cadrage limité au portrait, plus d'appel `matchMedia` en paysage.
- Delta : **+2** (technique +1, performance +1).
- SHA après : `1ac34956cf1665fc978a4a76b92e2c789a928f40`, déployé par workflow.

---

## Neon Jackpot — `incremental`

### Avant : 74/100
- Gameplay : 18/25 — 11 jeux, boucle incrémentale dense, Plinko joué réellement (compteur 0 → 8).
- Originalité : 12/15 — casino néon virtuel, univers cohérent mais genre très fréquenté.
- Technique : 13/20 — volume élevé, aucune suite de tests, XSS d'import critique, sauvegarde corrompue écrasée, `__proto__`.
- Design/UX : 12/15 — interface riche, 4 tailles d'écran sans débordement ; surcharge visuelle possible.
- Rejouabilité : 13/15 — 11 jeux, prestige, quêtes, succès.
- Performance : 6/10 — 56 requêtes, 1,64 Mo, plus de 90 rendus `innerHTML`.
- Points forts : contenu, progression, identité, version publiée = HEAD.
- Points faibles : sécurité, sauvegarde, absence de tests.
- Vérifié : parcours public, sauvegarde, 4 viewports ; tests ciblés après correction.
- Non vérifié : équilibrage long terme, FPS sur appareil réel.
- SHA baseline : `17614ca5dae7715b1ccef4ff0f6e12bfe3f2e93e`.

### Après : 80/100
- Gameplay : 18/25 — inchangé.
- Originalité : 12/15 — inchangé.
- Technique : 17/20 — validation de sauvegarde, copie de secours, échappement, `__proto__` corrigés (`154a5b1`) ; T-INCR-01/02/03 réussis ; toujours sans suite de tests.
- Design/UX : 13/15 — +1 : import de sauvegarde plus sûr et messages d'erreur clairs.
- Rejouabilité : 14/15 — +1 : une sauvegarde corrompue n'est plus perdue.
- Performance : 6/10 — inchangé.
- Delta : **+6** (technique +4, design +1, rejouabilité +1).
- SHA après : `154a5b1faf9e2d703d8594853fe44e1fdcb9229e`, déployé.

---

## Quand les notes s'effacent — `quand-les-notes-seffacent`

### Avant : 73/100
- Gameplay : 16/25 — roman musical en 7 jours, piano, dialogues ; avancement réel mais lent sur 30 s.
- Originalité : 14/15 — musique et récit imbriqués, identité singulière.
- Technique : 14/20 — code natif propre, sauvegarde validée ; version, README et tests ajoutés après l'audit.
- Design/UX : 13/15 — menu, dialogues, piano, 4 tailles d'écran sans débordement.
- Rejouabilité : 10/15 — narratif, 3 emplacements, fins multiples.
- Performance : 6/10 — 81 requêtes, 1,05 Mo, FPS headless faible.
- Points forts : direction artistique, musique, validation de contenu (1 669 vérifications).
- Points faibles : interactions piano non testées, poids, FPS à confirmer.
- Vérifié : `npm test` 1 669 vérifications, parcours public complet.
- Non vérifié : piano, journées 2 à 7, fins.
- SHA baseline : `5d7947befb702659b90d490e89bdad92bb78aa96`.

### Après : 75/100
- Gameplay : 16/25 — inchangé.
- Originalité : 14/15 — inchangé.
- Technique : 16/20 — +2 : version 1.0.0, README, suite de validation et dépôt Git (état publié).
- Design/UX : 13/15 — inchangé.
- Rejouabilité : 10/15 — inchangé.
- Performance : 6/10 — inchangé.
- Delta : **+2** (technique +2).
- SHA après : `5d7947befb702659b90d490e89bdad92bb78aa96` (le projet avait déjà changé avant la publication), déployé.

---

## AVANT LE SILENCE — `avant-le-silence`

### Avant : 71/100
- Gameplay : 14/25 — expérience narrative documentaire, 4 chapitres, progression par actions ; pas de boucle d'action.
- Originalité : 14/15 — sujet historique rare, traitement documentaire.
- Technique : 14/20 — JS propre, validation de contenu Python, sauvegarde validée ; pas de tests JS, sauvegarde illisible écrasée.
- Design/UX : 13/15 — lisible, accessible, 4 tailles d'écran sans débordement ; pas de pause.
- Rejouabilité : 8/15 — narration linéaire, relecture documentaire.
- Performance : 8/10 — 98 requêtes, 867 Ko, pas de boucle de jeu.
- Points forts : contenu, accessibilité, légèreté, sources.
- Points faibles : sauvegarde fragile, pas de tests JS, pas de version 1.0.
- Vérifié : validation de contenu, parcours public complet.
- Non vérifié : chapitres 2 à 4, lecteurs d'écran.
- SHA baseline : `1ac53ba2315c695c9484e21ff0ff2d9eabaf22b4`.

### Après : 72/100
- Gameplay : 14/25 — inchangé.
- Originalité : 14/15 — inchangé.
- Technique : 15/20 — +1 : copie de secours d'une sauvegarde illisible (`84bdec4`), T-AVANT-01 réussi.
- Design/UX : 13/15 — inchangé.
- Rejouabilité : 8/15 — inchangé.
- Performance : 8/10 — inchangé.
- Delta : **+1** (technique +1).
- SHA après : `84bdec42551e8b91e2a3efef2270086ceca02940`, déployé.

---

## Synthèse

- Les corrections ont surtout fait progresser la **technique** (sécurité, sauvegarde) et, pour Neon Jackpot, la **confiance dans la sauvegarde**.
- Les notes de **gameplay** n'ont pas bougé : aucun gameplay n'a été modifié, conformément à la règle 6.
- Les notes de **performance** restent prudentes : les mesures FPS sont faites en Chromium headless, non représentatives d'un appareil réel.
- Classement final : Doomscroll Dungeon 82, The Lying Game 81, Neon Jackpot 80, Quand les notes s'effacent 75, AVANT LE SILENCE 72.
