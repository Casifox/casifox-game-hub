# TEST-REPORT — The Lying Game (`the-lying-game`)

Date : 2026-11-12. Phase 3 et test de publication (phase 8). Exécution directe par scripts Playwright (`audit-tools/tests/flows.js`).

## Environnement

- Navigateur : Chromium 158.0.8127.18, Playwright 1.65.0, mode headless, rendu logiciel.
- URL testée : **https://casifox.github.io/the-lying-game/** (publique, déployée par le workflow `pages.yml` le 2026-11-12).
- Le test local antérieur (port 8103, dossier `docs/`) est supersédé par ce test public.
- Preuves : `audit/screenshots/the-lying-game/` et `logs/`.

## Résultats

| ID | Test | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| LOAD | Chargement initial 1920x1080, 5 s | 0 erreur JS, 0 HTTP ≥ 400, 0 échec réseau, 0 avertissement console | TEST RÉUSSI | `01-accueil.png` |
| VERSION | `index.html` servi comparé au HEAD du dépôt (`docs/index.html`) | SHA256 identiques (`65BE29E34F0223C7…`, après correction) | TEST RÉUSSI | `result.json` |
| START | Bouton `#home-start` | « 01 COMMENCER L'EXPÉRIENCE… » cliqué ; aucune confirmation demandée | TEST RÉUSSI | `02-debut.png` |
| PROLOGUE | Passer le prologue (CONTINUER ou Entrée) | 6 actions ; canvas Phaser présent | TEST RÉUSSI | — |
| PLAY-30S | Touches Z, Q, S, D (zqsd par défaut) et Entrée, 30 s | 0 erreur JS ; texte visible 443 → 334 caractères | TEST RÉUSSI | `03-jeu-15s.png`, `05-jeu-30s.png` |
| PAUSE | Échap, superposition `.overlay-layer` | Superposition visible | TEST RÉUSSI | `04-pause.png` |
| PERSIST | Clé `the-lying-game.save.v1` après rechargement | Présente avant et après | TEST RÉUSSI | `result.json` |
| VP-1920 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1920.png` |
| VP-1366 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1366.png` |
| VP-768 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-768.png` |
| VP-390 | Mobile tactile, débordement | Aucun | TEST RÉUSSI | `vp-390.png` |

## Tests ciblés

| ID | Avant correction (12/11, matin) | Après correction (12/11, URL publique) | Statut final |
|---|---|---|---|
| T-LYING-01 | TEST ÉCHOUÉ : 144 appels `matchMedia` en 10 s en paysage | TEST RÉUSSI : 0 appel (commit `1ac3495`) | **TEST RÉUSSI** |
| T-LYING-02 | TEST ÉCHOUÉ : sauvegarde effacée avant écriture | TEST RÉUSSI : sauvegarde conservée (commit `1ac3495`) | **TEST RÉUSSI** |

Preuves : `logs/targeted-T-LYING-01.json`, `logs/targeted-T-LYING-02.json`.

## Métriques (mesurées sur l'URL publique, indicatives)

- DOMContentLoaded : 3 198 ms ; load : 3 235 ms (réseau public, première visite).
- Requêtes : 10 ; poids transféré : 3 126 210 octets (dont le bundle JS d'environ 1,44 Mo et les polices).
- FPS (10 s, pendant la partie) : moyenne 14 ; minimum 12. **Indicatif** : headless, rendu logiciel, Phaser.
- Mémoire JS : 14 300 000 octets (arrondi par Chromium).

## Erreurs console et réseau

- Aucune erreur ni avertissement console, aucune requête en échec, aucune réponse HTTP ≥ 400.
- Aucune erreur JavaScript pendant le parcours.

## Limites

- Les touches de déplacement n'avaient pas été identifiées par grep en phase 2. Le parcours utilise les touches par défaut (zqsd) ; leur effet sur le personnage n'a pas été mesuré, seulement le contenu visible et les erreurs.
- Le test de pause repose sur la présence d'une superposition `.overlay-layer`, pas sur son contenu.
- BUG-the-lying-game-001 et BUG-the-lying-game-002 : corrigés le 12/11 (commit `1ac3495`), vérifiés sur l'URL publique.
- Le test T-LYING-02 simule une erreur de stockage : il démontre le comportement, pas la fréquence réelle.
