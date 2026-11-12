# TEST-REPORT — Quand les notes s'effacent (`quand-les-notes-seffacent`)

Date : 2026-11-12. Phase 3 et test de publication (phase 8). Exécution directe par scripts Playwright (`audit-tools/tests/flows.js`).

## Environnement

- Navigateur : Chromium 158.0.8127.18, Playwright 1.65.0, mode headless, rendu logiciel.
- URL testée : **https://casifox.github.io/quand-les-notes-seffacent/** (publique, publiée le 2026-11-12).
- Le test local antérieur (port 8102) est supersédé par ce test public.
- Preuves : `audit/screenshots/quand-les-notes-seffacent/` et `logs/`.

## Changement du projet après la phase 2

Le projet a été modifié après l'audit. État actuel vérifié : version **1.0.0** (`package.json`), `README.md`, `LICENSE`, `package.json`, `tests/validate.mjs`. `npm test` → **OK, 1 669 vérifications réussies**. Les constats de la phase 2 (absence de README, de version et de tests) portent sur l'état antérieur ; le rapport technique porte une note en tête.

## Résultats

| ID | Test | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| LOAD | Chargement initial 1920x1080, 5 s | 0 erreur JS, 0 HTTP ≥ 400, 0 échec réseau, 0 avertissement console | TEST RÉUSSI | `01-accueil.png` |
| VERSION | `index.html` servi comparé au HEAD du dépôt | SHA256 identiques (`459CEC97490CD915…`) | TEST RÉUSSI | `result.json` |
| START | `#btn-new-game` puis `[data-slot="0"][data-action="new"]` | Carnet 1 ouvert via « Commencer ici » | TEST RÉUSSI | `02-partie-demarree.png` |
| PLAY-30S | Espace (1 s), `#btn-next` (4 s), menu à 20 s | 0 erreur JS ; texte visible 194 → 256 caractères | TEST RÉUSSI | `03-jeu-15s.png`, `05-jeu-30s.png` |
| PAUSE | Échap ouvre le menu, Échap le ferme | Menu (`dialog[open]`) ouvert puis fermé | TEST RÉUSSI | `04-menu.png` |
| PERSIST | Clé `qlnse.save.v1.*` et bouton `#btn-continue` après rechargement | Clé `qlnse.save.v1.0` présente ; `#btn-continue` actif | TEST RÉUSSI | `result.json` |
| VP-1920 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1920.png` |
| VP-1366 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1366.png` |
| VP-768 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-768.png` |
| VP-390 | Mobile tactile, débordement | Aucun | TEST RÉUSSI | `vp-390.png` |

## Métriques (mesurées sur l'URL publique, indicatives)

- DOMContentLoaded : 3 480 ms ; load : 3 636 ms (réseau public, première visite).
- Requêtes : 81 ; poids transféré : 1 048 280 octets.
- FPS (10 s, après la partie) : moyenne 11,1 ; minimum 10. **Indicatif** : headless, rendu logiciel.
- Mémoire JS : 10 000 000 octets (arrondi par Chromium).

## Erreurs console et réseau

- Aucune erreur ni avertissement console, aucune requête en échec, aucune réponse HTTP ≥ 400.
- Aucune erreur JavaScript pendant le parcours.

## Limites

- Mesure de progression faible : la longueur du texte visible n'a augmenté que de 62 caractères sur 30 s. Elle ne prouve pas à elle seule une progression narrative complète.
- Aucun bug confirmé dans les parties lues (voir l'audit, section 5).
- FPS et mémoire indicatifs (headless).
- Les interactions du piano n'ont pas été testées.
