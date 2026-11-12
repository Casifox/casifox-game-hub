# TEST-REPORT — Neon Jackpot (`incremental`)

Date : 2026-11-12. Phase 3. Exécution directe par scripts Playwright (`audit-tools/tests/flows.js` et `targeted.js`), sans sous-agent (D-021).

## Environnement

- Navigateur : Chromium 158.0.8127.18, Playwright 1.65.0, mode headless, rendu logiciel.
- URL publique testée : https://casifox.github.io/neon-jackpot/ (dépôt `Casifox/neon-jackpot`).
- URL locale pour les tests ciblés : dossier original `C:\Users\Noah\Documents\incremental` servi en lecture seule sur `http://127.0.0.1:8104/`.
- Preuves : `audit/screenshots/incremental/` et `audit/screenshots/incremental/logs/`.

## Résultats : parcours en ligne

| ID | Test | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| LOAD | Chargement initial 1920x1080, 5 s | 0 erreur JS, 0 HTTP ≥ 400, 0 échec réseau, 0 avertissement console | TEST RÉUSSI | `01-accueil.png` |
| ACCUEIL | Fenêtre « Bienvenue au Neon Jackpot » (premier lancement) | Visible sur profil neuf ; fermée par « Jouer au Plinko » | TEST RÉUSSI | `01b-bienvenue.png` |
| START | Ouverture du Plinko (`location.hash = 'plinko'`), `#plinko-drop` visible | Bouton présent | TEST RÉUSSI | `02-plinko.png` |
| PLAY-30S | Clic sur `#plinko-drop` toutes les 2 s, 30 s | Compteur `#plinko-plays` : 0 → 8 ; 0 erreur JS | TEST RÉUSSI | `03-partie-15s.png`, `04-partie-30s.png` |
| PAUSE | Aucun contrôle de pause recherché ni testé | Sans objet dans ce parcours | TEST NON EFFECTUÉ | — |
| PERSIST | Jetons avant et après rechargement | 252,01794594918763 avant et après | TEST RÉUSSI | `result.json` |
| VERSION | `src/js/state.js` servi comparé au blob HEAD | SHA256 identique (`31DFF08A…`) | TEST RÉUSSI | `result.json` |
| VERSION-2 | `src/data/bundle.js` servi comparé au blob HEAD | SHA256 identique (`C3E2BA22…`) | TEST RÉUSSI | `result.json` |
| VP-1920 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1920.png` |
| VP-1366 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1366.png` |
| VP-768 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-768.png` |
| VP-390 | Mobile tactile, débordement | Aucun | TEST RÉUSSI | `vp-390.png` |

## Résultats : tests ciblés (avant correction)

| ID | Bug | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| T-INCR-01 | BUG-incremental-001 (sauvegarde corrompue) | La valeur `{` (JSON invalide) est remplacée par l'état par défaut dans les premières secondes d'ouverture ; aucune copie de secours | TEST ÉCHOUÉ | `t-incr-01.png`, `logs/targeted-T-INCR-01.json` |
| T-INCR-02 | BUG-incremental-002 (champs importés non échappés) | Une entrée de journal forgée (`icon = <img src=x onerror="window.__xss=1">`) est chargée, rendue, et **le script s'exécute** (`window.__xss = 1`) | TEST ÉCHOUÉ | `t-incr-02.png`, `logs/targeted-T-INCR-02.json` |
| T-INCR-03 | BUG-incremental-003 (`__proto__` dans `deepMerge`) | Pollution **locale** de l'objet fusionné confirmée (`merged.polluted === 1`) ; pollution **globale** non reproduite (`({}).polluted` indéfini) | TEST PARTIEL | `logs/targeted-T-INCR-03.json` |

## Après correction (12/11, URL publique)

Commit `154a5b1`. Les trois tests ont été relancés sur https://casifox.github.io/neon-jackpot/ :

| ID | Résultat | Statut |
|---|---|---|
| T-INCR-01 | copie de secours `neon_jackpot_save_v1.backup.1794475018824` présente | **TEST RÉUSSI** |
| T-INCR-02 | entrée importée chargée, aucun élément injecté, `window.__xss` indéfini | **TEST RÉUSSI** |
| T-INCR-03 | aucune pollution (locale ni globale) | **TEST RÉUSSI** |

Le parcours public complet repasse (chargement, Plinko, partie de 30 s, sauvegarde, 4 viewports) ; le SHA256 de `state.js` servi est identique au HEAD (`83335A3B…`). Preuves : `logs/targeted-T-INCR-*.json`, `logs/result.json`.

## Méthode des tests ciblés

- Pour injecter une sauvegarde puis recharger, la page d'origine est neutralisée (`App.state.save` et `saveSoon` remplacés par des fonctions vides), puis fermée sans `beforeunload`. Sans cela, le gestionnaire `visibilitychange` (`main.js` 145–149) réécrit l'état courant avant le chargement. Ce point a été identifié en exécutant T-INCR-02 une première fois : le test initial était invalide. Les premiers résultats de T-INCR-01 et T-INCR-02 ont été écartés pour cette raison.
- T-INCR-02 injecte la sauvegarde dans `localStorage`, et non par le sélecteur de fichier de l'interface. Le chemin de lecture et de rendu est le même (`State.load` → `deepMerge` → `pages.js`). La fenêtre de sélection de fichier n'a pas été automatisée.

## Métriques (mesurées)

- DOMContentLoaded : 981 ms ; load : 1 141 ms.
- Requêtes : 56 ; poids transféré : 1 639 522 octets.
- FPS (10 s, pendant des clics répétés sur `#plinko-drop`) : moyenne 5,8 ; minimum 4. **Indicatif** : headless, rendu logiciel, clics concurrents.
- Mémoire JS : 10 000 000 octets (arrondi par Chromium).

## Erreurs console et réseau

- Aucune erreur ni avertissement console au chargement (en ligne).
- Aucune requête en échec, aucune réponse HTTP ≥ 400.
- Aucune erreur JavaScript pendant le parcours en ligne.
- Les erreurs des tests ciblés sont consignées dans leurs fichiers JSON (aucune erreur JS, sauf la simulation de T-LYING-02, sans rapport avec ce jeu).

## Limites

- Pause non testée : aucun contrôle de pause n'a été recherché.
- Import par fichier non automatisé (voir méthode).
- FPS et mémoire indicatifs uniquement.
- Aucun test de version publique au-delà des deux fichiers comparés.
