# HUB-TEST-REPORT — CASIFOX GAME HUB

Date : 2026-11-12. Phase 9. Tests Playwright/Chromium 158.0.8127.18 en headless, serveur statique local `audit-tools/serve.js` (port 8200).

Preuves : `audit/screenshots/hub/` (captures et `logs/hub-result.json`).

## Résultats locaux

| ID | Test | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| LOAD | Chargement de l'accueil | 0 erreur JS, 0 HTTP ≥ 400, 0 échec réseau | TEST RÉUSSI | `01-accueil.png` |
| CARDS | Cinq cartes de jeux | 5 cartes | TEST RÉUSSI | `01-accueil.png` |
| SEARCH | Recherche par nom (5 requêtes) | 1 résultat exact pour chaque jeu | TEST RÉUSSI | `logs/hub-result.json` |
| FILTERS | Filtres par genre | 6 puces ; « Tous » = 5, chaque genre = 1 | TEST RÉUSSI | `logs/hub-result.json` |
| SORTS | Tris note décroissante, croissante, A–Z, récent | 4/4 dans l'ordre attendu | TEST RÉUSSI | `logs/hub-result.json` |
| CARD-LINKS | Liens « Jouer » et « Fiche » | 5/5 ; « Jouer » pointe vers l'URL publique réelle | TEST RÉUSSI | `logs/hub-result.json` |
| RANKING | Classement visible et trié | 5 lignes ; 82, 81, 80, 75, 72 | TEST RÉUSSI | `01-accueil.png` |
| NAV | Navigation et ancres | 5 ancres, aucune manquante | TEST RÉUSSI | — |
| IMAGES | Chargement des images | 7/7 chargées | TEST RÉUSSI | — |
| META | Titre, description, Open Graph, favicon, canonical | Tous présents | TEST RÉUSSI | `logs/hub-result.json` |
| DETAILS | Cinq fiches détaillées | 5/5 : titre, note, lien jeu, dépôt, 0 erreur | TEST RÉUSSI | `02-fiche.png` |
| 404 | Page d'erreur | « Page introuvable », 0 erreur | TEST RÉUSSI | `03-404.png` |
| INTERNAL-LINKS | Liens internes de l'accueil | 12/12 en HTTP 200 | TEST RÉUSSI | `logs/hub-result.json` |
| KEYBOARD | Premier focus clavier | Lien d'évitement `skip-link` | TEST RÉUSSI | — |
| VP-1920 | Débordement horizontal | Aucun (scrollWidth 1920) | TEST RÉUSSI | `vp-1920.png` |
| VP-1366 | Débordement horizontal | Aucun (scrollWidth 1366) | TEST RÉUSSI | `vp-1366.png` |
| VP-768 | Débordement horizontal | Aucun (scrollWidth 768) | TEST RÉUSSI | `vp-768.png` |
| VP-390 | Mobile tactile, débordement | Aucun (scrollWidth 390) | TEST RÉUSSI | `vp-390.png` |
| REDUCED-MOTION | `prefers-reduced-motion` | 0 bloc encore masqué | TEST RÉUSSI | — |

## Corrections faites pendant les tests

1. **Débordement horizontal de 11 px** à 1920 et 1366 : le cadre incliné du hero élargissait sa boîte de 11 px. Corrigé par `max-width: calc(100% - 30px)` et une rotation réduite à 0,8°. Re-test : `scrollWidth` = largeur de fenêtre, aucun élément au-delà.
2. **Attente de test erronée** sur le tri « plus récent » : trois jeux partagent la date du 12/11 ; l'ordre d'origine place The Lying Game en tête. Le test attend désormais ce résultat réel.
3. **Test clavier** : le focus partait d'une puce déjà active. Le test recharge la page avant `Tab` ; le lien d'évitement est bien le premier focus.
4. **Liens manquants** : `README.md`, `AUDIT.md` et `audit/FINAL-REPORT.md` ont été créés ; les 12 liens internes répondent en 200.

## Limites

- Test en headless, sans lecteur d'écran ni appareil réel.
- La page 404 est testée en accès direct (`/404.html`), pas par une URL inexistante servie par GitHub Pages. Le comportement public est vérifié après publication.
- Les notes et textes sont vérifiés par présence, pas par relecture orthographique automatique.
- Aucun test de charge ni de performance réseau réelle.

## Après publication

Section complétée après le déploiement sur GitHub Pages (URL, SHA du commit, résultats du même test sur l'URL publique).
