# PUBLICATION — Phase 8 (partielle : 3 jeux publiés)

Date : 2026-11-12, 10:04 (+01:00). Compte GitHub : `Casifox` (authentifié, droit `repo`). Aucun envoi forcé.

## 1. Résultat

| Jeu | Dépôt public | URL vérifiée | Pages | Build | Commit publié | Statut |
|---|---|---|---|---|---|---|
| AVANT LE SILENCE | https://github.com/Casifox/avant-le-silence | **https://casifox.github.io/avant-le-silence/** | `built`, branche `main`, racine | legacy | `1ac53ba2315c695c9484e21ff0ff2d9eabaf22b4` | **EN LIGNE** |
| Quand les notes s'effacent | https://github.com/Casifox/quand-les-notes-seffacent | **https://casifox.github.io/quand-les-notes-seffacent/** | `built`, branche `main`, racine | legacy | `5d7947befb702659b90d490e89bdad92bb78aa96` | **EN LIGNE** |
| The Lying Game | https://github.com/Casifox/the-lying-game | **https://casifox.github.io/the-lying-game/** | workflow `pages.yml`, artefact `docs` | GitHub Actions | `78c1964457e5c4fc476e60cd8ef64ced9d0f92fa` | **EN LIGNE** |

- The Lying Game : workflow « Verify and deploy GitHub Pages » exécuté le 2026-11-12 à 09:00:01 UTC (run `43187567531`), **succès**, durée 39 s. Chaque push sur `main` reconstruit et redéploie.
- AVANT LE SILENCE et Quand les notes s'effacent : publication depuis la branche `main`, dossier racine (`/`), fichier `.nojekyll` présent.
- Les trois URLs répondaient **HTTP 200** après le build (longueurs : 2 769, 25 367 et 18 488 octets au premier contrôle).
- La page d'accueil de chaque dépôt pointe vers son URL (`gh repo edit --homepage`).

## 2. Préparation effectuée avant le premier commit

- **AVANT LE SILENCE** : dépôt Git initialisé (`main`), identité `Casifox <235862355+Casifox@users.noreply.github.com>`, commit initial « Baseline: import initial pour publication GitHub Pages (audit 2026-11-12) » (84 fichiers). Les deux URLs placeholder du README (`<utilisateur>`) ont été remplacées par l'URL réelle.
- **Quand les notes s'effacent** : dépôt Git initialisé (`main`), même identité, même message de commit initial (49 fichiers). Un `README.md` a été ajouté (description, lancement local, contrôles réels, sauvegarde, structure, publication) et un `.nojekyll` créé. Aucun autre fichier modifié.
- **The Lying Game** : dépôt existant (deux commits), aucun remote. Les deux URLs placeholder du README (`votre-utilisateur`) ont été remplacées par l'URL réelle, puis le tout a été poussé.

## 3. Tests sur les URLs publiques

Exécution Playwright/Chromium 158 en headless, 2026-11-12 (matin). Détail complet : `TEST-REPORT-avant-le-silence.md`, `TEST-REPORT-quand-les-notes-seffacent.md`, `TEST-REPORT-the-lying-game.md` ; preuves : `audit/screenshots/<slug>/`.

| Contrôle | AVANT LE SILENCE | Quand les notes s'effacent | The Lying Game |
|---|---|---|---|
| Chargement, 5 s | TEST RÉUSSI | TEST RÉUSSI | TEST RÉUSSI |
| Erreurs JS / HTTP ≥ 400 / échecs réseau | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Démarrage d'une partie | TEST RÉUSSI | TEST RÉUSSI | TEST RÉUSSI (prologue franchi) |
| Partie de 30 s | TEST RÉUSSI, 0 erreur | TEST RÉUSSI, 0 erreur | TEST RÉUSSI, 0 erreur |
| Pause / menu | TEST NON EFFECTUÉ (aucun bouton de menu) | TEST RÉUSSI | TEST RÉUSSI |
| Sauvegarde après rechargement | TEST RÉUSSI | TEST RÉUSSI | TEST RÉUSSI |
| Fichier servi = HEAD (SHA256) | TEST RÉUSSI | TEST RÉUSSI | TEST RÉUSSI |
| Affichage 1920 / 1366 / 768 / 390 px | 4/4 sans débordement | 4/4 sans débordement | 4/4 sans débordement |

Métriques publiques (indicatives, headless) :

| Jeu | Requêtes | Poids | DOMContentLoaded / load | FPS moy. / min. |
|---|---|---|---|---|
| AVANT LE SILENCE | 98 | 866 782 o | 194 / 194 ms | 60,6 / 60 |
| Quand les notes s'effacent | 81 | 1 048 280 o | 3 480 / 3 636 ms | 11,1 / 10 |
| The Lying Game | 10 | 3 126 210 o | 3 198 / 3 235 ms | 14 / 12 |

## 4. Changement du projet Quand les notes s'effacent pendant l'audit

Le projet a été modifié après la phase 2. Dates relevées : `LICENSE`, `robots.txt`, `.gitignore` (2026-11-12 00:15), `tests/validate.mjs` (00:17), `assets/art/social-card.png` (09:28), `index.html` (09:39), `package.json` (09:47). État actuel : version **1.0.0**, `README.md`, `LICENSE`, `package.json`, suite de validation `tests/validate.mjs`.

Les tests de publication ont été exécutés sur cet état actuel :
- `npm test` → **OK, 1 669 vérifications réussies**.
- Parcours navigateur public → TEST RÉUSSI.
- Le rapport technique de phase 2 décrit l'état antérieur ; une note a été ajoutée en tête du fichier.

## 5. Ce que la publication ne corrige pas

Les bugs de l'audit restent ouverts (voir `BUGS.md`) :
- **AVANT LE SILENCE** : BUG-avant-le-silence-001 (MAJEURE), une sauvegarde illisible est remplacée sans copie de secours. Le site est publié en l'état.
- **The Lying Game** : BUG-the-lying-game-001 (minuteur de cadrage portrait) et BUG-the-lying-game-002 (sauvegarde effacée avant écriture de la nouvelle).
- **Quand les notes s'effacent** : aucun bug confirmé dans les parties lues.
- Aucun test de sécurité n'a été fait sur ces trois sites au-delà des parcours fonctionnels.

## 6. Ce qui reste (phases 7, 9, 10)

- Corriger les bugs ouverts (phase 5), puis re-tester et redéployer.
- Créer le hub CASIFOX GAME HUB (phase 7) avec les cinq jeux et leurs URLs réelles.
- Tester le hub en local puis en public (phase 9).
- Rédiger le rapport final et la notation (phases 6 et 10).
- L'ordinateur n'est pas éteint : la mission n'est pas terminée.
