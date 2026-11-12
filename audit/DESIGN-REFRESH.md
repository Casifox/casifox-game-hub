# DESIGN REFRESH — refonte visuelle des cinq jeux

Date : 2026-11-12 (après la mission d'audit).
Demande de l'utilisateur : « analyse tous les jeux, refais le design parce qu'on dirait que c'est fait par IA, puis publie ».

## Méthode

1. Captures réelles des cinq sites en ligne (1366×768 et 390×844), écrans d'accueil et écrans internes, avec Playwright/Chromium.
2. Lecture du code réel (CSS, HTML, JS) pour chaque jeu : variables, composants, polices, rayons, couleurs codées en dur.
3. Diagnostic par jeu, puis direction artistique propre à chaque univers.
4. Implémentation sur une branche `design/refresh-v2` par dépôt, sans toucher au gameplay.
5. Vérification : build/tests existants, captures après, erreurs console, débordement horizontal mobile.
6. Publication sur `main` puis vérification des URLs GitHub Pages.

Les captures avant/après sont dans `C:\Users\Noah\AppData\Local\Temp\opencode\design-audit\` (hors dépôt, fichiers de travail).

## Diagnostic d'ensemble

Le point commun des écrans qui « font IA » n'est pas la qualité graphique mais un vocabulaire de template :
dégradés violet/rose/cyan, verre dépoli, rayons de 18 à 34 px, ombres douces, emojis en guise d'icônes,
polices Google par défaut, et un seul type de carte arrondie répété partout.

À l'inverse, les jeux qui avaient déjà une identité (AVANT LE SILENCE, Quand les notes s'effacent,
The Lying Game, Doomscroll Dungeon) souffraient surtout d'incohérences : composants génériques posés
sur une direction forte, hiérarchie typographique floue, zones vides, contrastes insuffisants.

Principe appliqué : **préserver l'identité qui fonctionne, remplacer le vocabulaire de template**.
Aucun jeu n'a été réécrit ; le gameplay, les textes et les données sont inchangés.

---

## 1. Neon Jackpot (`incremental`)

### Diagnostic

- Palette violette `#07070f` / `#ff4fd8` / `#8b5cf6` / `#22d3ee`, dégradés partout.
- Rayons de 8 à 34 px, panneaux en verre dépoli (`backdrop-filter`), ombres douces.
- Emojis utilisés comme icônes de navigation, de monnaie, de succès et d'améliorations.
- Police Google « Outfit » (donc dépendance réseau) et graisses 900.
- Écrans de jeu encore plus chargés : cartes violettes, boutons dégradés, tableau de roulette violet.

### Direction : « salle de jeu, programme imprimé »

Papier crème, encre, laiton, feutrine verte et vermillon. L'interface emprunte au programme de salle
et aux plaques émaillées : filets d'1 px, rayons de 2 px, ombres dures décalées, typographie Didone
pour les titres, monospace pour les chiffres, plaques typographiques à la place des emojis de navigation.

- Nouvelle couche `src/css/theme.css` chargée après l'existant : aucun composant d'origine supprimé.
- Polices système uniquement : plus aucune requête vers Google Fonts.
- Navigation : plaques `PL`, `BJ`, `RO`… au lieu des emojis.
- Cartes de jeux : numéros de programme `01` à `11`.
- Tableau de bord : affiche crème, 7 sur feutrine, boutons vermillon à ombre dure.
- Jeux : plaque de titre sans icône, onglets soulignés, roulette et Plinko recolorés (laiton/patine/vermillon).
- Logo SVG et image sociale (`assets/og.png`, régénérée par `tools/make-og.py`) alignés.
- Version portée à 2.0.0.

### Vérifications

- 0 erreur console sur l'accueil, le tableau de bord, Plinko, Quêtes, Succès, Boutique, Statistiques, Réglages.
- Débordement horizontal mobile : 0 px (390×844).
- 9 jeux internes ouverts avec déblocage forcé pour contrôle visuel : 0 erreur.
- `node --check` OK sur les 10 fichiers JS modifiés.

### Limites

- Les icônes d'améliorations et de succès restent des emojis (désaturés) : les remplacer imposerait
  un jeu d'icônes complet dans les données.
- Les captures ne remplacent pas un test sur appareil réel.

---

## 2. AVANT LE SILENCE

### Diagnostic

- Prologue collé à gauche, moitié droite vide ; cartes à ombres douces et rayons génériques.
- Hiérarchie typographique insuffisante entre surtitre, titre et corps ; boutons « SaaS ».
- Certaines pages très aérées sans intention de composition.

### Direction : « catalogue d'exposition »

- Palette ivoire/encre conservée mais densifiée : hairlines 1 px, aucun dégradé décoratif, coins 2–3 px.
- Échelle typographique : surtitre mono 11 px, titre serif, corps 17 px, légendes 12–13 px, chiffres tabulaires.
- Chapitres numérotés `N° 01` → `N° 04`, scènes indexées, filets de catalogue.
- Prologue rééquilibré : lecture à gauche, colonne latérale avec planche illustrée, légende, repères et note d'archive.
- Avertissement de contenu en deux colonnes avec rail de catalogue.
- Boutons rectangulaires à bord 1,5 px, inversion au survol, focus visible.

### Vérifications

- `python tests/validate_content.py` : 4 chapitres, 18 scènes, 16 documents, 8 personnes, 13 événements,
  9 sources, 16 termes, aucune erreur.
- `node --check` OK sur les JS modifiés.
- Playwright : 12 écrans parcourus, fiche documentaire ouverte/fermée, atelier et conclusion vérifiés
  avec un état de test injecté ; 0 erreur console, 0 requête échouée, 0 requête externe.
- Débordement horizontal : aucun à 1366×768, 390×844, 360×740, ni en taille de texte « très grand ».
- Contrastes calculés : 14,65:1 (encre/ivoire), 9,99:1 (encre douce), 5,78:1 (encre faible), 15,71:1 (papier/encre).

### Limites

- Chromium headless uniquement ; pas de lecteur d'écran ni d'appareil réel.
- À 1366×768, l'accueil dépasse de 12 px (léger défilement), tout le contenu restant visible.

---

## 3. The Lying Game

### Diagnostic

- Direction « terminal/protocole » forte mais contrastes faibles, corps petits, grille irrégulière.
- Cartes de chapitres et panneaux encore génériques ; cyan néon omniprésent.

### Direction : « dossier d'observation classifié »

- Bandeau de champs PARTICIPANT / PROTOCOLE / CLASSIFICATION / VERSION, référence `RÉF. TLG-047`.
- Navigation numérotée `01 CHAPITRES` → `04 OPTIONS`, filets 1 px, coins 0–2 px, tampon ambre.
- Palette : papier/encre claire, cyan réservé aux états actifs, magenta aux anomalies, ambre aux avertissements.
- Corps de lecture 15–17 px, interligne 1,55–1,7, compteurs tabulaires.
- Chapitres transformés en onglets de dossier avec numéro, statut réel et barre de progression ;
  la logique de déverrouillage est inchangée.
- Glitchs plus rares et bornés (160 ms), `prefers-reduced-motion`, cibles tactiles ≥ 44 px.

### Vérifications

- `npm test` : 4 fichiers, 24 tests passés. `npm run typecheck` : aucune erreur.
- `npm run build` : 45 modules, build réussi (CSS 89,79 kB, JS 1 437,82 kB — identique fonctionnellement).
- Playwright : 0 erreur console/pageerror ; aucun débordement à 1366, 390 et 320 px.
- Chapitres : 5 chapitres, 10 salles, statuts `EN COURS` / `VERROUILLÉ` conformes à la sauvegarde.

### Limites

- Chromium headless uniquement. Galerie, crédits et écran de fin restylés mais non capturés.
- Parcours vérifié dans la première salle, pas jusqu'à une fin.

---

## 4. Doomscroll Dungeon

### Diagnostic

- Identité « néon sale » présente, mais modales, menus et panneaux restaient des cartes sombres
  arrondies (18–26 px) avec ombres douces et accents violets : un template SaaS posé sur le jeu.
- Le tutoriel, la préparation de descente et les résultats ne racontaient pas la satire.

### Direction : « fanzine photocopié contre application glossy »

- L'application fictive (le fil, le téléphone) reste sombre et lisible : c'est le monde du jeu.
- Tout l'emballage devient imprimé : papier `#f1e8d5`, encre `#12100e`, rose spot `#ff2e63`,
  lime acide `#c9f24a`, traits 2 px, ombres dures `4px 4px 0`, trame halftone, scotch et tampons.
- Display condensée uppercase (`Haettenschweiler` → `Arial Narrow` → `Impact`), corps Segoe UI,
  données Consolas. Un accent dominant par écran.
- HUD papier autour du fil, dock d'actions en tampons, rapport de descente imprimé, modales en feuilles.
- Logo fanzine plat, confettis alignés sur les encres spot.

### Vérifications

- `npm test` : 5 fichiers, 35 tests passés.
- `npm run build` : 34 modules, build réussi (CSS 117,06 kB, JS 156,14 kB).
- Playwright sur `dist/` : 0 erreur console ; aucun débordement à 1366, 390 et 320 px ;
  bouton d'action 62×72 px à 320 px ; `prefers-reduced-motion` effectif ; focus clavier 3 px.

### Limites

- La modale de préparation défile verticalement sous 390 px (voulu, pour atteindre « Annuler »).
- Le menu reste scrollable d'environ 20 px à 1366×768 pour afficher le pied de page.
- Chromium headless uniquement ; pas d'audit axe complet.

---

## 5. Quand les notes s'effacent

### Diagnostic

- La direction « carnet / nuit au bord de la mer » était déjà lisible (palette nuit bleu-vert, papier crème, or, corail), mais les composants restaient génériques : boîte de dialogue en bandeau sombre plein largeur, choix encadrés comme des boutons, cartes de carnets très vides, piano aux libellés minuscules.
- La hiérarchie des scènes et du piano était faible : HUD de 9–10 px, métadonnées en sans-serif, peu de repères de lecture.
- Le verre dépoli (`backdrop-filter`) et les dégradés décoratifs des panneaux participaient au vocabulaire de template.

### Direction : « carnet relié, encre et nuit »

- Palette conservée ; papier rendu présent par une texture SVG légère, des filets 1 px, des coins 2–3 px et des ombres imprimées décalées. Aucun dégradé décoratif ajouté, aucun `backdrop-filter`.
- Échelle stable : serif pour la narration et les titres, sans pour l'interface, mono pour les métadonnées (jours, heures, sauvegarde, pagination).
- Scène : la boîte de dialogue devient une page de papier de 50 rem (texte limité à 64 ch, interligne 1.65), liseré or, filet de pied et folio réel `page / total`. Les choix deviennent des entrées de carnet numérotées, séparées par des pointillés, avec un focus en barre marginale.
- Carnets : cartes à lignes réglées, pagination `01 / 03`, signet or, métadonnées mono, boutons à filet intérieur. Le panneau reprend une reliure à double filet.
- Piano : partition sur feuille crème avec notes et libellés lisibles, touches plates à états hover/active/focus nets, légende des touches sur les touches blanches et noires, contrastes renforcés. Sur mobile, clavier de 44 px par touche avec défilement horizontal et cadrage automatique sur la plage de la phrase (la plage complète reste accessible).
- Détails d'artisanat : numéro de jour en filigrane sur la carte de chapitre, pagination des dialogues et des carnets, petites capitales sur le colophon, séparateurs typographiques. Le numéro de page est fourni par le moteur au rendu (aucune donnée d'histoire modifiée).

### Vérifications

- `npm test` : `OK — 1669 vérifications réussies.`
- Playwright/Chromium, 1366×768 et 390×844 : 0 erreur console, 0 `pageerror`, 0 requête échouée. Captures dans `C:\Users\Noah\AppData\Local\Temp\opencode\design-notes\after\`.
- Parcours vérifiés : accueil, carnets, carte de chapitre, dialogue, choix (sélection réelle, `pageIndex` 4, `d1Reason = asked`), piano (séquence jouée, modale de souvenir), carnet de souvenirs, réglages, menu, écran de fin.
- Mobile : aucun débordement horizontal (`scrollWidth = clientWidth = 390`) ; boutons HUD 44 px ; touches de piano 44,06 × 194 px ; défilement horizontal du clavier fonctionnel (`scrollWidth` 616, `clientWidth` 375).
- Contrastes mesurés : texte de dialogue 14,22:1 ; indication de dialogue 5,55:1 ; outil de dialogue 4,90:1. Focus visible vérifié (anneau or sur fond nuit, anneau encre sur papier). `prefers-reduced-motion` effectif.
- Commit `843137d` sur la branche `design/refresh-v2`. Aucun push.

### Limites

- Chromium headless uniquement ; pas de test sur appareil réel ni de lecteur d'écran.
- Le clavier mobile affiche environ 8,5 touches à la fois (44 px chacune) : compromis assumé pour garder la plage complète et une cible tactile correcte. Le cadrage initial suit la phrase ; l'utilisateur peut faire défiler.
- Les captures de travail sont hors dépôt ; elles ne sont pas versionnées.

---

## Publication

Les cinq refontes ont été fusionnées sur `main` (fast-forward depuis `design/refresh-v2`) puis poussées.
Déploiement GitHub Pages, vérifié par requête HTTP avec marqueur de version et capture du site en ligne.

| Jeu | Commit `main` | URL | Vérification |
|---|---|---|---|
| Neon Jackpot | `a9b83c1` | https://casifox.github.io/neon-jackpot/ | HTTP 200, `theme.css?v=2.0.0` servi |
| AVANT LE SILENCE | `28d801a` | https://casifox.github.io/avant-le-silence/ | HTTP 200, `?v=0.8.0-d2` servi |
| The Lying Game | `d2f99f6` | https://casifox.github.io/the-lying-game/ | HTTP 200, `index-s80NlTo8.css` servi (workflow Actions) |
| Doomscroll Dungeon | `868b54e` | https://casifox.github.io/doomscroll-dungeon/ | HTTP 200, `index-Ci9ZtDel.css` servi (workflow Actions) |
| Quand les notes s'effacent | `843137d` | https://casifox.github.io/quand-les-notes-seffacent/ | HTTP 200, `data-folio` présent dans le CSS servi |

Vignettes du hub (`assets/images/*.png`, 1920×1080) régénérées depuis les versions refondues ;
`hero.png` reprend la nouvelle accueil de Doomscroll Dungeon.

Aucune URL, aucun texte de jeu, aucune donnée de sauvegarde n'a changé.

