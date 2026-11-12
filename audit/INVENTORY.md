# INVENTORY — Phase 1

Date : 2026-11-12, session 1. Périmètre : `C:\Users\Noah\Documents\`.
Exclusions appliquées : `node_modules/`, `.git/`, `dist/`, `build/`, `vendor/`, caches.

> **Mise à jour du 2026-11-12 (publication)** : les trois jeux non publiés ont été publiés sur GitHub Pages (voir `PUBLICATION.md`). Le projet Quand les notes s'effacent a été modifié après cet inventaire (version 1.0.0, README, `tests/validate.mjs`, `package.json`, `LICENSE`) ; ses comptages ci-dessous reflètent l'état du 12/11 à 00:10, pas l'état publié (49 fichiers).

## Méthode (commandes réellement exécutées)

- Dossiers : `Get-ChildItem -Directory` sur `Documents\`, puis listing récursif de chaque candidat (`Get-ChildItem -Recurse -File`, exclusions ci-dessus).
- Git : `git remote -v`, `git status --short --branch`, `git log -3 --format=...` sur chaque dépôt local.
- GitHub : `gh repo list Casifox --limit 100 --json ...`, `gh repo view <dépôt> --json ...`, `gh api repos/Casifox/<dépôt>/pages`.
- HTTP : `Invoke-WebRequest` (GET) uniquement sur les URLs renvoyées par l'API GitHub (`homepageUrl` et Pages `html_url`).
- Lecture : `read` (numéros de ligne), `grep` (avec numéros de ligne).

## 1. Tableau récapitulatif

| Slug | Nom affiché (balise `<title>`) | Dossier local | Dépôt GitHub | État Git local | URL publique | Statut de publication | Version | Technologie |
|---|---|---|---|---|---|---|---|---|
| avant-le-silence | AVANT LE SILENCE | `C:\Users\Noah\Documents\AVANT LE SILENCE` | `Casifox/avant-le-silence` (PUBLIC) | Branche `main`, HEAD `1ac53ba` | **https://casifox.github.io/avant-le-silence/** | **PUBLIÉ** (2026-11-12) | 0.8.0 (CHANGELOG) | HTML/CSS/JS natif |
| doomscroll-dungeon | Doomscroll Dungeon — Le fil qui vous dévore | `C:\Users\Noah\Documents\doomscroll-dungeon` | `Casifox/doomscroll-dungeon` (PUBLIC) | Branche `main`, propre, HEAD `88ef6cc` | https://casifox.github.io/doomscroll-dungeon/ (HTTP 200, Pages `built`) | **PUBLIÉ** | 1.0.0 (package.json) | TypeScript, Vite 6, Vitest 2 |
| quand-les-notes-seffacent | Quand les notes s'effacent — Une histoire en sept jours | `C:\Users\Noah\Documents\QUAND LES NOTES S'EFFACENT` | `Casifox/quand-les-notes-seffacent` (PUBLIC) | Branche `main`, HEAD `5d7947b` | **https://casifox.github.io/quand-les-notes-seffacent/** | **PUBLIÉ** (2026-11-12) | **1.0.0** (`package.json`, ajouté le 12/11) | HTML/CSS/JS natif |
| the-lying-game | The Lying Game — Le jeu ment. Et vous ? | `C:\Users\Noah\Documents\the-lying-game` | `Casifox/the-lying-game` (PUBLIC) | Branche `main`, HEAD `78c1964` | **https://casifox.github.io/the-lying-game/** | **PUBLIÉ** (2026-11-12, workflow Pages) | 1.0.0 (package.json) | TypeScript, Phaser 3.90, Vite 7, Vitest 5 |
| incremental | Neon Jackpot — Casino incrémental | `C:\Users\Noah\Documents\incremental` | `Casifox/neon-jackpot` (PUBLIC) | Branche `main`, propre, HEAD `17614ca` | https://casifox.github.io/neon-jackpot/ (HTTP 200, Pages `building` au contrôle) | **PUBLIÉ** (à re-vérifier en phase 3) | 1.5.1 (package.json) | HTML/CSS/JS natif, données JSON |

**Correspondance dossier ↔ dépôt** : le dossier local `incremental` correspond au dépôt GitHub `Casifox/neon-jackpot`. Preuve : `git -C incremental remote -v` → `origin https://github.com/Casifox/neon-jackpot.git`. Le nom affiché est « Neon Jackpot ». Le slug `incremental` est conservé (nom de dossier fourni par l'utilisateur).

## 2. Dossiers et dépôts écartés (avec justification)

| Élément | Constat vérifié | Décision |
|---|---|---|
| `Documents\Site itnerenet\Buxy de la gare` | Site web d'un restaurant (`index.html`, `menu.html`, `mentions-legales.html`, `sitemap.xml`). Dépôt GitHub associé : `Casifox/buxy-cafe-de-la-gare`. | Écarté : ce n'est pas un jeu. |
| `Documents\WebToon` | 2 fichiers PDF (`Chapitre 001.pdf`, `chapitre_002_cinq-inconnus.pdf`). | Écarté : pas un jeu. |
| `Documents\My Games` | Sous-dossiers `Rocket League` (caches, `WebCache`) et `Replays`. Données d'un jeu commercial. | Écarté : pas un projet. |
| `Documents\League of Legends` | Dossier vide (aucun fichier listé). | Écarté. |
| `Documents\WindowsPowerShell` | Contient uniquement le sous-dossier `Scripts`. Dossier système PowerShell. | Écarté : hors projet. |
| `Documents\CASIFOX-GAME-HUB` | Dossier du hub. Vide au démarrage de la mission. | Non compté comme jeu. Réutilisé (voir DECISIONS.md D-006). |
| Dépôts GitHub `Casifox/orbis-tech`, `axion-conseil`, `am-afritalent`, `sportonic`, `bpjeps-alternance`, `save-calculateur-de-prix`, `cd2000-l-ve` (privé), `Aya-Handball-Association-Sportive-Gabon` (privé) | Aucun dossier correspondant dans `Documents\`. Non listés par l'utilisateur. | Hors périmètre local. Non analysés, aucune affirmation faite sur leur contenu. |

## 3. Fiches détaillées

### 3.1 AVANT LE SILENCE (`avant-le-silence`)

- **Nom exact affiché** : « AVANT LE SILENCE — Une maison. Des vies. Une mémoire. » (`index.html`, ligne 6).
- **Description** (`index.html`, ligne 7) : expérience narrative documentaire consacrée à la Maison d'Izieu et aux enfants juifs qui y trouvèrent refuge en 1943–1944.
- **Dossier** : `C:\Users\Noah\Documents\AVANT LE SILENCE\`.
- **Git** : pas de dépôt (`Test-Path .git` → `False`). Aucun historique.
- **Technologies** : HTML, CSS, JavaScript natif. Pas de `package.json`, pas de build, pas de framework.
- **Fichiers (hors .git)** : 84. Par extension : `.js` 28, `.svg` 17, `.md` 14, `.json` 8, `.css` 8, `.html` 6, `.py` 1, `.nojekyll` 1, sans extension 1.
- **Structure** (listing réel) : `js/core/` (4 fichiers : application, event-manager, navigation, state-manager), `js/storage/` (3 : migrations, save-manager, save-validator), `js/systems/` (6 : audio-system, chronology-system, document-system, exploration, memory-notebook, progress-system), `js/ui/` (10 fichiers), `js/utils/` (4), `js/main.js`, `content/fr/` (7 fichiers JSON : chapters, documents, glossary, narratives, people, sources, timeline), `css/` (8), `assets/illustrations/` (17 SVG), `tests/` (`validate_content.py`, `content-validation.md`, `manual-qa.md`, `viewport-*.html`, `fixtures/save-v1.json`), `docs/` (`GAME_DESIGN.md`, `HISTORICAL_REVIEW.md`, `RELEASE_CHECKLIST.md`), `404.html`, `.nojekyll`.
- **Fichier d'entrée** : `index.html`. Chargement réel des scripts à vérifier en phase 2.
- **Sauvegarde** : `localStorage` (`js/storage/save-manager.js` : sonde lignes 20–21, lecture ligne 31, écriture ligne 46, suppression ligne 59) avec repli en mémoire (commentaire ligne 4). Validation et migrations présentes : `js/storage/save-validator.js`, `js/storage/migrations.js`. Contenu à lire en phase 2.
- **Dépendances** : aucune déclarée. Aucune dépendance externe repérée dans le listing.
- **Audio** : WebAudio synthétisé (`js/systems/audio-system.js` lignes 42–46, 70, 174). Aucun fichier audio dans le projet.
- **Contrôles réels (déduits du code)** : clic ou tap pour la navigation ; clavier : Tab (piège de focus), Entrée, Échap (`js/core/application.js` lignes 149, 177–178 ; `js/ui/modal.js` lignes 21, 199–200 ; `js/utils/accessibility.js` ligne 75) ; souris : `mousedown` sur le fond de modale (`js/ui/modal.js` ligne 84).
- **État de développement** : version 0.8.0 (`CHANGELOG.md`, ligne 20, date 2026-11-11). Le CHANGELOG liste explicitement, sous « À faire avant la version 1.0.0 » (lignes 8–18) : relecture historique indépendante, autorisations de reproduction, vérification des références judiciaires, tests multi-navigateurs et lecteurs d'écran.
- **Publication** : aucun dépôt GitHub du compte `Casifox` portant ce nom. Le README (lignes 67 et 319) contient `https://<utilisateur>.github.io/avant-le-silence/` : c'est un **placeholder**, non une URL vérifiée. Statut : **NON PUBLIÉ**.
- **Risques initiaux** : pas de Git (aucune branche possible sans initialisation, voir DECISIONS.md D-010) ; pas de tests JavaScript automatisés (un script Python `tests/validate_content.py` existe) ; contenu historique sensible qui demande une vérification externe (CHANGELOG, « À faire »).
- **Complexité estimée** : moyenne (narratif, nombreux fichiers JSON de contenu, plusieurs systèmes de progression).

### 3.2 Doomscroll Dungeon (`doomscroll-dungeon`)

- **Nom exact affiché** : « Doomscroll Dungeon — Le fil qui vous dévore » (`index.html`, ligne 18).
- **Description** : `package.json` ligne 6 : « Roguelite d'action satirique : transformez votre fil d'actualité en donjon. » Description GitHub : « Un roguelite d'action satirique jouable dans le navigateur. »
- **Dossier** : `C:\Users\Noah\Documents\doomscroll-dungeon\`.
- **Git** : `origin` = `https://github.com/Casifox/doomscroll-dungeon.git`. Branche `main`, `git status --short --branch` → `## main...origin/main` (aucun fichier modifié). HEAD `88ef6cc10ef6befd0edeb8efd7bb56a64a2db859` (2026-11-11 22:04:42 +01:00, « CI: restaure le runner GitHub-hosted standard [skip ci] »). Commits précédents : `597b52f` (22:01:31, « CI: déploiement Pages sans environnement bloquant »), `396c21e` (21:58:11, « CI: exécution du déploiement sur runner auto-hébergé »).
- **Publication** : GitHub Pages, API `gh api repos/Casifox/doomscroll-dungeon/pages` → `status: built`, `build_type: workflow`, source `gh-pages /`. URL `https://casifox.github.io/doomscroll-dungeon/` → HTTP 200 (contenu de 1557 caractères). Statut : **PUBLIÉ**. Le contenu servi est à comparer au commit local en phase 3.
- **Technologies** : TypeScript `^5.7.2`, Vite `^6.0.7`, Vitest `^2.1.8` (devDependencies seulement). `"type": "module"`, `engines.node` `>=20`.
- **Dépendances** : aucune dépendance d'exécution déclarée. Aucun import de paquet nu dans `src/` (grep `from ['"][a-z@]` → aucun résultat).
- **Scripts** : `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test` (`vitest run`), `test:watch`.
- **Fichiers (hors .git)** : 64. Par extension : `.ts` 34, `.css` 8, `.png` 7, `.svg` 3, `.json` 3, `.nojekyll` 2, `.html` 2, `.md` 1, `.gitignore` 1, `.js` 1 (`dist/assets/index-CDX8AEgw.js`, sortie de build locale), `.yml` 1, sans extension 1.
- **Structure** (listing réel) : `src/main.ts` (entrée TypeScript, 908 octets), `src/core/` (`game-loop.ts` 57 Ko, `game-state.ts`, `rng.ts`, `types.ts`, `config.ts`), `src/entities/` (`enemies.ts`, `bosses.ts`), `src/systems/` (`combat.ts`, `generation.ts`, `progression.ts`, `scoring.ts`), `src/input/` (`keyboard.ts`, `scroll.ts`, `touch.ts`), `src/storage/save.ts`, `src/ui/` (`hud.ts`, `feed.ts`, `overlays.ts`, `menu.ts`, `results.ts`, `toast.ts`, `fx.ts`, `icons.ts`, `dom.ts`), `src/audio/audio-manager.ts`, `src/styles/` (8 CSS), `tests/` (5 fichiers `*.test.ts`), `.github/workflows/deploy.yml`, `docs/` (captures d'écran PNG, `banner.svg`), `dist/` (sortie de build locale : `dist/assets/index-CDX8AEgw.js`).
- **Fichier d'entrée** : `index.html` → `src/main.ts` (le lien exact est à vérifier en phase 2).
- **Contrôles réels** (`src/input/keyboard.ts`, lignes 25–51, lus) : Espace = aimer (`onLike`), C = commenter, S = partager, X = ignorer, Maj + Flèche bas = esquiver, Échap = pause. Tactile : `touchstart`/`touchmove`/`touchend`/`touchcancel` (`src/input/touch.ts` lignes 52–55). Molette : `src/input/scroll.ts` ligne 30. Clic et Entrée sur les cartes du fil : `src/ui/feed.ts` lignes 294–300.
- **Sauvegarde** : `localStorage` (`src/storage/save.ts` lignes 26–30 : sonde d'écriture puis retour de `window.localStorage`). Lecture/écriture et validation à analyser en phase 2.
- **Audio** : WebAudio synthétisé (`src/audio/audio-manager.ts` lignes 57, 79, 207, 307). Aucun fichier audio.
- **Tests existants** : 5 fichiers Vitest (`tests/combat`, `generation`, `progression`, `save`, `scoring`). **Non exécutés à ce stade** (prévu en phase 2, sur une copie de travail).
- **État** : version 1.0.0 (`package.json`). Les derniers commits sont des corrections de déploiement CI.
- **Complexité estimée** : moyenne à élevée (boucle de jeu de 57 Ko, UI multiple, tactile + clavier).

### 3.3 Quand les notes s'effacent (`quand-les-notes-seffacent`)

> **Note du 2026-11-12 (après publication)** : le projet a été modifié entre l'inventaire et la publication. État actuel : version 1.0.0, `README.md`, `LICENSE`, `package.json`, `tests/validate.mjs` (1 669 vérifications réussies avec `npm test`), `robots.txt`, `assets/art/social-card.png`, `.nojekyll`. La fiche ci-dessous décrit l'état du 12/11 à 00:10 ; le test de publication a été refait sur l'état actuel (`TEST-REPORT-quand-les-notes-seffacent.md`).

- **Nom exact affiché** : « Quand les notes s'effacent — Une histoire en sept jours » (`index.html`, ligne 6).
- **Description** (`index.html`, ligne 7) : roman musical interactif en sept jours. Revenez à Kerlann, écoutez Élise, jouez le piano et gardez ce qui reste.
- **Dossier** : `C:\Users\Noah\Documents\QUAND LES NOTES S'EFFACENT\` (apostrophe dans le nom du dossier).
- **Git** : pas de dépôt. Aucun historique.
- **Documentation** : aucun README, aucun CHANGELOG, aucune LICENSE, aucun `package.json`, aucun dossier de tests (listing complet).
- **Technologies** : HTML, CSS, JavaScript natif. Pas de build.
- **Fichiers (hors .git)** : 41. Par extension : `.js` 25, `.svg` 10, `.css` 5, `.html` 1.
- **Structure** (listing réel) : `index.html` (24 Ko), `assets/js/main.js` (interface principale : menus, dialogues, sauvegardes), `assets/js/core/` (`atmosphere`, `audio`, `notes`, `storage`, `utils`), `assets/js/game/` (`engine.js`, `piano.js`), `assets/js/story/` (`day1`…`day7`, `epilogues`, `helpers`, `index`, `prologue`), `assets/js/data/` (`endings`, `memories`, `music`, `puzzles`), `assets/js/ui/` (`portrait`, `staff`), `assets/css/` (5 fichiers), `assets/art/` (10 SVG : favicon et 9 arrière-plans).
- **Fichier d'entrée** : `index.html`. Chargement réel des scripts à vérifier en phase 2.
- **Sauvegarde** : `localStorage` avec repli mémoire (`assets/js/core/storage.js` : sonde lignes 27–28, lecture ligne 37, écriture ligne 46, suppression ligne 61).
- **Audio** : WebAudio synthétisé (`assets/js/core/audio.js` lignes 52, 331, 500, 527–528, 555, 650). Aucun fichier audio dans le projet.
- **Contrôles réels** : clics sur les boutons (`assets/js/main.js` lignes 157–320) ; clavier : Espace ou Entrée pour avancer le dialogue (`assets/js/game/engine.js` ligne 517), Échap (`assets/js/main.js` ligne 987), M pour le son (`assets/js/main.js` lignes 996, 1005) ; piano : clics sur les touches blanches et noires (`assets/js/game/piano.js` lignes 136–149).
- **Publication** : aucun dépôt, aucune URL trouvée dans le dossier (grep `github.io|https?://` → aucun résultat). Statut : **NON PUBLIÉ**.
- **Version** : inconnue (aucun fichier de version).
- **Risques initiaux** : aucun test automatisé ; pas de Git ; pas de documentation de contrôles ; `main.js` centralise l'interface (à analyser en phase 2 pour les écouteurs et le minuteur `setInterval` ligne 1012).
- **Complexité estimée** : moyenne (7 jours scénarisés, piano interactif, 1 fichier de logique principal volumineux).

### 3.4 The Lying Game (`the-lying-game`)

- **Nom exact affiché** : « The Lying Game — Le jeu ment. Et vous ? » (`index.html`, ligne 22).
- **Description** : `package.json` ligne 5 : « A psychological puzzle adventure where the game itself lies to you. »
- **Dossier** : `C:\Users\Noah\Documents\the-lying-game\`.
- **Git** : pas de remote (`git remote -v` → aucune sortie). Branche `main` sans upstream, `git status --short --branch` → `## main` (aucun fichier modifié). HEAD `be0aae551335b284ef70c2b07d0844f85058a455` (2026-11-11 22:45:27 +01:00, « fix: finalize UI notifications and rebuild static site »). Commit précédent : `7443048ca34f553635df7bb7268838766f041787` (22:45:00, « feat: release The Lying Game v1.0.0 »).
- **Publication** : aucun dépôt GitHub du compte `Casifox` portant ce nom (`gh repo list`). Le README (lignes 25 et 63) indique `https://votre-utilisateur.github.io/the-lying-game/` : **placeholder**. Un dossier `docs/` contient un build statique (`docs/index.html`, `docs/assets/index-*.js`) et `.github/workflows/pages.yml` existe, mais rien n'est poussé. Statut : **NON PUBLIÉ** (build prêt localement).
- **Technologies** : TypeScript `^5.7.3`, Vite `^7.0.0`, Vitest `^5.1.0` (devDependencies). Dépendances d'exécution : `phaser` `^3.90.0`, `@fontsource-variable/jetbrains-mono` `^5.2.8`, `@fontsource-variable/space-grotesk` `^5.2.8`. `engines.node` `>=22.12.0`.
- **Dépendances réellement utilisées** : `phaser` est importé dans 4 fichiers (`src/core/GameApp.ts` ligne 1, `src/game/BootScene.ts` ligne 1, `src/game/LevelScene.ts` ligne 1, `src/game/RoomRenderer.ts` ligne 1). Usage des polices Fontsource : à confirmer en phase 2 (le grep sur `@fontsource` dans `src/` n'a rien trouvé ; les noms de police apparaissent dans `src/styles/global.css` ligne 21).
- **Scripts** : `dev`, `build` (`tsc --noEmit && vite build`), `typecheck`, `test` (`vitest run`), `check` (typecheck + test + build).
- **Fichiers (hors .git)** : 93. Par extension : `.ts` 39, `.png` 8, `.woff2` 8, `.json` 5, `.md` 5, `.css` 5, `.txt` 5, `.svg` 4, `.jpg` 3, `.html` 2, `.nojekyll` 2, `.js` 1 (`docs/assets/index-LqqsWSX1.js`, sortie de build statique), `.editorconfig` 1, `.gitattributes` 1, `.gitignore` 1, `.yml` 1, `.nvmrc` 1, sans extension 1.
- **Structure** (listing réel) : `src/main.ts`, `src/core/` (`GameApp.ts` 46 Ko, `Session.ts` 16 Ko), `src/engine/` (`DeceptionEngine`, `PuzzleEngine`, `RuleEngine`, `TruthEngine`), `src/game/` (`BootScene`, `LevelScene` 21 Ko, `RoomRenderer` 22 Ko), `src/content/` (`chapters`, `clues`, `endings`, `items`, `lies`, `prologue`, `index` ; `levels/chapter1.ts` à `chapter5.ts`), `src/systems/` (`MemorySystem`, `SaveManager`), `src/ui/` (`DialogueView`, `HudView`, `ModalView`, `PauseView`, `ScreenView`, `ToastView`, `dom`), `src/audio/AudioManager.ts`, `src/styles/` (5 CSS), `tests/` (4 fichiers `*.test.ts`), `.github/workflows/pages.yml`, `docs/` (build).
- **Fichier d'entrée** : `index.html` → `src/main.ts` (à confirmer en phase 2).
- **Contrôles réels** : Échap (`src/core/GameApp.ts` lignes 212–221 ; ferme les overlays), Entrée et Espace (`src/ui/ScreenView.ts` ligne 87 ; `src/ui/DialogueView.ts` ligne 164), Tab (piège de focus dans les overlays, `src/core/GameApp.ts` ligne 213), clavier de code : Retour arrière et Entrée (`src/ui/DialogueView.ts` lignes 548–551), clic sur la couche de dialogue (`src/ui/DialogueView.ts` ligne 161), joystick tactile en pointeur (`src/ui/HudView.ts` lignes 120–137). **Aucune touche de déplacement trouvée** (grep `ArrowUp|KeyW|KeyA|…` → seulement Échap). Le mode de déplacement reste à établir en phase 2.
- **Sauvegarde** : `localStorage` (`src/systems/SaveManager.ts` ligne 184 : `window.localStorage`). Commentaire `src/core/GameApp.ts` ligne 380 : localStorage peut être indisponible.
- **Audio** : WebAudio synthétisé (`src/audio/AudioManager.ts` lignes 22, 37, 65, 94). Aucun fichier audio.
- **Tests existants** : 4 fichiers Vitest (`content-validation.test.ts`, `rule-engine.test.ts`, `save-manager.test.ts`, `solvability.test.ts`). **Non exécutés à ce stade** (prévu en phase 2).
- **État** : version 1.0.0. Commit « release v1.0.0 » présent.
- **Complexité estimée** : élevée (moteur de règles, 5 chapitres de contenu, Phaser, UI multiple, sauvegarde).

### 3.5 Neon Jackpot (`incremental`)

- **Nom exact affiché** : « Neon Jackpot — Casino incrémental » (`index.html`, ligne 7).
- **Description** (`index.html`, ligne 8) : « Neon Jackpot : un casino incrémental néon, 100 % virtuel. Plinko, Blackjack, Roulette, Machines à sous, Mines, Crash et bien plus. Aucun argent réel. »
- **Dossier** : `C:\Users\Noah\Documents\incremental\`. Le dépôt GitHub est `Casifox/neon-jackpot`.
- **Git** : `origin` = `https://github.com/Casifox/neon-jackpot.git`. Branche `main...origin/main`, propre. HEAD `17614ca5dae7715b1ccef4ff0f6e12bfe3f2e93e` (2026-11-10 22:38:05 +01:00, « v1.5.1 - auto-achat global, Croupier, defis couche 4 et manches en arriere-plan »). Précédents : `e2bcd6af` (22:21:57, docs), `bff4f4e9` (22:19:09, « v1.4.1 »).
- **Publication** : GitHub Pages, API → `status: building`, `build_type: legacy`, source `main /`. URL `https://casifox.github.io/neon-jackpot/` → HTTP 200 (8456 caractères). Statut : **PUBLIÉ**, mais la version servie est à comparer au commit local en phase 3 (le build était en cours au moment du contrôle).
- **Technologies** : HTML, CSS, JavaScript natif, sans bundler. `package.json` : aucune dépendance déclarée. Scripts : `build:data` (`node tools/build-data.js`), `serve` et `start` (`python -m http.server 8080`), `og` (`python tools/make-og.py`).
- **Fichiers (hors .git)** : 49. Par extension : `.js` 21, `.json` 10, `.css` 4, `.png` 3, `.html` 2, `.xml` 1, `.svg` 1, `.py` 1, `.nojekyll` 1, `.gitignore` 1, `.txt` 1, `.md` 1, `.webmanifest` 1, sans extension 1.
- **Structure** (listing réel) : `index.html` (8,5 Ko), `src/js/` (`main.js` 7 Ko, `state.js` 11 Ko, `ui.js` 36 Ko, `pages.js` 70 Ko, `meta.js` 62 Ko, `fx.js` 20 Ko, `audio.js` 8,5 Ko, `utils.js` 12 Ko), `src/js/games/` (11 modules : `blackjack`, `crash`, `dice`, `horses`, `keno`, `mines`, `plinko`, `poker`, `roulette`, `slots`, `vault`), `src/data/` (9 fichiers JSON : `achievements`, `balance`, `collections`, `croupier`, `events`, `prestige`, `quests`, `synergies`, `unlocks`, plus `bundle.js` 67 Ko), `src/css/` (4 fichiers), `tools/` (`build-data.js`, `make-og.py`), `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `404.html`, `.nojekyll`, `assets/` (`og.png`, `screenshot-hub.png`, `screenshot-plinko.png`, `logo.svg`).
- **Fichier d'entrée** : `index.html`. Le script principal `src/js/main.js` est à confirmer en phase 2 (balises `<script>`).
- **Données générées** : `src/data/bundle.js` (67 Ko) est vraisemblablement produit par `tools/build-data.js`. **À confirmer en phase 2** (lecture du script, comparaison après rebuild sur une copie).
- **Sauvegarde** : `localStorage` (`src/js/state.js` : lecture lignes 252–255, avertissement ligne 260 si indisponible, écriture ligne 288, suppression lignes 311–312 avec clés `LEGACY_KEYS`). `sessionStorage` (`src/js/main.js` lignes 64–65 ; `src/js/state.js` ligne 313 : drapeau `neon_jackpot_welcome_pending`).
- **Audio** : WebAudio (`src/js/audio.js` lignes 25, 58). Aucun fichier audio.
- **Contrôles réels** : clics et tap (`src/js/ui.js`, `src/js/pages.js`, `src/js/games/*.js`). Échap ferme les overlays (`src/js/ui.js` lignes 176 et 631). Pas de contrôle clavier de jeu détecté dans cette passe (à confirmer en phase 2).
- **Boucles temporelles** : `requestAnimationFrame` dans `src/js/utils.js` (212–215), `src/js/fx.js` (139, 526), `src/js/games/crash.js` (113, 140, 664), `src/js/games/horses.js` (130), et d'autres (liste tronquée à 50 résultats). `setInterval` dans `src/js/pages.js` (351), `src/js/games/crash.js` (97), `src/js/games/dice.js` (517).
- **Tests existants** : aucun dossier de tests ni test automatisé détecté.
- **Complexité estimée** : élevée en volume (plus de 40 Ko par module de jeu, `pages.js` 70 Ko, `meta.js` 62 Ko), risques de cohérence des données compilées.

## 4. Synthèse

- 5 jeux identifiés (conformes à la liste fournie).
- **5 jeux publiés et joignables au 2026-11-12** : `doomscroll-dungeon`, `incremental`, puis `avant-le-silence`, `quand-les-notes-seffacent` et `the-lying-game` (voir `PUBLICATION.md`).
- 0 jeu sans dépôt Git : les dépôts de `avant-le-silence` et `quand-les-notes-seffacent` ont été initialisés pour la publication (D-025).
- 0 URL inventée : les URLs placeholder des README ont été corrigées avant publication ; les URLs retenues sont celles de GitHub Pages, vérifiées en HTTP 200.
