# DECISIONS

Journal des décisions techniques non triviales. Une entrée = date, contexte, options, choix, justification.

## D-001 — Démarrage de la mission à minuit

- Date : 2026-11-12, 00:00:04 (+01:00).
- Contexte : l'utilisateur a demandé de lancer le prompt à 00h00 et de ne pas éteindre l'ordinateur tant que tout n'est pas terminé.
- Options : attendre une relance manuelle ou armer un minuteur.
- Choix : minuteur PowerShell en arrière-plan (shell `sh_1cc6e9870001Gl2zphtj7wKB5C`), qui vérifie l'heure réelle toutes les 30 secondes jusqu'à minuit.
- Justification : vérifier l'heure réelle (et non une durée fixe) reste exact si l'ordinateur passe en veille.

## D-002 — Périmètre : 5 jeux retenus, autres dossiers exclus

- Date : 2026-11-12.
- Contexte : dossiers de `C:\Users\Noah\Documents\`, liste fournie par l'utilisateur.
- Retenus, car contenu de jeu vérifié (fichiers de jeu, logique de jeu) : AVANT LE SILENCE, doomscroll-dungeon, QUAND LES NOTES S'EFFACENT, the-lying-game, incremental.
- Exclus :
  - `Site itnerenet\Buxy de la gare` : site web d'un restaurant (pages HTML, menu, mentions légales). Pas un jeu.
  - `WebToon` : 2 fichiers PDF. Pas un jeu.
  - `My Games` : sous-dossiers `Rocket League` et `Replays` (données du jeu commercial). Pas un projet.
  - `League of Legends` : dossier vide. Pas un projet.
  - `CASIFOX-GAME-HUB` : dossier du hub, vide au démarrage.
  - `WindowsPowerShell` : dossier système PowerShell. Non analysé en détail, hors projet.
- Justification : le prompt demande de ne pas confondre un jeu avec un autre projet. Aucun dossier exclu n'a été supprimé ni modifié.

## D-003 — Slugs des jeux

- Date : 2026-11-12.
- Choix : `avant-le-silence`, `doomscroll-dungeon`, `quand-les-notes-seffacent`, `the-lying-game`, `incremental`.
- Justification : kebab-case, apostrophes retirées. Les noms affichés seront confirmés par le code (titre HTML, README).

## D-004 — Outillage de test isolé

- Date : 2026-11-12.
- Choix : `audit-tools/package.json` dédié. Playwright installé uniquement là. Chromium seul via `npx playwright install chromium`.
- Justification : contrainte disque et contrainte de dépendances (règle 21).

## D-005 — AGENTS.md

- Date : 2026-11-12.
- Choix : fichier créé à `C:\Users\Noah\AGENTS.md` (répertoire de lancement d'OpenCode) et copie dans `CASIFOX-GAME-HUB\AGENTS.md`. Les deux fichiers ont le même contenu et incluent la règle d'arrêt de l'ordinateur donnée par l'utilisateur.
- Justification : demandé par le prompt (section 4.4).

## D-006 — Dossier du hub existant

- Date : 2026-11-12.
- Constat : `C:\Users\Noah\Documents\CASIFOX-GAME-HUB\` existait avant la mission, sans aucun fichier.
- Choix : réutiliser ce dossier. Ne rien supprimer.

## D-007 — Règle d'arrêt de l'ordinateur

- Date : 2026-11-12.
- Règle de l'utilisateur : ne pas éteindre tant que les 5 jeux ne sont pas testés et que les pages ne sont pas vérifiées en ligne. Si tout est vérifié, arrêt autorisé.
- Choix : arrêt uniquement si ces deux conditions sont remplies, avec `shutdown /s /t 60`. Sinon, l'ordinateur reste allumé et le rapport le signale.

## D-008 — Modèle d'exécution

- Date : 2026-11-12.
- Constat : le prompt recommande un modèle plus puissant (type Sonnet ou supérieur) pour les phases 0 à 6. Le modèle actif est `claude-haiku-5-5` (fournisseur `opencode-go`).
- Choix : continuer avec ce modèle. Compenser par des relectures de fichiers ciblées, des `grep -n` pour les preuves et des tests réels. La limite est indiquée dans `ENVIRONMENT.md` et sera rappelée dans `FINAL-REPORT.md`.

## D-009 — Compte GitHub et correspondance des dépôts

- Date : 2026-11-12.
- Constat : `gh auth status` donne le compte actif `Casifox`. Le compte a des dépôts publics avec des URLs GitHub Pages (`doomscroll-dungeon` et `neon-jackpot` entre autres). Aucun dépôt nommé `the-lying-game` ni `incremental` n'apparaît.
- Choix : la correspondance dossier local ↔ dépôt GitHub sera établie uniquement par `git remote -v` ou par preuve dans le code. Pas de devinette.
- Statut : à confirmer en phase 1.

## D-010 — Dépôt Git pour les dossiers sans `.git`

- Date : 2026-11-12.
- Constat : `AVANT LE SILENCE` et `QUAND LES NOTES S'EFFACENT` n'ont pas de dépôt Git.
- Choix prévu : en phase 5, initialiser un dépôt propre (commit initial documenté), sans rien écraser ni déplacer. Décision définitive après l'inventaire.
- Statut : en attente.

## D-011 — Correspondance `incremental` ↔ `neon-jackpot`

- Date : 2026-11-12.
- Constat : `git remote -v` dans `incremental` donne `https://github.com/Casifox/neon-jackpot.git`. Le titre affiché est « Neon Jackpot ».
- Choix : le dossier garde le slug `incremental` (nom fourni par l'utilisateur). Le nom public est « Neon Jackpot ». L'URL du hub sera `https://casifox.github.io/neon-jackpot/`, celle qui répond HTTP 200, et non une URL déduite du slug.

## D-012 — URLs placeholders ignorées

- Date : 2026-11-12.
- Constat : les README de `avant-le-silence` (`<utilisateur>`) et de `the-lying-game` (`votre-utilisateur`) contiennent des URLs modèles.
- Choix : elles ne sont jamais utilisées comme liens. Seules les URLs fournies par l'API GitHub (`homepageUrl`, `html_url` de Pages) et vérifiées en HTTP sont retenues.

## D-013 — Copies de travail pour build et tests

- Date : 2026-11-12.
- Contexte : `npm ci`, `npm test`, `vite build` et `node tools/build-data.js` écrivent dans le dossier du projet (`node_modules/`, `dist/`, `bundle.js`).
- Choix : ces commandes s'exécutent dans des copies de travail `audit-tools\workspaces\<slug>\`. Clone local (`git clone`) pour les dépôts Git ; copie (`Copy-Item`) pour les autres. Les dossiers originaux ne sont pas modifiés.
- Justification : règles 5 (ne détruis jamais les projets originaux) et 21 (dépendances hors des projets de jeux).

## D-014 — Dossiers de build (`dist/`, `docs/`)

- Date : 2026-11-12.
- Constat : `doomscroll-dungeon\dist\` et `the-lying-game\docs\` contiennent des fichiers générés.
- Choix : ils sont listés et comptés. Ils sont analysés comme sorties de build, avec vérification de cohérence avec les sources quand c'est pertinent. Le code source reste le périmètre principal.

## D-015 — Profondeur de l'audit en phase 2

- Date : 2026-11-12.
- Contexte : 5 projets, 331 fichiers au total (code, données, ressources, hors `.git`). Modèle `claude-haiku-5-5` (D-008).
- Choix, pour chaque jeu :
  1. build et tests réels sur la copie de travail, quand c'est possible ;
  2. syntaxe JavaScript contrôlée par `node --check` ;
  3. recherches `grep -n` systématiques sur les motifs de risque (écouteurs, minuteurs, `innerHTML`, `eval`, `JSON.parse`, `localStorage`) ;
  4. lecture complète des modules de sauvegarde et de boucle de jeu.
  Chaque audit indique les fichiers lus partiellement.
- Justification : règle 23 (profondeur vérifiée plutôt qu'exhaustivité inventée).

## D-016 — Pages GitHub à re-vérifier en phase 3

- Date : 2026-11-12.
- Constat : `incremental` était en statut `building` au moment du contrôle.
- Choix : en phase 3, comparer le HTML servi au HTML du commit local (hash) avant tout test fonctionnel. Le résultat sera consigné dans le test report.

## D-017 — Phase 2 : lectures partielles documentées

- Date : 2026-11-12.
- Constat : les cinq projets dépassent la capacité de lecture intégrale d'une session (plus de 330 fichiers, plusieurs modules de 50 à 70 Ko). Chaque audit distingue ce qui a été lu (lignes citées), ce qui a été vérifié par commande (build, tests, syntaxe, comptage), et ce qui n'a pas été lu.
- Choix : Gate 2 déclarée PASSÉE AVEC RÉSERVES. Les zones non lues sont listées dans la section « Limites » de chaque audit.
- Justification : règles 2, 12 et 23 (ne pas prétendre avoir lu ce qui ne l'a pas été).

## D-018 — Phase 3 : méthode des tests

- Date : 2026-11-12.
- Tests publics : `doomscroll-dungeon` (https://casifox.github.io/doomscroll-dungeon/) et `neon-jackpot` (https://casifox.github.io/neon-jackpot/). Vérification de concordance : nom de l'asset JS servi comparé à celui du build local (`dist/`, `index-CDX8AEgw.js`).
- Tests locaux : `avant-le-silence`, `quand-les-notes-seffacent`, `the-lying-game` (dossier `docs/` committé), et `incremental` pour les tests ciblés T-INCR-*. Les serveurs locaux servent les dossiers originaux en lecture seule (`audit-tools/serve.js`, ports 8101 à 8104).
- Les tests modifient uniquement le `localStorage` du navigateur de test. Aucun fichier de projet n'est écrit.
- Chaque test reçoit un statut parmi TEST RÉUSSI, TEST ÉCHOUÉ, TEST PARTIEL, TEST NON EFFECTUÉ (règle 8.7).

## D-019 — Phase 3 : exécution par sous-agents

- Date : 2026-11-12.
- Constat : la Phase 3 couvre 5 jeux et une série de tests ciblés. La fenêtre de contexte d'une seule session ne suffit pas.
- Choix : quatre sous-agents en parallèle, chacun avec un périmètre disjoint : (1) doomscroll-dungeon en ligne ; (2) neon-jackpot en ligne et tests T-INCR ; (3) avant-le-silence et quand-les-notes-seffacent en local ; (4) the-lying-game en local et tests T-LYING. Chaque sous-agent écrit son rapport dans `audit/TEST-REPORT-<slug>.md` et ses captures dans `audit/screenshots/<slug>/`. L'orchestrateur vérifie les rapports avant de les consolider.
- Justification : isolation des contextes, parallélisme, traçabilité par fichiers.

## D-020 — Phase 5 : corrections, conditions

- Date : 2026-11-12.
- Choix : aucune correction n'est poussée sur `main` sans tests verts et sans trace dans `CHANGELOG.md`. Les correctifs sont préparés sur une branche `audit/2026-11-12-<slug>` par projet Git. Les projets sans Git (`avant-le-silence`, `quand-les-notes-seffacent`) ne sont pas modifiés sans décision initiale de D-010.
- Justification : règles 5, 17, 18 et 19 ; et la règle de l'utilisateur (ne pas toucher aux projets sans contrôle).

## D-021 — Phase 3 exécutée directement, sans sous-agent

- Date : 2026-11-12.
- Constat : les quatre sous-agents lancés en Phase 3 ont été interrompus par « OpenCode Go usage limit reached ». Aucun de leurs résultats n'a été retenu.
- Choix : exécution directe et séquentielle des scripts Playwright (`audit-tools/tests/flows.js`, `targeted.js`, `lib.js`). Un JSON brut par test (`audit/screenshots/<slug>/logs/`). Les `TEST-REPORT-<slug>.md` sont rédigés à partir de ces JSON et des sorties console.
- Justification : moins de tours de modèle, traçabilité directe des preuves.

## D-022 — Méthode d'injection de sauvegarde (tests ciblés)

- Date : 2026-11-12.
- Constat : la fermeture d'une page déclenche `visibilitychange` (sauvegarde du jeu, `main.js` 145–149 pour Neon Jackpot). Un rechargement après `localStorage.setItem` réécrit donc la valeur injectée avant le chargement. Les premiers résultats de T-INCR-01 et T-INCR-02 étaient invalides pour cette raison.
- Choix : neutraliser `App.state.save` et `saveSoon` avant fermeture ; fermer la page avec `page.close({ runBeforeUnload: false })` ; ouvrir une nouvelle page dans le même contexte.
- Justification : isoler la lecture de la sauvegarde corrompue ou forgée, sans écriture parasite.

## D-023 — Gravité de BUG-incremental-002 : CRITIQUE

- Date : 2026-11-12.
- Constat : XSS confirmé à l'exécution (T-INCR-02, `window.__xss === 1`). L'origine `https://casifox.github.io` est partagée par tous les projets GitHub Pages du compte `Casifox` ; le `localStorage` est partagé entre ces sites.
- Choix : gravité CRITIQUE (faille de sécurité exploitable, portée étendue à l'origine partagée). Précondition retenue : la victime importe volontairement un fichier forgé.
- Justification : règle de l'échelle de gravité (« faille de sécurité exploitable »).

## D-024 — Phase 5 (corrections) et publication non effectuées dans cette session

- Date : 2026-11-12.
- Constat : les tests de Phase 3 sont terminés. Les corrections (Phase 5), la notation (Phase 6), le hub (Phase 7), la publication (Phase 8) et les tests finaux (Phase 9) ne sont pas commencés.
- Choix : ne pas corriger ni publier sans relecture des rapports de test par l'utilisateur. Les corrections prioritaires sont listées dans `SESSION-STATE.md`.
- Justification : règles 17, 18 et 24, et la règle de l'utilisateur sur l'arrêt de l'ordinateur (les conditions ne sont pas remplies).

## D-025 — Publication des trois jeux non publiés

- Date : 2026-11-12.
- Demande explicite de l'utilisateur : publier AVANT LE SILENCE, Quand les notes s'effacent et The Lying Game sur GitHub, les tester, et fournir les liens.
- Dépôts créés (publics) : `Casifox/avant-le-silence`, `Casifox/quand-les-notes-seffacent`, `Casifox/the-lying-game`.
- AVANT LE SILENCE et Quand les notes s'effacent : dépôt Git initialisé (`main`), identité `Casifox <235862355+Casifox@users.noreply.github.com>`, commit initial « Baseline: import initial pour publication GitHub Pages (audit 2026-11-12) ». URLs placeholder des README corrigées. Un `README.md` et un `.nojekyll` ont été ajoutés à Quand les notes s'effacent (le projet n'en avait pas lors de l'audit).
- The Lying Game : dépôt existant, remote ajouté, URL placeholder du README corrigée. Publication par le workflow `pages.yml` (GitHub Actions), pas par le dossier `docs` en mode legacy.
- Pages : `legacy` (branche `main`, racine) pour les deux sites statiques ; `workflow` pour The Lying Game. Aucun envoi forcé.
- Tests : parcours Playwright sur les trois URLs publiques. Tous les tests passent ; le `index.html` servi est identique au blob HEAD (SHA256) pour les trois. Détail dans `PUBLICATION.md` et les `TEST-REPORT-*.md`.
- Les bugs ouverts (`BUGS.md`) ne sont pas corrigés par la publication. Ils sont signalés dans `PUBLICATION.md` et dans les rapports de test.

## D-026 — Projet Quand les notes s'effacent modifié après l'audit

- Date : 2026-11-12.
- Constat : fichiers ajoutés ou modifiés après la phase 2 (`LICENSE`, `robots.txt`, `.gitignore`, `tests/validate.mjs`, `assets/art/social-card.png`, `index.html`, `package.json`), avec des dates du 12/11. Le projet est passé en version 1.0.0 et dispose d'un README et d'une suite de validation.
- Choix : publier l'état actuel, relancer `npm test` (1 669 vérifications réussies) et le parcours navigateur sur cet état. Ajouter une note en tête de l'inventaire et du rapport technique, et mettre à jour le rapport de test.
- Justification : ne pas publier ni noter un état périmé ; conserver la trace de l'écart entre l'audit et l'état publié.
