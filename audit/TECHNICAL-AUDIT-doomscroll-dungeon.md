# TECHNICAL-AUDIT — Doomscroll Dungeon (`doomscroll-dungeon`)

Date : 2026-11-12. Phase 2 (statuts mis à jour en phase 3 : voir `BUGS.md` et `TEST-REPORT-doomscroll-dungeon.md`). Périmètre : code source de `C:\Users\Noah\Documents\doomscroll-dungeon\` (lecture seule). Builds et tests exécutés sur la copie `audit-tools\workspaces\doomscroll-dungeon\` (clone de HEAD).

## 1. Identification

- Nom affiché : « Doomscroll Dungeon — Le fil qui vous dévore » (`index.html`, ligne 18).
- Dépôt : `Casifox/doomscroll-dungeon` (PUBLIC). Branche `main`, working tree propre, HEAD `88ef6cc10ef6befd0edeb8efd7bb56a64a2db859`.
- Version : 1.0.0 (`package.json`).
- URL publique : https://casifox.github.io/doomscroll-dungeon/ (HTTP 200, Pages `built`, source `gh-pages`).
- Stack : TypeScript, Vite 6, Vitest 2 (devDependencies uniquement). Aucune dépendance d'exécution. `vite.config.ts` : `base: './'`.

## 2. Architecture

| Zone | Fichiers | Rôle | Lecture |
|---|---|---|---|
| Entrée | `src/main.ts` | Démarrage ; `console.error` ligne 20 ; gabarit d'erreur ligne 21 | partielle (grep) |
| Boucle | `src/core/game-loop.ts` (57 Ko) | État de partie, rAF, cycle de vie, entrées | partielle : 130–153, 179, 284, 433–448, 1299–1305, 1429–1432, 1703–1705 |
| Règles | `src/core/rng.ts`, `game-state.ts`, `config.ts`, `types.ts` | RNG, graine, configuration | `rng.ts` 50–60 seulement |
| Systèmes | `src/systems/combat.ts`, `generation.ts`, `progression.ts`, `scoring.ts`, `src/entities/*.ts` | Combat, génération, progression | non lus (couverts par les 35 tests) |
| Entrées | `src/input/keyboard.ts`, `touch.ts`, `scroll.ts` | Clavier, tactile, molette | `keyboard.ts` intégral ; `touch.ts` 52–61 ; `scroll.ts` 30–31 |
| Sauvegarde | `src/storage/save.ts` (232 lignes) | Profil, réglages, partie | intégrale |
| UI | `src/ui/*.ts` (hud, feed, overlays, menu, results, toast, fx, icons, dom) | Rendu DOM | partielle (grep, `feed.ts` 120–149) |
| Audio | `src/audio/audio-manager.ts` | WebAudio synthétisé | grep |

Schéma simplifié : `main.ts` → `GameLoop` (constructeur : chargement profil et réglages, graine d'URL, `bindKeyboard`) → systèmes (combat, génération) → rendu DOM (`ui/*`) → sauvegarde (`SaveStore`, clés `doomscroll.v1.profile`, `doomscroll.v1.settings`, `doomscroll.v1.run`, `save.ts` 16–20).

## 3. Vérifications exécutées

| Commande (copie de travail) | Résultat |
|---|---|
| `npm ci` | 54 paquets installés |
| `npm run build` (`tsc --noEmit && vite build`) | Succès. 34 modules. `dist/index.html` 1.57 kB ; CSS 109.38 kB ; JS `index-CDX8AEgw.js` 156.41 kB (gzip 46.42 kB) |
| `npm test` (`vitest run`, Vitest v2.1.9) | 5 fichiers, **35 tests réussis** (scoring 6, save 6, progression 7, combat 9, generation 7) |
| `npm audit` | **6 vulnérabilités** (résumé npm : 3 modérées, 1 haute, 2 critiques) dans les devDependencies : `tinypool` (critique, GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr), `esbuild` (modérée, GHSA-67mh-4wv8-2f99), `@vitest/mocker` (modérée, GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8), plus `vite` et `vite-node` par dépendance. Correction proposée par npm : `npm audit fix --force`, qui installe vitest 5.1.0 (changement majeur). |
| Recherche de `tinypool`/`vitest` dans `dist/assets/*.js` | **0 occurrence** : les outils vulnérables ne sont pas dans le bundle livré |
| Syntaxe | Couverte par `tsc --noEmit` (succès) |

Lecture de l'impact : les vulnérabilités concernent les outils de développement et de test. Elles n'atteignent pas le code joué, mais elles touchent le serveur de développement (`npm run dev`) si celui-ci est exposé sur un réseau.

## 4. Fonctionnalités analysées

- **Contrôles réels** (`src/input/keyboard.ts`, lignes 25–51) : Espace = aimer (`onLike`), C = commenter, S = partager, X = ignorer, Maj + Flèche bas = esquiver, Échap = pause. Filtre : ignorée si un champ éditable a le focus (lignes 11–16, 22). Touches répétées ignorées (`event.repeat`).
- **Tactile** (`src/input/touch.ts`, 52–55) : `touchstart`, `touchmove`, `touchend`, `touchcancel`, passifs. Nettoyage des écouteurs (58–61).
- **Molette** (`src/input/scroll.ts`, 30–31) : écouteur `wheel` passif, nettoyage à la ligne 31.
- **Graine** : URL `?seed=` lue (`game-loop.ts` 137–138) puis `sanitizeSeed` ; saisie joueur (`overlays.ts` 231, 242) ; création de partie (`game-loop.ts` 232). `sanitizeSeed` (`rng.ts` 53–60) ne conserve que `A–Z 0–9 _ -`, en majuscules, 16 caractères maximum.
- **Cycle de vie** : rAF stocké (`rafId`, lignes 433, 443) et annulé (ligne 448). Nettoyage à chaque fin de tour (lignes 181–182, 282–283, 1299–1300, 1431–1432) et à la destruction (lignes 1703–1705, qui retirent aussi `visibilitychange`, ligne 1705).
- **Sauvegarde** (`src/storage/save.ts`) : sonde `localStorage` avec repli mémoire (24–34, 61–86) ; `JSON.parse` enveloppé dans `try/catch` (88–96) ; version de partie contrôlée (`loadRun`, 144–156) ; validation champ par champ (`validateRun`, 174–230) ; profil borné (`loadProfile`, 98–113).
- **Audio** : planificateur WebAudio `setInterval` 70 ms (`audio-manager.ts` 156), avec un `clearInterval` correspondant (1 occurrence, comptée).

## 5. Problèmes

### Trouvés
- **BUG-doomscroll-dungeon-001** (MINEURE, SUSPECTÉ) : la graine chargée depuis une sauvegarde est affichée en HTML sans échappement (`overlays.ts` ligne 576, `results.ts` ligne 42). Détail dans `BUGS.md`.

### Examinés sans défaut
- Injection par URL : le paramètre `seed` passe par `sanitizeSeed` (`game-loop.ts` 137–138 ; `rng.ts` 53–60). Le champ de saisie utilise `sanitizeSeed` dans un attribut `value="…"` (`overlays.ts` 206), ce qui protège contre la rupture d'attribut.
- `innerHTML` : 22 occurrences. Les gabarits de `feed.ts` (125–149) interpolent `room.event` (nom, description, icône) : ces valeurs viennent de tables de contenu internes, pas de l'utilisateur. Aucun sink alimenté par un texte libre saisi par le joueur n'a été trouvé.
- Écouteurs : `window keydown` (`keyboard.ts` 57) et `touch`/`wheel` sont retirés au nettoyage.
- Minuteurs : `setTimeout` (18) et `clearTimeout` (3) ; non analysés un par un (lecture partielle), aucune anomalie repérée par comptage.
- `JSON.parse` : une seule occurrence (`save.ts` 92), dans `try/catch`.

## 6. Performance statique (non mesurée)

- Bundle JS 156 kB (gzip 46 kB) : taille modeste.
- Rendus du fil par `innerHTML` (articles recréés) : à mesurer en phase 3 (FPS et mémoire).
- Pas de `requestAnimationFrame` multiple détecté (une boucle, `rafId` unique).

## 7. Limites de l'audit

- Lecture partielle de `game-loop.ts` (57 Ko), des systèmes, des entités et des UI : couverts par les 35 tests et par le grep, pas par une lecture intégrale.
- Pas de test navigateur encore (phase 3).
- Pas de lecture de `src/main.ts` au-delà des lignes 20–21.
