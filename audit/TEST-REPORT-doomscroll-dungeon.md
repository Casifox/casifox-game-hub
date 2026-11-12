# TEST-REPORT — Doomscroll Dungeon (`doomscroll-dungeon`)

Date : 2026-11-12. Phase 3. Exécution directe par scripts Playwright (`audit-tools/tests/flows.js` et `targeted.js`), sans sous-agent (D-021).

## Environnement

- Navigateur : Chromium 158.0.8127.18, Playwright 1.65.0, mode headless, rendu logiciel.
- Système : Windows (PowerShell 5.1.26100.9818).
- URL testée : https://casifox.github.io/doomscroll-dungeon/ (publique, PUBLIÉ au contrôle).
- Preuves : `audit/screenshots/doomscroll-dungeon/` (captures) et `audit/screenshots/doomscroll-dungeon/logs/` (`result.json`, `targeted-T-DOOM-01.json`).

## Résultats

| ID | Test | Résultat observé | Statut | Preuve |
|---|---|---|---|---|
| LOAD | Chargement initial 1920x1080, 5 s | 0 erreur JS, 0 réponse HTTP ≥ 400, 0 requête en échec, 0 erreur ou avertissement console | TEST RÉUSSI | `01-accueil.png` |
| TUTORIEL | Tutoriel affiché au premier lancement, puis passé | Fenêtre « SURVIS AU FIL » visible sur profil neuf ; « Passer le tutoriel » cliqué | TEST RÉUSSI | `02a-tutoriel.png` |
| START | `[data-menu="new"]` puis `[data-launch]` | 6 cartes `article.post` après démarrage | TEST RÉUSSI | `02-partie-demarree.png` |
| PLAY-30S | 30 s : Espace (1 s), X (3 s), Maj+Flèche bas (4 s), C (5 s), S (7 s) | 0 erreur JS ; texte visible 2073 → 2188 caractères | TEST RÉUSSI | `03-partie-15s.png`, `04-partie-30s.png` |
| PAUSE | Échap, puis `[data-pause-resume]` | Pause ouverte ; fermée après reprise | TEST RÉUSSI | `05-pause.png` |
| PERSIST | Clé `doomscroll.v1.run` après rechargement | Présente avant et après | TEST RÉUSSI | `result.json` |
| VERSION | Asset JS servi comparé au build local | `index-D7lIcBne.js` identique (après correction) | TEST RÉUSSI | `result.json` |
| VP-1920 | Débordement horizontal | Aucun (scrollWidth 1920) | TEST RÉUSSI | `vp-1920.png` |
| VP-1366 | Débordement horizontal | Aucun (scrollWidth 1366) | TEST RÉUSSI | `vp-1366.png` |
| VP-768 | Débordement horizontal | Aucun (scrollWidth 768) | TEST RÉUSSI | `vp-768.png` |
| VP-390 | Mobile tactile, débordement | Aucun (scrollWidth 390) | TEST RÉUSSI | `vp-390.png` |
| T-DOOM-01 | Graine forgée dans la sauvegarde (BUG-doomscroll-dungeon-001) | Avant correction : élément `<img>` dans le DOM. Après correction (`1b2d05b`) : graine assainie, aucun élément injecté | TEST RÉUSSI (après correction) | `t-doom-01.png`, `logs/targeted-T-DOOM-01.json` |

## Après correction (12/11, URL publique)

Commit `1b2d05b`. T-DOOM-01 relancé sur https://casifox.github.io/doomscroll-dungeon/ : **TEST RÉUSSI** — la graine forgée est assainie (`sanitizeSeed`), aucun élément HTML n'est injecté (`seedNodeHtml` sans `<img>`). `npm test` passe 35/35 et le build est reconstruit (`index-D7lIcBne.js`), identique à l'asset servi. Workflow Pages `43189876482` : succès.

## Métriques (mesurées)

- Temps jusqu'au DOMContentLoaded : 516 ms ; jusqu'au load : 522 ms.
- Requêtes : 6 ; poids transféré : 534 702 octets.
- FPS (10 s, `requestAnimationFrame`, pendant la partie) : moyenne 6,6 ; minimum 5. **Indicatif** : Chromium headless en rendu logiciel, non représentatif d'un bureau ou d'un mobile réel.
- Mémoire JS : 10 000 000 octets. Valeur arrondie par Chromium, non exploitable au-delà de l'ordre de grandeur.

## Erreurs console et réseau

- Aucune erreur ni avertissement console au chargement.
- Aucune requête en échec, aucune réponse HTTP ≥ 400.
- Aucune erreur JavaScript pendant la partie.

## Limites

- Parcours de 30 s seulement, sans partie complète ni fin de partie.
- Le test d'affichage tactile (390 px) vérifie le débordement, pas l'interaction tactile.
- T-DOOM-01 : l'injection HTML est établie, mais l'exécution du script n'a pas eu lieu dans les conditions testées. Aucune hypothèse n'est retenue sur la cause.
- Concordance de version : comparaison du nom de l'asset, pas d'un hash complet.
