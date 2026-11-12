# TEST-REPORT — AVANT LE SILENCE (`avant-le-silence`)

Date : 2026-11-12. Phase 3 et test de publication (phase 8). Exécution directe par scripts Playwright (`audit-tools/tests/flows.js`).

## Environnement

- Navigateur : Chromium 158.0.8127.18, Playwright 1.65.0, mode headless, rendu logiciel.
- URL testée : **https://casifox.github.io/avant-le-silence/** (publique, publiée le 2026-11-12).
- Le test local antérieur (port 8101) est supersédé par ce test public.
- Preuves : `audit/screenshots/avant-le-silence/` et `logs/`.

## Résultats

| ID | Test | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| LOAD | Chargement initial 1920x1080, 5 s | 0 erreur JS, 0 HTTP ≥ 400, 0 échec réseau, 0 avertissement console | TEST RÉUSSI | `01-accueil.png` |
| VERSION | `index.html` servi comparé au HEAD du dépôt | SHA256 identiques (`E435FAC1DA7D58FB…`) | TEST RÉUSSI | `result.json` |
| START | Bouton de démarrage identifié par son libellé | « Commencer le parcours » cliqué ; texte visible 631 → 808 caractères | TEST RÉUSSI | `02-apres-demarrage.png` |
| PLAY-30S | Parcours de 30 s par boutons de progression (heuristique par libellé) | 6 clics (« J'ai compris, continuer » 1, « Commencer le parcours » 1, « Ouvrir » 1, « Espace suivant » 3) ; texte 808 → 1264 ; 0 erreur JS | TEST RÉUSSI | `03-jeu-15s.png`, `04-jeu-30s.png` |
| PAUSE | Menu ou pause | Aucun bouton de menu ou de pause visible | TEST NON EFFECTUÉ | — |
| PERSIST | Clé `avant-le-silence.save.v1` avant et après rechargement | Présente avant et après | TEST RÉUSSI | `result.json` |
| VP-1920 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1920.png` |
| VP-1366 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-1366.png` |
| VP-768 | Débordement horizontal | Aucun | TEST RÉUSSI | `vp-768.png` |
| VP-390 | Mobile tactile, débordement | Aucun | TEST RÉUSSI | `vp-390.png` |

## Tests ciblés

| ID | Avant correction (12/11, matin) | Après correction (12/11, URL publique) | Statut final |
|---|---|---|---|
| T-AVANT-01 | TEST ÉCHOUÉ : sauvegarde illisible remplacée sans copie | TEST RÉUSSI : copie `avant-le-silence.save.v1.backup.1794475018606` (commit `84bdec4`) | **TEST RÉUSSI** |

Preuves : `logs/targeted-T-AVANT-01.json`, `t-avant-01.png`.

## Métriques (mesurées sur l'URL publique, indicatives)

- DOMContentLoaded : 194 ms ; load : 194 ms.
- Requêtes : 98 ; poids transféré : 866 782 octets.
- FPS au repos (10 s) : moyenne 60,6 ; minimum 60. Indicatif (headless). Le jeu n'a pas de boucle de jeu continue.
- Mémoire JS : 10 000 000 octets (arrondi par Chromium).

## Erreurs console et réseau

- Aucune erreur ni avertissement console, aucune requête en échec, aucune réponse HTTP ≥ 400.
- Aucune erreur JavaScript pendant le parcours.

## Limites

- Parcours heuristique de 30 s : les boutons sont choisis par leur libellé ; il ne couvre pas tout le contenu.
- Pas de contrôle de pause ou de menu identifié.
- BUG-avant-le-silence-001 (MAJEURE) : corrigé le 12/11 (commit `84bdec4`), copie de secours vérifiée sur l'URL publique.
- La validation de contenu reste le script Python (phase 2) ; aucun test automatisé de contenu côté navigateur.
