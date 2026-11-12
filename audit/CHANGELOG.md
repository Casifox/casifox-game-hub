# CHANGELOG — corrections de l'audit

Date : 2026-11-12. Chaque correction a été faite sur une branche `audit/2026-11-12-<slug>`, testée, puis fusionnée en avance rapide dans `main` et poussée. Aucun envoi forcé. Aucun changement de gameplay.

## Neon Jackpot (`incremental`)

- Branche : `audit/2026-11-12-incremental` → commit `154a5b1faf9e2d703d8594853fe44e1fdcb9229e`.
- Fichiers : `src/js/state.js`, `src/js/pages.js`, `src/js/utils.js`.
- Corrections :
  - **BUG-incremental-002 (CRITIQUE)** : `State.sanitize()` contrôle les champs d'une sauvegarde (nombres finis, listes bornées, icônes et textes tronqués) ; `State.load` et `State.import` l'appliquent ; `pages.js` échappe `journal[].icon`, `buffs[].icon` et `buffs[].value` avec `h()`.
  - **BUG-incremental-001 (MAJEURE)** : `backupCorrupted()` copie la valeur brute sous `neon_jackpot_save_v1.backup.<horodatage>` avant de repartir d'une partie neuve.
  - **BUG-incremental-003 (MINEURE)** : `U.deepMerge` ignore les clés `__proto__`, `constructor` et `prototype`.
- Vérifications : syntaxe 3/3 ; T-INCR-01, T-INCR-02, T-INCR-03 **TEST RÉUSSI** en local puis sur https://casifox.github.io/neon-jackpot/ ; parcours complet public (chargement, Plinko, 30 s, sauvegarde, 4 viewports) **TEST RÉUSSI**.
- Déploiement : Pages `legacy` (branche `main`), vérifié par SHA256 de `state.js` (servi = HEAD).

## AVANT LE SILENCE (`avant-le-silence`)

- Branche : `audit/2026-11-12-avant-le-silence` → commit `84bdec42551e8b91e2a3efef2270086ceca02940`.
- Fichier : `js/storage/save-manager.js`.
- Correction : **BUG-avant-le-silence-001 (MAJEURE)** — `read()` conserve la valeur brute sous `avant-le-silence.save.v1.backup.<horodatage>` lorsqu'elle est illisible, avant de renvoyer `null`.
- Vérifications : syntaxe OK ; T-AVANT-01 **TEST RÉUSSI** en local puis sur https://casifox.github.io/avant-le-silence/ ; parcours complet public **TEST RÉUSSI** (pause non applicable).
- Déploiement : Pages `legacy`, vérifié par SHA256 de `index.html` (servi = HEAD).

## The Lying Game (`the-lying-game`)

- Branche : `audit/2026-11-12-the-lying-game` → commit `1ac34956cf1665fc978a4a76b92e2c789a928f40`.
- Fichiers : `src/core/GameApp.ts`, `docs/` (build régénéré).
- Corrections :
  - **BUG-the-lying-game-001 (MINEURE)** : `matchMedia('(max-width: 600px) and (orientation: portrait)')` est mis en cache et écouté via `change` ; le minuteur de 40 ms ne l'interroge plus à chaque tick et sort immédiatement hors portrait.
  - **BUG-the-lying-game-002 (MINEURE)** : `beginNewGame()` ne supprime plus l'ancienne sauvegarde avant d'écrire la nouvelle. En cas d'échec d'écriture, l'ancienne reste intacte.
- Vérifications : `npm run check` (typecheck, 24/24 tests, build) **succès** ; T-LYING-01 et T-LYING-02 **TEST RÉUSSI** en local puis sur https://casifox.github.io/the-lying-game/ ; parcours complet public **TEST RÉUSSI**.
- Déploiement : workflow `pages.yml`, run `43189801435` **succès** (43 s) ; SHA256 de `docs/index.html` servi = HEAD.

## Doomscroll Dungeon (`doomscroll-dungeon`)

- Branche : `audit/2026-11-12-doomscroll-dungeon` → commit `1b2d05b0d4cc35048cadb20b687d32e38c228d08`.
- Fichier : `src/storage/save.ts`.
- Correction : **BUG-doomscroll-dungeon-001 (MINEURE)** — `validateRun` applique `sanitizeSeed(obj.seed)` et refuse une graine qui devient vide. Une graine chargée ne contient plus que `A–Z`, `0–9`, `_` et `-`.
- Vérifications : `npm test` **35/35** ; `npm run build` **succès** ; T-DOOM-01 **TEST RÉUSSI** sur https://casifox.github.io/doomscroll-dungeon/ ; parcours complet public **TEST RÉUSSI**, avec asset servi `index-D7lIcBne.js` identique au build local.
- Déploiement : workflow `deploy.yml`, run `43189876482` **succès** (31 s).

## Non corrigé (documenté)

- **IDEA-doomscroll-dungeon-002** : 6 vulnérabilités dans les devDependencies (`vitest` 2, `vite` 6, `esbuild`, `tinypool`, `@vitest/mocker`). Aucune n'est présente dans le bundle livré (`dist/assets/*.js` : 0 occurrence). La correction proposée par npm est un changement majeur de `vitest` (`npm audit fix --force`) ; elle n'a pas été appliquée sans validation. Reste une recommandation.
- **IDEA-incremental-003 / IDEA-avant-le-silence-003 / IDEA-quand-les-notes-seffacent-002** : suites de tests unitaires supplémentaires. Non réalisées ; les tests d'interface et les suites existantes (35, 24, 1 669 vérifications) couvrent les parcours vérifiés.
- **IDEA-the-lying-game-003 / IDEA-incremental-004 / IDEA-doomscroll-dungeon-003** : optimisations de poids et de rendu. Non réalisées ; les mesures headless ne permettent pas de conclure à un gain réel.
