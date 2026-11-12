# TECHNICAL-AUDIT — Neon Jackpot (`incremental`)

Date : 2026-11-12. Phase 2 (statuts mis à jour en phase 3 : voir `BUGS.md` et `TEST-REPORT-incremental.md`). Périmètre : code source de `C:\Users\Noah\Documents\incremental\` (lecture seule). Vérifications exécutées sur la copie `audit-tools\workspaces\incremental\` (clone de HEAD).

## 1. Identification

- Nom affiché : « Neon Jackpot — Casino incrémental » (`index.html`, ligne 7). Description (ligne 8) : casino incrémental néon, 100 % virtuel, « Aucun argent réel ».
- Dossier local `incremental` ↔ dépôt `Casifox/neon-jackpot` (PUBLIC). Preuve : `git remote -v`.
- Branche `main...origin/main`, working tree propre, HEAD `17614ca5dae7715b1ccef4ff0f6e12bfe3f2e93e` (2026-11-10 22:38:05 +01:00, « v1.5.1 - auto-achat global, Croupier, defis couche 4 et manches en arriere-plan »).
- Version : 1.5.1 (`package.json`).
- URL publique : https://casifox.github.io/neon-jackpot/ (HTTP 200, 8456 caractères au contrôle). Pages : `status: building`, `build_type: legacy`, source `main /` au moment du contrôle. **La version servie n'a pas été comparée au HEAD** (prévu en phase 3).
- Stack : HTML, CSS, JavaScript natif, sans bundler. Aucune dépendance npm. Scripts : `build:data` (`node tools/build-data.js`), `serve`/`start` (`python -m http.server 8080`), `og` (`python tools/make-og.py`).

## 2. Architecture

Ordre de chargement réel (`index.html`, lignes 155–174, vérifié par grep) :
`src/data/bundle.js` → `src/js/utils.js` → `audio.js` → `fx.js` → `state.js` → `meta.js` → `ui.js` → `games/*.js` (11 modules : plinko, blackjack, roulette, slots, mines, crash, dice, keno, poker, horses, vault) → `pages.js` → `main.js`.

Toutes les scripts sont des scripts classiques, qui partagent des globales : `window.App`, `window.GAME_DATA`, `App.state`, `App.ui`, `App.meta`, `App.utils`.

| Zone | Fichiers | Taille | Lecture |
|---|---|---|---|
| Données | `src/data/*.json` (9) → `bundle.js` (65 Ko) | — | `tools/build-data.js` lu intégralement |
| État et sauvegarde | `src/js/state.js` | 11 Ko | **intégrale** |
| Utilitaires | `src/js/utils.js` | 12 Ko | 36–57 ; 140–274 |
| Démarrage | `src/js/main.js` | 7 Ko | 64–65 ; 136–149 |
| Interface | `src/js/ui.js` | 36 Ko | 103–114, 128–202, 275–361, 612–643 (grep sur le reste) |
| Pages | `src/js/pages.js` | 70 Ko | 166–170, 210, 248–264, 632, 1120–1189 ; reste en grep |
| Méta-jeu | `src/js/meta.js` | 62 Ko | grep seulement |
| Jeux | `src/js/games/*.js` (11) | 24 à 52 Ko chacun | grep ; `plinko.js` 843–862 |
| Effets | `src/js/fx.js` | 20 Ko | grep (51–62, 139, 526) |
| Audio | `src/js/audio.js` | 8,5 Ko | grep (25, 58) |

## 3. Vérifications exécutées

| Vérification | Résultat |
|---|---|
| Syntaxe de 21 fichiers `.js` (copie `.mjs`, `node --check`) | **21/21 OK** |
| `node tools/build-data.js` (copie de travail) | Succès : 9 fichiers JSON lus, bundle écrit |
| Comparaison du bundle régénéré et du bundle committé | **SHA256 identiques** (`C3E2BA22…2D1`) ; contenu sémantique identique (9 clés, aucune différente). **Pas de dérive des données.** |
| `git status` après régénération | ` M src/data/bundle.js` : cause = avertissement de fin de ligne (LF/CRLF) de Git, pas un changement de contenu |
| Tests automatisés | **Aucune suite de tests** dans le projet : `TEST NON EFFECTUÉ` (tests navigateur en phase 3) |
| Dépendances npm | Aucune déclarée : rien à auditer |

## 4. Sauvegarde

- Clés : `neon_jackpot_save_v1` (principale) et `neonJackpotSave` (héritée, `state.js` 12–13).
- Chargement (`State.load`, 249–282) : lecture de la clé principale, puis de la clé héritée ; `JSON.parse` dans `try/catch` (268–275) ; fusion profonde avec `defaultState()` (276) ; calcul du temps hors ligne (278–280).
- Sauvegarde (`State.save`, 284–299) : `localStorage.setItem` dans `try/catch` ; avertissement unique et toast si l'écriture échoue (291–296).
- Sauvegarde différée (`saveSoon`, 301–307) : délai de 700 ms.
- Sauvegarde à la sortie : `beforeunload` (`main.js` 141–144) et `visibilitychange` (145–149) : **pas de perte à la fermeture**.
- Export (320–322) : JSON indenté. Import (324–332) : voir section 5.
- Réinitialisation (309–318) : suppression des clés, drapeau `sessionStorage`, rechargement.

## 5. Problèmes

### BUG-incremental-001 — Sauvegarde corrompue écrasée sans copie de secours (MAJEURE, CONFIRMÉ par le code)
`State.load` (267–275) remplace une sauvegarde illisible par `defaultState()` et `isNew = true`. La première sauvegarde (`State.save`, 284–299, déclenchée par `saveSoon` ou `beforeunload`) remplace alors la valeur brute, sans la conserver. Test de vérification : T-INCR-01 (phase 3).

### BUG-incremental-002 — Import de sauvegarde : champs non validés rendus sans échappement (MAJEURE, PROBABLE)
- `State.import` (324–332) ne vérifie que `typeof parsed.tokens === "number"`.
- `U.deepMerge` (utils.js 147–149) remplace les **tableaux** de la base par ceux du fichier : `journal` et `buffs` sont donc importés tels quels, sans contrôle de contenu.
- Rendu non échappé : `pages.js` ligne 167 (`${j.icon}` dans le journal), ligne 210 (`${b.icon || "✨"}` et `+${b.value} %`), ligne 632 (mêmes champs dans le panneau des effets).
- Le reste du journal est échappé (`h(j.text)`, `h(j.value)`, lignes 168–169) : l'omission de `j.icon` est donc localisée.
- Test de vérification : T-INCR-02 (phase 3).

### BUG-incremental-003 — Pollution de prototype locale via `__proto__` dans `deepMerge` (MINEURE, SUSPECTÉ)
`U.deepMerge` (utils.js 151–161) ne filtre pas la clé `__proto__`. Un fichier forgé peut attribuer un prototype à un objet fusionné. Pollution globale : **non démontrée** (le résultat est un nouvel objet). Test de vérification : T-INCR-03.

### Examinés sans défaut
- `U.escapeHtml` (utils.js 251–258) échappe `& < > " '` ; `U.escapeAttr` ajoute le backtick.
- `U.fmt` (utils.js 39–57) convertit son argument en nombre (`Math.abs`) avant de formater : `goldBalls` (pages.js 918, 1087 ; plinko.js 925, 928, 1171) ne peut pas injecter de HTML.
- `plinko.js` 849 : `${d.charges.freePlinko}` non échappé, mais exécuté seulement si `d.charges.freePlinko > 0` (ligne 847). Une chaîne contenant du HTML ne peut pas passer cette condition : **pas d'injection** (examiné, non retenu).
- `ui.js` 294, 310, 500, 518, 536 : valeurs échappées avec `U.escapeHtml`.
- Écouteurs `document` : retirés (`ui.js` 623 pour 633 ; `crash.js` 647 pour 643 ; `horses.js` 646 pour 642 ; `roulette.js` 856 pour 853 ; `plinko.js` 1303 pour 1299). Écouteurs globaux uniques (`ui.js` 128, 175, 183, 202 ; `main.js` 141, 145, 153, 174 ; `fx.js` 51, 58, 62).
- Minuteurs : `setInterval` 8 et `clearInterval` 13 ; `requestAnimationFrame` 13 et `cancelAnimationFrame` 9 (comptage). Le couple `dice.js` 517 n'a pas été vérifié ligne à ligne.
- Syntaxe : 21/21.

## 6. Performance statique (non mesurée)

- Rendus par `innerHTML` complets : plus de 90 occurrences dans `src/js`. Chaque rendu de jeu reconstruit son panneau. À mesurer en phase 3 (temps de rendu, FPS).
- Boucles `requestAnimationFrame` multiples : `fx.js` (`bgLoop`, 139 ; `loop`, 526), `crash.js` (113, 140, 664), `horses.js` (130), `utils.js` (212–215, animations ponctuelles). Coût réel non mesuré.
- Données en `bundle.js` : 65 Ko chargés en bloc au démarrage.

## 7. Limites de l'audit

- Non lus intégralement : `meta.js` (62 Ko), `pages.js` (70 Ko, sauf sections citées), `ui.js` (sauf sections citées), `fx.js`, `audio.js`, et les 11 modules de jeux (sauf `plinko.js` 843–862).
- Aucune suite de tests : tests navigateur en phase 3 uniquement.
- La version servie sur GitHub Pages n'a pas encore été comparée au HEAD (phase 3, D-016).
