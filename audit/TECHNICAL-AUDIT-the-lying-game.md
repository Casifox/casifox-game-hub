# TECHNICAL-AUDIT — The Lying Game (`the-lying-game`)

Date : 2026-11-12. Phase 2 (statuts mis à jour en phase 3 : voir `BUGS.md` et `TEST-REPORT-the-lying-game.md`). Périmètre : code source de `C:\Users\Noah\Documents\the-lying-game\` (lecture seule). Builds et tests exécutés sur la copie `audit-tools\workspaces\the-lying-game\` (clone de HEAD).

## 1. Identification

- Nom affiché : « The Lying Game — Le jeu ment. Et vous ? » (`index.html`, ligne 22).
- Dépôt : **aucun remote** (`git remote -v` vide). Branche `main`, working tree propre, HEAD `be0aae551335b284ef70c2b07d0844f85058a455` (2026-11-11 22:45:27 +01:00). Commit précédent : `7443048ca34f553635df7bb7268838766f041787` (« feat: release The Lying Game v1.0.0 »).
- Version : 1.0.0 (`package.json`).
- URL publique : **aucune**. Le README (lignes 25 et 63) cite `https://votre-utilisateur.github.io/the-lying-game/` : placeholder, non utilisé. Aucun dépôt de ce nom sur le compte `Casifox`.
- Stack : TypeScript, Phaser 3.90 (runtime, importé dans 4 fichiers), Vite 7, Vitest 5.1, Fontsource (polices). `engines.node` `>=22.12.0`. `vite.config.ts` : `base: './'`.

## 2. Architecture

| Zone | Fichiers | Rôle | Lecture |
|---|---|---|---|
| Entrée | `src/main.ts` | Démarrage ; gabarit de repli (lignes 20–31, contenu statique) | lignes 18–31 |
| Contrôleur | `src/core/GameApp.ts` (46 Ko) | Écrans, sauvegarde, minuteurs, écouteurs globaux | partielle : 79–80, 99, 159, 183–221, 296–359, 374–380, 398–427, 500–513 |
| Session | `src/core/Session.ts` (16 Ko) | Session de niveau | grep (`try` 214, 238, 282) |
| Moteur | `src/engine/` (`DeceptionEngine`, `PuzzleEngine`, `RuleEngine`, `TruthEngine`) | Règles et mensonges | non lu (couvert par 24 tests) |
| Phaser | `src/game/` (`BootScene`, `LevelScene` 21 Ko, `RoomRenderer` 22 Ko) | Rendu des salles | import seul (ligne 1) |
| Contenu | `src/content/` (chapitres 1 à 5, indices, mensonges, fins) | Données | non lu |
| Sauvegarde | `src/systems/SaveManager.ts` (314 lignes) | Partie, archive, réglages | **intégrale** |
| Interface | `src/ui/` (`DialogueView` 36 Ko, `HudView`, `ModalView`, `ScreenView`, `PauseView`, `ToastView`, `dom`) | DOM | `DialogueView` 80–245 ; `HudView` 76–142 (grep) |
| Audio | `src/audio/AudioManager.ts` | WebAudio synthétisé | 66–134 ; 124 et 159 (grep) |

## 3. Vérifications exécutées

| Commande (copie de travail) | Résultat |
|---|---|
| `npm ci` | 38 paquets ; **0 vulnérabilité** signalée |
| `npm run check` = `typecheck` + `test` + `build` | **Succès complet** |
| `tsc --noEmit` | Succès |
| `vitest run` (v5.1.0) | 4 fichiers, **24 tests réussis** (content-validation, rule-engine, save-manager, solvability) |
| `vite build` (v7.3.8) | 45 modules. Sortie `docs/` : `index.html` 18.64 kB ; `index-Cxis6QE9.css` 76.48 kB ; `index-LqqsWSX1.js` **1 436.64 kB** (gzip 397.88 kB) ; polices woff2 |
| Concordance | Le nom du bundle JS reconstruit (`index-LqqsWSX1.js`) est **identique** à celui du `docs/` committé : le build publié correspond aux sources |

## 4. Fonctionnalités analysées

- **Contrôles réels** :
  - Échap : ferme ou ouvre les overlays (`GameApp.ts` 212–221).
  - Entrée et Espace : avancent le dialogue (`ScreenView.ts` 87 ; `DialogueView.ts` 162–169).
  - Tab : piège de focus dans les overlays (`GameApp.ts` 213).
  - Clavier de code : Retour arrière et Entrée (`DialogueView.ts` 548–551).
  - Clic : couche de dialogue (`DialogueView.ts` 161) et boutons.
  - Pointeur : joystick tactile (`HudView.ts` 120–137), resize (95).
  - **Aucune touche de déplacement** n'a été trouvée par grep (`ArrowUp`, `KeyW`, `KeyA`…). Le paramètre `movement` (`zqsd`, `wasd`, `arrows`, `SaveManager.ts` 29 et 79–82) indique une gestion de déplacement qui n'a pas été localisée en phase 2.
- **Dialogue** (`DialogueView.ts`) :
  - `dialogue()` (111–178) : `beginLayer()`, écouteurs `keydown` et `click`, puis `renderDialogueLine()` (ligne 172).
  - Machine à écrire : `setInterval` 18 ms (220), arrêté dans `stopTyping()` (103–109), appelé par `endLayer()` (86) et `advanceDialogue()` (234).
  - `endLayer()` (81–101) retire les trois écouteurs et arrête le minuteur : **nettoyage vérifié**.
- **Sauvegarde** (`SaveManager.ts`) :
  - Sonde de `localStorage` au constructeur (183–193) avec repli éphémère.
  - Chargement : `JSON.parse` dans `try/catch` (218–239, 268–286, 300–304), normalisation (`normalizeRun` 132–158, `normalizeSettings` 77–96, `normalizeMemory` 98–113), migration de version (115–130).
  - Sauvegarde corrompue : `backupCorruptedRun()` (255–263) copie la valeur brute sous `SAVE_KEY.backup.<timestamp>`, appelée dans `beginNewGame` si une erreur de chargement a été signalée (`GameApp.ts` 412–414). **Protection vérifiée.**
  - Écriture : `saveRun` (242–249) et `saveArchive` (289–291) sans `try` ; les appelants de `GameApp.ts` 374–378 sont protégés par un `try`, mais `beginNewGame` (419) et la ligne 507 ne le sont pas (voir BUG-the-lying-game-002).
- **Audio** : contexte WebAudio créé après un geste (`unlock`, 60–81) ; `startAmbience` (83–120) arrête la boucle précédente (`stopAmbienceNow`) avant d'en créer une ; `setInterval` (116) est arrêté aux lignes 124 et 159.
- **Minuteurs de `GameApp`** :
  - `startAutoHintTicker` : `setInterval` 5 s (302–305). `maybeAutoHint` (351–359) contient des gardes (mode, session, overlays ouverts, indice déjà utilisé) : pas d'effet indésirable constaté.
  - `startPortraitPanTicker` : `setInterval` 40 ms (312–348), **jamais arrêté** : voir BUG-the-lying-game-001.

## 5. Problèmes

- **BUG-the-lying-game-001** (MINEURE, CONFIRMÉ pour le code, impact non mesuré) : minuteur de cadrage portrait à 25 Hz toujours actif.
- **BUG-the-lying-game-002** (MINEURE, SUSPECTÉ) : `beginNewGame` efface la sauvegarde avant d'écrire la nouvelle, sans `try`.
- Détail des deux entrées dans `BUGS.md`.

### Examinés sans défaut
- `innerHTML` : 2 occurrences. `src/main.ts` 24 (gabarit de repli, aucune interpolation). `src/ui/dom.ts` 29 (propriété `html`) : **aucun appel dans `src/` ne passe `html:`** (grep).
- Liens externes : `target="_blank"` absent des sources (le seul résultat de grep est un identifiant de niveau, `poster_blank`, `chapter1.ts` ligne 239).
- `eval`, `new Function` : 0 occurrence.
- Écouteurs `document` du dialogue : retirés dans `endLayer()` (87–98), référence identique (pas de doublon).
- Dialogues empilés : `dialogue()` ne vérifie pas `this.active`. `beginLayer()` (72) ne réinitialise pas le minuteur de frappe. Un second appel pendant une frappe laisserait l'ancien intervalle actif. Aucun appel concurrent n'a été trouvé à ce stade (vérification des appelants non effectuée) : **point à vérifier**, non classé comme bug.

## 6. Performance statique

- Bundle JS de 1.44 Mo (398 Ko gzip) : Phaser est inclus. Sur mobile, le temps de chargement doit être mesuré en phase 3.
- Minuteur permanent à 40 ms (BUG-the-lying-game-001).
- Pas de chargement différé (lazy loading) des chapitres détecté dans l'audit statique : à vérifier.

## 7. Limites de l'audit

- Non lus : `src/engine/*`, `src/content/*`, `src/core/Session.ts`, `src/ui/ScreenView.ts`, `src/ui/ModalView.ts`, la plus grande partie de `GameApp.ts`, `LevelScene.ts` et `RoomRenderer.ts`.
- Pas de test navigateur encore (phase 3). Le jeu n'est pas publié : tests en local seulement.
- Non vérifié : les touches de déplacement (voir section 4).
