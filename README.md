# CASIFOX GAME HUB

Portail statique des cinq jeux CASIFOX. Aucun backend, aucune dépendance de build, aucun traceur.

**En ligne :** https://casifox.github.io/casifox-game-hub/

## Les cinq jeux

| Jeu | URL | Note |
|---|---|---:|
| Doomscroll Dungeon | https://casifox.github.io/doomscroll-dungeon/ | 82/100 |
| The Lying Game | https://casifox.github.io/the-lying-game/ | 81/100 |
| Neon Jackpot (`incremental`) | https://casifox.github.io/neon-jackpot/ | 80/100 |
| Quand les notes s'effacent | https://casifox.github.io/quand-les-notes-seffacent/ | 75/100 |
| AVANT LE SILENCE | https://casifox.github.io/avant-le-silence/ | 72/100 |

Les jeux restent indépendants, dans leurs propres dépôts. Le hub ne les héberge pas.

## Lancer en local

Le hub est entièrement statique. Depuis la racine du dépôt :

```
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000/`.

Alternative sans Python, avec l'outil d'audit déjà présent :

```
node audit-tools/serve.js . 8000
```

## Structure

```
index.html                 accueil (hero, sélection, catalogue, classement, nouveautés, univers)
games/<slug>/index.html    une fiche par jeu
404.html                   page d'erreur
css/style.css              styles, responsive, mouvement réduit
js/games.js                données réelles des cinq jeux
js/app.js                  cartes, recherche, filtres, tris, classement, fiches
js/navigation.js           en-tête collant, menu mobile, section active
assets/images/             captures réelles des jeux
assets/fonts/              Space Grotesk et JetBrains Mono (SIL OFL, licences incluses)
audit/                     rapports d'audit, captures et preuves
audit-tools/               outils de test Playwright (non publiés dans le site)
```

## Données

Les notes, genres, commandes, forces et faiblesses proviennent de `audit/INVENTORY.md`, `audit/SCORES.md`, `audit/BUGS.md` et `audit/TEST-REPORT-*.md`. Aucune statistique, aucun avis et aucun nombre de joueurs ne sont simulés.

## Tests

Depuis `audit-tools/` :

```
node tests/hub-test.js
```

Le script vérifie les cartes, la recherche, les filtres, les tris, les liens, le classement, les cinq fiches, la 404, les images, les métadonnées, le clavier, quatre tailles d'écran, le mouvement réduit et les liens internes. Résultats : `audit/HUB-TEST-REPORT.md`.

## Publication GitHub Pages

Le site est publié depuis la branche `main`, à la racine. `.nojekyll` désactive Jekyll. Après un push :

```
gh api repos/Casifox/casifox-game-hub/pages
```

L'URL publique est vérifiée et re-testée après propagation.

## Accessibilité

- Lien d'évitement, focus visible, ordre de tabulation naturel.
- Contrastes élevés, textes alternatifs sur les captures.
- `prefers-reduced-motion` respecté : les révélations au scroll sont désactivées.
- Navigation clavier et lecteurs d'écran : structure `header` / `main` / `footer`, titres hiérarchisés.

## Licence

Le code du hub est fourni tel quel pour le projet CASIFOX. Les polices sont sous SIL Open Font License (voir `assets/fonts/`). Les captures appartiennent à leurs jeux respectifs.
