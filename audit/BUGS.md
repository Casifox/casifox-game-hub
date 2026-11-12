# BUGS — consolidé (5 jeux)

Mis à jour : 2026-11-12, après les corrections et les tests publics. Format : `audit/TECHNICAL-AUDIT-<slug>.md`, section 5. Source de vérité des statuts : les fichiers `audit/screenshots/<slug>/logs/targeted-*.json`, `TEST-REPORT-<slug>.md` et `CHANGELOG.md`.

## Corrections appliquées le 2026-11-12

| Bug | Projet | Commit | Correctif | Test après correction |
|---|---|---|---|---|
| BUG-incremental-002 | Neon Jackpot | `154a5b1` | Validation du schéma (`State.sanitize`), échappement de `icon`/`value`, `deepMerge` sans clés dangereuses | T-INCR-02 : TEST RÉUSSI (public) |
| BUG-incremental-001 | Neon Jackpot | `154a5b1` | Copie de secours avant remplacement d'une sauvegarde illisible | T-INCR-01 : TEST RÉUSSI (public) |
| BUG-incremental-003 | Neon Jackpot | `154a5b1` | `deepMerge` ignore `__proto__`, `constructor`, `prototype` | T-INCR-03 : TEST RÉUSSI (public) |
| BUG-avant-le-silence-001 | AVANT LE SILENCE | `84bdec4` | `backupCorrupted()` avant retour `null` d'une sauvegarde illisible | T-AVANT-01 : TEST RÉUSSI (public) |
| BUG-the-lying-game-001 | The Lying Game | `1ac3495` | `matchMedia` mis en cache, minuteur sans appel par tick | T-LYING-01 : TEST RÉUSSI (public) |
| BUG-the-lying-game-002 | The Lying Game | `1ac3495` | Suppression de `clearRun()` avant l'écriture de la nouvelle partie | T-LYING-02 : TEST RÉUSSI (public) |
| BUG-doomscroll-dungeon-001 | Doomscroll Dungeon | `1b2d05b` | `sanitizeSeed` appliqué dans `validateRun` | T-DOOM-01 : TEST RÉUSSI (public) |

Chaque correctif a été poussé sur `main` après succès des tests ciblés ; les parcours complets des quatre jeux ont été rejoués sur les URLs publiques (0 erreur JavaScript, 0 requête en échec). Détail : `CHANGELOG.md`.

## Tableau de synthèse

| ID | Jeu | Titre court | Gravité | Confiance | Test | Statut |
|---|---|---|---|---|---|---|
| BUG-incremental-002 | Neon Jackpot | Sauvegarde importée : champs non échappés, script exécuté | CRITIQUE | CONFIRMÉ (exécution) | T-INCR-02 : TEST ÉCHOUÉ | **CORRIGÉ** |
| BUG-incremental-001 | Neon Jackpot | Sauvegarde corrompue réécrite sans copie de secours | MAJEURE | CONFIRMÉ (exécution) | T-INCR-01 : TEST ÉCHOUÉ | **CORRIGÉ** |
| BUG-avant-le-silence-001 | AVANT LE SILENCE | Sauvegarde illisible réécrite sans copie de secours | MAJEURE | CONFIRMÉ (exécution) | T-AVANT-01 : TEST ÉCHOUÉ | **CORRIGÉ** |
| BUG-the-lying-game-002 | The Lying Game | Nouvelle partie : sauvegarde effacée avant l'écriture de la nouvelle | MINEURE | CONFIRMÉ (exécution, panne de stockage simulée) | T-LYING-02 : TEST ÉCHOUÉ | **CORRIGÉ** |
| BUG-the-lying-game-001 | The Lying Game | Minuteur de cadrage portrait actif en paysage (≈14 appels/s) | MINEURE | CONFIRMÉ (exécution) | T-LYING-01 : TEST ÉCHOUÉ | **CORRIGÉ** |
| BUG-doomscroll-dungeon-001 | Doomscroll Dungeon | Graine d'une sauvegarde rendue en HTML sans échappement | MINEURE | CONFIRMÉ (HTML injecté ; script non exécuté) | T-DOOM-01 : TEST ÉCHOUÉ | **CORRIGÉ** |
| BUG-incremental-003 | Neon Jackpot | `deepMerge` : pollution de prototype locale via `__proto__` | MINEURE | CONFIRMÉ (locale) ; globale non démontrée | T-INCR-03 : TEST PARTIEL | **CORRIGÉ** |

Quand les notes s'effacent : aucun bug confirmé dans les parties lues (voir son audit, section 5 ; `TEST-REPORT-quand-les-notes-seffacent.md`).

---

### BUG-incremental-002 — Sauvegarde importée : champs non échappés, script exécuté

- Fichier : `src/js/pages.js` (rendus), `src/js/state.js` (import et chargement), `src/js/utils.js` (fusion).
- Fonction / composant : bloc « Journal récent » (ligne 166–170), panneau des effets (lignes 210 et 632), `State.import` (324–332), `U.deepMerge` (147–164).
- Lignes : `pages.js` 167 (`${j.icon}`), 210 (`${b.icon || "✨"}`, `+${b.value} %`), 632 (mêmes champs) ; `state.js` 324–332 (seul contrôle : `typeof parsed.tokens === "number"`) ; `utils.js` 147–149 (les tableaux de la sauvegarde remplacent ceux de la base sans contrôle).
- Preuve (exécution) : T-INCR-02 : `window.__xss === 1` après chargement d'une sauvegarde contenant `journal[0].icon = <img src=x onerror="window.__xss=1">`. Preuve (code) : lecture de `pages.js` 166–170 et `state.js` 324–332. Fichiers : `audit/screenshots/incremental/logs/targeted-T-INCR-02.json`, `t-incr-02.png`.
- Problème : une sauvegarde forgée peut contenir du HTML dans les champs `icon` ou `value`, rendu sans échappement dans `innerHTML`. Le script de l'attaquant s'exécute dans le contexte du jeu.
- Cause racine : absence de validation du schéma (à l'import comme au chargement), et échappement appliqué au texte mais pas aux autres champs affichés.
- Conséquence joueur : un fichier de sauvegarde forgé, importé volontairement par la victime, exécute du code dans l'origine. **L'origine `https://casifox.github.io` est partagée par tous les projets GitHub Pages du compte** (dont `doomscroll-dungeon`) : le script peut lire leurs `localStorage`. C'est la raison de la gravité CRITIQUE.
- Précondition : la victime doit importer le fichier. La voie testée est `localStorage` (même chemin de rendu que l'import) ; la sélection de fichier n'a pas été automatisée.
- Gravité : CRITIQUE (faille de sécurité exploitable ; portée étendue à l'origine partagée ; précondition : import volontaire d'un fichier).
- Correction proposée : valider le schéma dans `State.import` et `State.load` (types, longueurs, liste blanche pour `icon`, valeur numérique pour `value`) ; échapper tous les champs affichés avec `h()` (`pages.js` 167, 210, 632) ; ne pas recopier les tableaux sans contrôle.
- Test de vérification : T-INCR-02 doit passer à TEST RÉUSSI (aucun élément injecté, `window.__xss` indéfini).
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

### BUG-incremental-001 — Sauvegarde corrompue réécrite sans copie de secours

- Fichier : `src/js/state.js`, `src/js/main.js`.
- Fonction / composant : `State.load` (262–275), `State.save` (284–299), boucle principale (sauvegarde automatique, `main.js` 120–123).
- Preuve (exécution) : T-INCR-01 : la valeur `{` est remplacée par l'état par défaut dans les premières secondes après l'ouverture (mesuré à 2,5 s) ; aucune clé de secours. Fichiers : `logs/targeted-T-INCR-01.json`, `t-incr-01.png`.
- Problème : une sauvegarde illisible est remplacée par la partie par défaut, sans conservation de la valeur brute.
- Cause racine : `State.load` ne conserve pas la valeur brute ; la sauvegarde automatique écrit l'état par défaut peu après le démarrage. Le moment exact de la réécriture (chargement ou premier tick de la boucle) n'a pas été isolé.
- Conséquence joueur : perte définitive d'une sauvegarde déjà illisible pour le jeu, alors qu'elle pourrait être récupérée à la main.
- Gravité : MAJEURE (déclencheur rare : JSON invalide ; correction simple).
- Correction proposée : avant toute écriture après un échec de lecture, copier la valeur brute sous `neon_jackpot_save_v1.backup.<horodatage>`, et prévenir le joueur par un toast.
- Test de vérification : T-INCR-01 doit passer à TEST RÉUSSI (copie de secours présente).
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

### BUG-avant-le-silence-001 — Sauvegarde illisible réécrite sans copie de secours

- Fichier : `js/storage/save-manager.js`, `js/core/state-manager.js`.
- Fonction / composant : `SaveManager.read` (28–39), `StateManager.load` (22–31), écriture (74).
- Preuve (exécution) : T-AVANT-01 : après chargement, la valeur `{` est toujours là ; après les premières actions du joueur (écritures), la clé est réécrite par une progression neuve, sans copie. Fichiers : `logs/targeted-T-AVANT-01.json`, `t-avant-01.png`.
- Problème : une sauvegarde JSON invalide est remplacée à la première écriture, sans conservation.
- Cause racine : aucune copie de la valeur illisible avant écriture.
- Conséquence joueur : perte de la progression illisible. Le joueur reçoit un avertissement (« Une nouvelle progression a été commencée »), mais aucune donnée n'est conservée.
- Gravité : MAJEURE (même justification que BUG-incremental-001).
- Correction proposée : dans `SaveManager.read`, en cas d'erreur de JSON, copier la valeur brute sous `avant-le-silence.save.v1.backup.<horodatage>`.
- Test de vérification : T-AVANT-01 doit passer à TEST RÉUSSI.
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

### BUG-the-lying-game-002 — Nouvelle partie : sauvegarde effacée avant l'écriture de la nouvelle

- Fichier : `src/core/GameApp.ts`.
- Fonction / composant : `beginNewGame` (410–419).
- Lignes : `clearRun()` ligne 415 ; `saveRun()` ligne 419, sans `try` ; `saveRun` (ligne 507) sans protection.
- Preuve (exécution) : T-LYING-02 : après confirmation de « NOUVELLE SESSION » avec une écriture simulée en échec, la clé `the-lying-game.save.v1` est absente et l'erreur simulée a été levée. Fichiers : `logs/targeted-T-LYING-02.json`, `t-lying-02.png`.
- Problème : la suppression précède l'écriture ; si celle-ci échoue, l'ancienne progression est perdue sans être restaurée.
- Cause racine : ordre des opérations (effacement, puis écriture) et absence de protection sur l'écriture.
- Conséquence joueur : perte de progression, dans le seul cas d'une défaillance du stockage au moment de l'écriture (rare, mais réel).
- Gravité : MINEURE (déclencheur rare).
- Correction proposée : écrire la nouvelle sauvegarde avant de supprimer l'ancienne, ou entourer l'opération d'un `try` qui restaure l'état précédent.
- Test de vérification : T-LYING-02 doit passer à TEST RÉUSSI (une sauvegarde subsiste).
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

### BUG-the-lying-game-001 — Minuteur de cadrage portrait actif en paysage

- Fichier : `src/core/GameApp.ts`.
- Fonction / composant : `startPortraitPanTicker` (312–348), appelée ligne 159.
- Lignes : `setInterval(…, 40)` à la ligne 314 ; jamais arrêté.
- Preuve (exécution) : T-LYING-01 : 144 appels de `matchMedia('(max-width: 600px)…')` en 10 s, en paysage 1366x768, pendant la partie (≈14 par seconde, contre 25 attendues à 40 ms). Fichiers : `logs/targeted-T-LYING-01.json`, `t-lying-01.png`.
- Problème : le minuteur tourne pendant la session, y compris hors mobile et hors portrait. Chaque tick interroge le DOM et `matchMedia`.
- Cause racine : pas de condition de démarrage (portrait uniquement) ni d'arrêt en fin de partie.
- Conséquence joueur : consommation CPU inutile, à mesurer sur appareil réel.
- Gravité : MINEURE (performance).
- Correction proposée : démarrer le minuteur seulement en portrait (écouteur `matchMedia`), et l'arrêter dans `endLayer` et au retour à l'écran titre.
- Test de vérification : T-LYING-01 doit passer à TEST RÉUSSI (0 appel en paysage).
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

### BUG-doomscroll-dungeon-001 — Graine d'une sauvegarde rendue en HTML sans échappement

- Fichier : `src/ui/overlays.ts`, `src/ui/results.ts`, `src/storage/save.ts`.
- Fonction / composant : panneau pause (`overlays.ts` 576), écran de résultats (`results.ts` 42).
- Lignes : `overlays.ts` 576 (`<strong class="pause-seed">${options.run.seed}</strong>`) ; `results.ts` 42 (`GRAINE ${result.seed}`) ; `save.ts` 178 (validation : chaîne, longueur ≤ 24, sans contrôle des caractères).
- Preuve (exécution) : T-DOOM-01 : après modification de la graine de la sauvegarde en `<img src=x onerror=y=1>` et reprise de la partie, le panneau pause contient `<img src="x" onerror="y=1">` dans le DOM. Le script de l'attribut n'a pas été exécuté (`window.y` indéfini) ; la cause n'a pas été identifiée. Fichiers : `logs/targeted-T-DOOM-01.json`, `t-doom-01.png`.
- Problème : une graine stockée contenant du HTML est insérée telle quelle.
- Cause racine : la graine n'est assainie qu'à la création (`game-loop.ts` 232, `overlays.ts` 231), pas au chargement de la sauvegarde.
- Conséquence joueur : injection HTML limitée au navigateur qui modifie son propre stockage local. **Aucun vecteur distant identifié** : le paramètre d'URL `seed` est assaini (`game-loop.ts` 137–138 ; `rng.ts` 53–60).
- Gravité : MINEURE (pas de vecteur distant ; précondition : modification du stockage local).
- Correction proposée : appliquer `sanitizeSeed` dans `validateRun` (`save.ts`) ; à défaut, remplacer `innerHTML` par `textContent` pour ces deux lignes.
- Test de vérification : T-DOOM-01 doit passer à TEST RÉUSSI (aucun élément HTML injecté).
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

### BUG-incremental-003 — `deepMerge` : pollution de prototype locale via `__proto__`

- Fichier : `src/js/utils.js`.
- Fonction / composant : `U.deepMerge` (147–164).
- Preuve (exécution) : T-INCR-03 : `merged.polluted === 1` (propriété héritée du prototype de l'objet fusionné) ; `({}).polluted` indéfini (pas de pollution globale). Fichiers : `logs/targeted-T-INCR-03.json`.
- Problème : une clé `__proto__` issue d'une sauvegarde modifie le prototype de l'objet fusionné.
- Cause racine : fusion sans liste de clés interdites.
- Conséquence joueur : aucune conséquence observée à ce stade ; pollution globale non démontrée.
- Gravité : MINEURE.
- Correction proposée : ignorer `__proto__`, `constructor` et `prototype` dans `deepMerge`.
- Test de vérification : T-INCR-03 doit passer à TEST RÉUSSI (aucune propriété héritée).
- Statut : CORRIGÉ (voir la section « Corrections appliquées » et `CHANGELOG.md`).

---

## Pistes examinées et écartées

- `neon-jackpot` `plinko.js` 849 : `${d.charges.freePlinko}` non échappé, mais gardé par `d.charges.freePlinko > 0` (ligne 847) : pas d'injection possible par cette voie.
- `neon-jackpot` `U.fmt` (utils.js 39–57) : convertit en nombre avant formatage : pas de sink HTML.
- `doomscroll-dungeon` `feed.ts` 142–146 : `room.event` provient de tables internes.
- `the-lying-game` `dom.ts` 29 : propriété `html` jamais utilisée (aucun appel dans `src/`).
- `the-lying-game` `main.ts` 24–31 : gabarit statique.
- `quand-les-notes-seffacent` `main.js` 589–611 : valeurs numériques ou issues de tables.
- `neon-jackpot` `bundle.js` : régénéré identique au committé (SHA256 identique) ; la version publique correspond au HEAD (VERSION et VERSION-2 des tests en ligne).
