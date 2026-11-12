# TECHNICAL-AUDIT — Quand les notes s'effacent (`quand-les-notes-seffacent`)

Date : 2026-11-12. Phase 2 (statuts mis à jour en phase 3 : voir `TEST-REPORT-quand-les-notes-seffacent.md`). Périmètre : code source de `C:\Users\Noah\Documents\QUAND LES NOTES S'EFFACENT\` (lecture seule). Vérifications exécutées sur la copie `audit-tools\workspaces\quand-les-notes-seffacent\`.

> **Note du 2026-11-12 (après publication)** : le projet a été modifié après cet audit. État publié : version **1.0.0** (`package.json`), `README.md`, `LICENSE`, `tests/validate.mjs` (1 669 vérifications réussies), `robots.txt`, `assets/art/social-card.png`. Dépôt `Casifox/quand-les-notes-seffacent`, URL https://casifox.github.io/quand-les-notes-seffacent/. Les constats de la phase 2 ci-dessous décrivent l'état antérieur.

## 1. Identification

- Nom affiché : « Quand les notes s'effacent — Une histoire en sept jours » (`index.html`, ligne 6). Description (ligne 7) : roman musical interactif en sept jours, à Kerlann, avec un piano jouable.
- Version : **inconnue lors de l'audit** ; **1.0.0** dans l'état publié (`package.json`, ajouté après l'audit).
- Dépôt : **aucun lors de l'audit** ; dépôt `Casifox/quand-les-notes-seffacent` créé pour la publication le 2026-11-12.
- URL publique : **aucune lors de l'audit** ; **https://casifox.github.io/quand-les-notes-seffacent/** depuis le 2026-11-12.
- Documentation : absente lors de l'audit ; **README, LICENSE et tests ajoutés après l'audit**. Les contrôles ne sont documentés que dans le code pour l'état audité.
- Stack : HTML, CSS, JavaScript natif (modules ES, `import` dans `storage.js` ligne 1). Pas de build, pas de dépendance.

## 2. Architecture

| Zone | Fichiers | Lecture |
|---|---|---|
| Entrée | `index.html` (24 Ko), `assets/js/main.js` (interface principale) | `main.js` 157–324 (écouteurs, clavier global), 586–611 (liste des carnets), 987–1021 (touches, minuteur) |
| Sauvegarde | `assets/js/core/storage.js` (226 lignes) | **intégrale** |
| Audio | `assets/js/core/audio.js` (WebAudio) | grep (52, 331, 500, 527–528, 555, 650) |
| Noyau | `core/atmosphere.js`, `notes.js`, `utils.js` | non lus |
| Moteur | `assets/js/game/engine.js` (24 Ko), `piano.js` (28 Ko) | grep : `engine.js` 98–103, 449, 517 ; `piano.js` 102, 118, 136–149, 681 |
| Récit | `assets/js/story/day1.js` à `day7.js`, `epilogues.js`, `prologue.js`, `helpers.js`, `index.js` | non lus |
| Données | `assets/js/data/endings.js`, `memories.js`, `music.js`, `puzzles.js` | non lus |
| Interface | `assets/js/ui/portrait.js`, `staff.js` | non lus |
| Styles | `assets/css/` (5 fichiers), `assets/art/` (10 SVG) | non lus |

Minuteur unique : `#startPlaytimeClock()` appelé une seule fois (`main.js` ligne 77), `setInterval` ligne 1020.

## 3. Vérifications exécutées

| Vérification | Résultat |
|---|---|
| Syntaxe de 25 fichiers `.js` (copie `.mjs`, `node --check`) | **25/25 OK** |
| Tests automatisés | **Aucun** dans le projet : `TEST NON EFFECTUÉ` (tests navigateur en phase 3) |
| `eval`, `new Function` | 0 occurrence |
| `target="_blank"` | 0 occurrence |

## 4. Sauvegarde

- Clés : préfixe `qlnse.save.v1.` + numéro d'emplacement (`storage.js` 5–6) ; réglages `qlnse.settings.v1`. Trois emplacements (`SLOT_COUNT = 3`, ligne 4).
- `SafeStorage` (21–67) : test d'écriture au démarrage (25–33) ; en cas d'échec, repli mémoire et avertissement console (31, 51–55).
- Chargement (`SaveStore.load`, 115–126) : `JSON.parse` dans `try/catch` (119–125) ; `#sanitize` (128–145) rejette la version différente (130) et un `chapterId` vide ou non textuel (131) ; filtre les listes (`memories`, `seenIntros`), borne `pageIndex` et `playTime`.
- Réglages (`SettingsStore`, 188–223) : `#sanitize` borne les volumes (`clamp`, 203–205), valide la vitesse (`VALID_SPEEDS`, 207), force les booléens.
- Écriture (`save`, 98–113) : refuse un emplacement invalide (99–102), horodate, renvoie `false` en cas d'échec.

## 5. Problèmes

**Aucun bug confirmé dans les parties lues.** Points de vigilance :
- La sauvegarde n'est pas copiée avant écrasement (cas de l'emplacement corrompu), mais le chargement d'un emplacement illisible renvoie `null` et laisse l'emplacement en place (`load`, 118–125) : à vérifier en phase 3 (T-QUAND-01 non prévu à ce stade).
- `innerHTML` (19 occurrences) : les gabarits de `piano.js` (102, 118) n'interpolent que des libellés de notes (`shortFrenchName`, `#keyboardHint`) issus de constantes. `main.js` 589–611 n'interpole que des nombres, des dates formatées et des titres issus de tables (`getChapter`, `getEnding`). **Aucun texte libre provenant de la sauvegarde n'est rendu**, dans les parties lues.

### Examinés sans défaut
- Écouteurs globaux posés une seule fois (`main.js` 271–277 : `keydown` en capture, `fullscreenchange`, `beforeunload` qui appelle `engine.saveNow()` seulement en partie).
- Écouteurs de premier geste retirés dès le premier geste (`main.js` 313–316, mêmes paramètres de capture).
- Écouteurs des boîtes de dialogue posés une fois (`main.js` 292–309).
- Minuteur de temps de jeu unique (77, 1020), gardé par `document.hidden` (1021).

## 6. Performance statique

- Rendu de la liste des carnets complet à chaque changement (`#renderSlots`, 586) : coût négligeable pour 3 emplacements.
- Pas de dépendance externe : pas de coût réseau identifié à l'audit statique.

## 7. Limites de l'audit

- **Lecture partielle** : `engine.js`, `piano.js`, `story/*.js`, `data/*.js`, `ui/*.js`, `core/audio.js`, `core/atmosphere.js` non lus intégralement.
- Aucun test automatisé, aucune documentation, aucun dépôt, aucune version : le projet ne peut pas être suivi dans le temps tel quel.
- Pas de test navigateur encore (phase 3). Projet non publié : tests en local.
