# IMPROVEMENTS — Phase 4 (rédigée avant les tests de Phase 3)

Date : 2026-11-12. Chaque idée repose sur un constat vérifié (audit ou test). Les idées liées à un bug renvoient à `BUGS.md` sans le dupliquer. Priorités : P0 obligatoire (données, sécurité, stabilité), P1 important et mesurable, P2 facultatif. Statut initial : PROPOSÉ.

Remarque : le statut « IMPLÉMENTÉ » n'est attribué qu'après correction et test réussi (Phase 5). Aucun statut n'est encore IMPLÉMENTÉ.

---

## Neon Jackpot (`incremental`)

### IDEA-incremental-001 — Valider la sauvegarde à l'import et au chargement

- Priorité : P0
- Problème actuel : `State.import` (`src/js/state.js` 324–332) ne vérifie que `tokens`. `U.deepMerge` (`src/js/utils.js` 147–149) importe les tableaux sans contrôle. Les champs `journal[].icon`, `buffs[].icon` et `buffs[].value` sont rendus sans échappement (`src/js/pages.js` 167, 210, 632). Voir BUG-incremental-002.
- Fonctionnalité envisagée : schéma minimal de sauvegarde (types, longueurs, listes blanches) appliqué à l'import et au chargement ; message d'erreur clair en cas de rejet.
- Implémentation : fonction `State.sanitize(raw)` appelée depuis `State.load` et `State.import`, qui recopie uniquement les champs connus avec leur type ; échappement systématique (`h()`) dans `pages.js`.
- Fichiers potentiellement concernés : `src/js/state.js`, `src/js/utils.js`, `src/js/pages.js`.
- Difficulté : MOYENNE.
- Bénéfice joueur attendu : une sauvegarde partagée ne peut plus compromettre le navigateur.
- Risque de régression : une sauvegarde ancienne peut être rejetée à tort. Mitigation : test sur les sauvegardes produites par les versions 1.0 à 1.5.1 (à fournir, ou à créer avec `App.state.export()`).
- Statut : PROPOSÉ.

### IDEA-incremental-002 — Copie de secours avant tout écrasement de sauvegarde

- Priorité : P0
- Problème actuel : une sauvegarde illisible est remplacée par la partie par défaut (`src/js/state.js` 262–275, 284–299). Voir BUG-incremental-001.
- Fonctionnalité envisagée : conserver la valeur brute sous une clé de secours horodatée, et prévenir le joueur par un toast.
- Implémentation : dans `State.load`, si `JSON.parse` échoue, copier `raw` sous `neon_jackpot_save_v1.backup.<horodatage>` avant de continuer.
- Fichiers potentiellement concernés : `src/js/state.js`.
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : récupération manuelle possible d'une progression abîmée.
- Risque de régression : quota de stockage ; à traiter par un `try` (déjà présent dans `State.save`).
- Statut : PROPOSÉ.

### IDEA-incremental-003 — Tests automatisés de l'état et de la sauvegarde

- Priorité : P1
- Problème actuel : aucune suite de tests dans le projet (`TECHNICAL-AUDIT-incremental.md`, section 3). Les corrections P0 n'ont donc pas de filet de sécurité.
- Fonctionnalité envisagée : tests `node:test` (sans dépendance) sur `State.load`, `State.save`, `State.import`, `U.deepMerge`, `U.escapeHtml`, et sur le bundle (le script `build-data` doit reproduire le bundle committé).
- Implémentation : fichier `tests/state.test.js` et script `npm test` (`node --test tests/`).
- Fichiers potentiellement concernés : nouveau `tests/`, `package.json`.
- Difficulté : MOYENNE.
- Bénéfice joueur attendu : moins de régressions d'économie (jetons, gains) à chaque mise à jour.
- Risque de régression : aucun pour le code de jeu ; coût de maintenance des tests.
- Statut : PROPOSÉ.

### IDEA-incremental-004 — Réduire les re-rendus complets des pages et des jeux

- Priorité : P2
- Problème actuel : plus de 90 affectations `innerHTML` dans `src/js/`, qui reconstruisent les panneaux à chaque mise à jour (`games/*.js`, `pages.js`). Le coût réel n'est pas mesuré (voir section 6 de l'audit).
- Fonctionnalité envisagée : mise à jour ciblée des seuls éléments qui changent (solde, compteurs).
- Implémentation : mesurer d'abord (phase 3, FPS et temps de rendu), puis cibler les jeux les plus lourds (plinko, slots).
- Fichiers potentiellement concernés : `src/js/games/plinko.js`, `src/js/games/slots.js`, `src/js/pages.js`.
- Difficulté : ÉLEVÉE.
- Bénéfice joueur attendu : fluidité sur mobile, à confirmer par mesure.
- Risque de régression : élevé (interface dense, plusieurs jeux). Ne pas entreprendre sans tests d'interface.
- Statut : PROPOSÉ (conditionné à la mesure de Phase 3).

---

## The Lying Game (`the-lying-game`)

### IDEA-the-lying-game-001 — Limiter le minuteur de cadrage portrait

- Priorité : P1
- Problème actuel : `startPortraitPanTicker` (`src/core/GameApp.ts` 312–348) tourne à 25 Hz pendant toute la session. Voir BUG-the-lying-game-001.
- Fonctionnalité envisagée : n'exécuter le cadrage que lorsque l'écran est en portrait et qu'une partie est en cours.
- Implémentation : écouteur `matchMedia('(max-width: 600px) and (orientation: portrait)')` qui démarre ou arrête le minuteur ; arrêt dans `endLayer` et au retour à l'écran titre.
- Fichiers potentiellement concernés : `src/core/GameApp.ts`.
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : autonomie de batterie sur mobile, à mesurer.
- Risque de régression : faible. Le comportement en portrait doit rester identique : à tester sur 390x844 (T-LYING-01 et captures).
- Statut : PROPOSÉ — bug confirmé à l'exécution en Phase 3 ; correction à planifier en Phase 5. Preuve : 144 appels `matchMedia` en 10 s en paysage 1366×768 (`audit/screenshots/the-lying-game/logs/targeted-T-LYING-01.json`).

### IDEA-the-lying-game-002 — Protéger l'écriture d'une nouvelle partie

- Priorité : P1
- Problème actuel : `beginNewGame` efface la sauvegarde avant d'écrire la nouvelle, sans `try` (`src/core/GameApp.ts` 410–419). Voir BUG-the-lying-game-002.
- Fonctionnalité envisagée : écriture de la nouvelle sauvegarde avant suppression de l'ancienne, ou restauration de l'ancienne en cas d'échec.
- Implémentation : réordonner les appels (`saveRun` avant `clearRun`) et entourer l'écriture d'un `try`.
- Fichiers potentiellement concernés : `src/core/GameApp.ts`.
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : aucune progression perdue en cas d'échec d'écriture.
- Risque de régression : faible. À tester avec T-LYING-02.
- Statut : PROPOSÉ — bug confirmé à l'exécution en Phase 3 ; correction à planifier en Phase 5. Preuve : ancienne sauvegarde `the-lying-game.save.v1` supprimée et erreur non gérée levée pendant l'échec d'écriture simulé (`audit/screenshots/the-lying-game/logs/targeted-T-LYING-02.json`).

### IDEA-the-lying-game-003 — Réduire le poids du bundle

- Priorité : P2
- Problème actuel : `docs/assets/index-LqqsWSX1.js` pèse 1 436,64 Ko (398 Ko gzip) : Phaser est inclus dans le même fichier (`vite build`, Phase 2).
- Fonctionnalité envisagée : découper le code (chargement différé des niveaux et des écrans secondaires).
- Implémentation : imports dynamiques de `src/content/levels/chapter*.ts` ; vérifier que Phaser reste dans un chunk séparé.
- Fichiers potentiellement concernés : `vite.config.ts`, `src/main.ts`, `src/content/levels/*.ts`.
- Difficulté : ÉLEVÉE.
- Bénéfice joueur attendu : premier affichage plus rapide sur réseau mobile, à mesurer.
- Risque de régression : moyen (chargement asynchrone pendant la partie). À tester sur les 5 chapitres.
- Statut : PROPOSÉ.

---

## Doomscroll Dungeon (`doomscroll-dungeon`)

### IDEA-doomscroll-dungeon-001 — Assainir la graine au chargement de la sauvegarde

- Priorité : P1
- Problème actuel : `validateRun` (`src/storage/save.ts` 178) n'impose aucun jeu de caractères sur `seed`, et la graine est affichée en HTML (`src/ui/overlays.ts` 576, `src/ui/results.ts` 42). Voir BUG-doomscroll-dungeon-001 (CONFIRMÉ en phase 3 : HTML injecté, T-DOOM-01).
- Fonctionnalité envisagée : appliquer `sanitizeSeed` au chargement et utiliser `textContent` pour l'affichage.
- Implémentation : dans `validateRun`, `seed: sanitizeSeed(obj.seed)` ; si résultat vide, refuser la partie.
- Fichiers potentiellement concernés : `src/storage/save.ts`, `src/ui/overlays.ts`, `src/ui/results.ts`.
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : défense en profondeur, sans effet visible.
- Risque de régression : une ancienne partie avec une graine non conforme serait refusée (cas improbable : les graines sont déjà assainies à la création). À confirmer par T-DOOM-01.
- Statut : PROPOSÉ.

### IDEA-doomscroll-dungeon-002 — Mettre à jour les outils de développement vulnérables

- Priorité : P1
- Problème actuel : `npm audit` signale 6 vulnérabilités dans les devDependencies (`vitest` 2.1.9, `vite` 6, `esbuild`, `tinypool`, `@vitest/mocker`). Aucune n'est présente dans `dist/assets/*.js` (vérifié : 0 occurrence). Voir `TECHNICAL-AUDIT-doomscroll-dungeon.md`, section 3.
- Fonctionnalité envisagée : monter vitest et vite à des versions corrigées, après vérification que les 35 tests passent.
- Implémentation : sur une branche dédiée, `npm install -D vitest@latest vite@latest` puis `npm test` et `npm run build`. Ne pas utiliser `npm audit fix --force` sans relecture (changement majeur).
- Fichiers potentiellement concernés : `package.json`, `package-lock.json`.
- Difficulté : MOYENNE (changement majeur de vitest, possibles adaptations des tests).
- Bénéfice joueur attendu : aucun effet direct ; réduction du risque sur le poste du développeur (serveur de développement).
- Risque de régression : moyen sur les tests ; nul sur le bundle joué si le build reste identique (à comparer par hash).
- Statut : PROPOSÉ.

### IDEA-doomscroll-dungeon-003 — Mesurer le coût du fil avant toute optimisation

- Priorité : P2
- Problème actuel : le fil recrée ses articles par `innerHTML` (`src/ui/feed.ts` 125–359). Aucune mesure n'existe encore.
- Fonctionnalité envisagée : aucune fonctionnalité nouvelle ; mesure de FPS et de mémoire pendant une partie.
- Implémentation : résultats du test en ligne (sous-agent doomscroll) ; optimiser seulement si la mesure le justifie.
- Fichiers potentiellement concernés : `src/ui/feed.ts`.
- Difficulté : MOYENNE si une optimisation est nécessaire.
- Bénéfice joueur attendu : à déterminer.
- Risque de régression : moyen (animations du fil).
- Statut : PROPOSÉ (conditionné aux mesures de Phase 3).

---

## AVANT LE SILENCE (`avant-le-silence`)

### IDEA-avant-le-silence-001 — Copie de secours avant réécriture d'une sauvegarde illisible

- Priorité : P0
- Problème actuel : `SaveManager.read()` renvoie `null` sur un JSON invalide (`js/storage/save-manager.js` 33–38), et la première écriture remplace la valeur brute (`js/core/state-manager.js` 74). Voir BUG-avant-le-silence-001.
- Fonctionnalité envisagée : conserver la valeur illisible sous une clé de secours avant la première écriture.
- Implémentation : dans `read()`, en cas d'erreur, écrire la valeur brute sous `avant-le-silence.save.v1.backup.<horodatage>`.
- Fichiers potentiellement concernés : `js/storage/save-manager.js`, `js/core/state-manager.js`.
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : une progression abîmée peut être récupérée.
- Risque de régression : faible (la lecture normale n'est pas modifiée).
- Statut : PROPOSÉ.

### IDEA-avant-le-silence-002 — Initialiser un dépôt Git avant toute correction

- Priorité : P0
- Problème actuel : aucun dépôt (`TECHNICAL-AUDIT-avant-le-silence.md`, section 7). Aucune correction ne peut être tracée ni annulée proprement.
- Fonctionnalité envisagée : dépôt local avec un commit initial documenté, sans modifier le contenu.
- Implémentation : `git init`, fichier `.gitignore` (node_modules, logs), commit initial « baseline audit ». Décision à confirmer (D-010).
- Fichiers potentiellement concernés : racine du projet (nouveaux fichiers `.git/`, `.gitignore`).
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : historique, retour arrière, publication plus sûre.
- Risque de régression : aucun pour le jeu.
- Statut : PROPOSÉ (en attente de D-010).

### IDEA-avant-le-silence-003 — Tests JavaScript pour la validation et les migrations

- Priorité : P1
- Problème actuel : seul un script Python valide le contenu (`tests/validate_content.py`). `save-validator.js` (filtrage) et `migrations.js` (non lu) n'ont pas de test unitaire.
- Fonctionnalité envisagée : tests `node:test` sur `validateSave` et `migrate`.
- Implémentation : `tests/save.test.js` avec quelques sauvegardes forgées (champs inconnus, types incorrects, chemins de route invalides).
- Fichiers potentiellement concernés : nouveau `tests/`, `js/storage/save-validator.js`.
- Difficulté : MOYENNE.
- Bénéfice joueur attendu : moins de régressions de progression entre versions.
- Risque de régression : aucun pour le jeu.
- Statut : PROPOSÉ.

### IDEA-avant-le-silence-004 — Points du CHANGELOG hors périmètre technique

- Priorité : P2 (information)
- Problème actuel : le CHANGELOG (lignes 8–18) liste des travaux qui ne sont pas techniques : relecture historique indépendante, autorisations de reproduction des archives, vérification des références judiciaires.
- Fonctionnalité envisagée : aucune. Ces points relèvent de l'auteur et de relecteurs.
- Implémentation : hors périmètre de cet audit.
- Fichiers potentiellement concernés : `CHANGELOG.md`, `SOURCES.md`, `ASSET_RIGHTS.md`.
- Difficulté : non évaluée.
- Bénéfice joueur attendu : fiabilité historique du contenu.
- Risque de régression : aucun.
- Statut : ABANDONNÉ pour cette mission (justification : nature non technique). À reprendre par l'auteur.

---

## Quand les notes s'effacent (`quand-les-notes-seffacent`)

### IDEA-quand-les-notes-seffacent-001 — Dépôt Git, README et numéro de version

- Priorité : P0
- Problème actuel : aucun dépôt, aucun README, aucune version, aucune documentation des contrôles (`TECHNICAL-AUDIT-quand-les-notes-seffacent.md`, sections 1 et 7).
- Fonctionnalité envisagée : dépôt Git avec commit initial, README (lancement local, contrôles réels : Espace/Entrée, Échap, M, clics piano), version dans `index.html`.
- Implémentation : `git init`, `README.md` rédigé à partir de `assets/js/main.js` et `assets/js/game/engine.js`, pas de changement de gameplay.
- Fichiers potentiellement concernés : racine du projet, `index.html`.
- Difficulté : FAIBLE.
- Bénéfice joueur attendu : projet suivi et compréhensible.
- Risque de régression : aucun.
- Statut : PROPOSÉ (en attente de D-010).

### IDEA-quand-les-notes-seffacent-002 — Tests automatisés sur les données de récit et d'énigmes

- Priorité : P1
- Problème actuel : aucun test. Les données (`assets/js/story/day1.js` à `day7.js`, `assets/js/data/puzzles.js`) ne sont pas validées par programme.
- Fonctionnalité envisagée : vérification que chaque jour a un point d'entrée, que chaque énigme a une solution atteignable, que les identifiants de notes sont cohérents.
- Implémentation : tests `node:test` s'appuyant sur les modules ES.
- Fichiers potentiellement concernés : `assets/js/story/*.js`, `assets/js/data/puzzles.js`.
- Difficulté : MOYENNE.
- Bénéfice joueur attendu : moins de blocages dans les énigmes.
- Risque de régression : aucun.
- Statut : PROPOSÉ.

---

## Transversal

### IDEA-global-001 — Politique commune de sauvegarde

- Priorité : P1
- Problème actuel : trois stratégies différentes : copie de secours (the-lying-game, `backupCorruptedRun`), aucune copie (neon-jackpot, avant-le-silence), repli mémoire (tous). Voir BUGS.md.
- Fonctionnalité envisagée : même règle dans les cinq jeux : version explicite, copie de secours avant migration ou réécriture, validation des types.
- Implémentation : reprise du modèle de `the-lying-game` (`SaveManager.loadRun`, `backupCorruptedRun`).
- Fichiers potentiellement concernés : fichiers de sauvegarde des 4 jeux concernés.
- Difficulté : MOYENNE.
- Bénéfice joueur attendu : aucune progression perdue sans trace.
- Risque de régression : moyen (migrations à écrire avec soin).
- Statut : PROPOSÉ.
