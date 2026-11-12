# TECHNICAL-AUDIT — AVANT LE SILENCE (`avant-le-silence`)

Date : 2026-11-12. Phase 2 (statuts mis à jour en phase 3 : voir `BUGS.md` et `TEST-REPORT-avant-le-silence.md`). Périmètre : code source de `C:\Users\Noah\Documents\AVANT LE SILENCE\` (lecture seule). Vérifications exécutées sur la copie `audit-tools\workspaces\avant-le-silence\`.

## 1. Identification

- Nom affiché : « AVANT LE SILENCE — Une maison. Des vies. Une mémoire. » (`index.html`, ligne 6). Description (ligne 7) : expérience narrative documentaire sur la Maison d'Izieu (1943–1944).
- Version : 0.8.0, date 2026-11-11 (`CHANGELOG.md`, ligne 20). Le CHANGELOG indique que la version 1.0.0 n'est pas atteinte (lignes 8–18 : relecture historique, autorisations de reproduction, références judiciaires, tests multi-navigateurs et lecteurs d'écran).
- Dépôt : **aucun**. Pas de `.git`. Aucun dépôt `avant-le-silence` sur le compte `Casifox`.
- URL publique : **aucune**. Le README (lignes 67 et 319) cite `https://<utilisateur>.github.io/avant-le-silence/` : placeholder, non utilisé.
- Stack : HTML, CSS, JavaScript natif (modules ES `import`/`export`). Pas de `package.json`, pas de build, pas de dépendance.

## 2. Architecture

| Zone | Fichiers | Rôle | Lecture |
|---|---|---|---|
| Entrée | `index.html`, `js/main.js` (640 o) | Chargement | `js/main.js` **non lu** |
| Cœur | `js/core/application.js` (13,8 Ko), `state-manager.js`, `navigation.js`, `event-manager.js` | Démarrage, état, navigation, événements | `application.js` 149, 177–178 (grep) ; `state-manager.js` 18–53, 74 |
| Sauvegarde | `js/storage/save-manager.js` (76 lignes), `save-validator.js`, `migrations.js` | Lecture, écriture, validation, migrations | `save-manager.js` **intégral** ; `save-validator.js` 1–90 ; `migrations.js` non lu |
| Systèmes | `js/systems/` (6 fichiers : audio, chronologie, documents, exploration, carnet, progression) | Logique | non lus ; `audio-system.js` 42–46, 70, 174 (grep) |
| Interface | `js/ui/` (10 fichiers) | Rendu | non lus ; `modal.js` 21, 84, 199–200 (grep) |
| Utilitaires | `js/utils/` (4 fichiers) | Aides, accessibilité | `accessibility.js` 75 (grep) |
| Contenu | `content/fr/*.json` (7 fichiers) | Chapitres, documents, personnes, chronologie, sources, glossaire, récits | validé par script (section 3) |
| Tests | `tests/validate_content.py`, `content-validation.md`, `manual-qa.md`, `viewport-*.html`, `fixtures/save-v1.json` | Validation | script exécuté |

Clé de sauvegarde : `avant-le-silence.save.v1` (`save-manager.js` ligne 8). Clé de test : `avant-le-silence.test` (ligne 9).

## 3. Vérifications exécutées

| Vérification | Résultat |
|---|---|
| Syntaxe de 28 fichiers `.js` (copie `.mjs`, `node --check`) | **28/28 OK** |
| `python tests/validate_content.py` (copie de travail, Python 3.12.10) | **Aucune erreur de référence ou de schéma**. Décompte : 4 chapitres, 18 scènes, 16 documents, 8 personnes, 13 événements, 9 sources, 16 termes de glossaire |
| `innerHTML` | **0 occurrence** (le DOM est construit par API) |
| `eval`, `new Function` | 0 occurrence |
| `target="_blank"` / `noopener` | 2 et 2 (comptage) : chaque lien externe ouvert dans un nouvel onglet porte `noopener` |

Note : le script de validation ne contrôle que le contenu. Il ne teste ni l'interface ni la sauvegarde.

## 4. Sauvegarde

- `SaveManager` (`save-manager.js`) : test de disponibilité (18–26) ; lecture `read()` (28–39) ; écriture `write()` (41–53) avec repli mémoire (`this.memory`, ligne 43) ; effacement `clear()` (55–63).
- Lecture : `JSON.parse` dans `try/catch` (33–38). En cas d'échec, `read()` renvoie `null` et enregistre l'erreur (ligne 36).
- Validation : `validateSave` (`save-validator.js` 65 et suivantes). Filtrage des chaînes (13), chemin de route forcé au préfixe `#/` (89–90), préférences bornées (`clamp01`, 20–24).
- Chargement (`state-manager.js` 22–48) : `read()` → `migrate()` → `validateSave()`.
- Écriture : `persist` appelle `this.save.write(this.state)` (`state-manager.js` 74).

## 5. Problèmes

### BUG-avant-le-silence-001 — Sauvegarde illisible écrasée sans copie de secours (MAJEURE, PROBABLE)
Chemin de code vérifié : `read()` renvoie `null` si le JSON est invalide (`save-manager.js` 33–38). `load()` ne fait que signaler un avertissement (`state-manager.js` 24–30) et laisse la progression par défaut. La première écriture (ligne 74) remplace la valeur brute. Le joueur est averti (« Une nouvelle progression a été commencée »), mais la donnée illisible n'est pas conservée. Test de vérification : T-AVANT-01 (phase 3).

### Examinés sans défaut
- Validation de la sauvegarde : la liste blanche et le filtrage des types sont en place (`save-validator.js` 12–24, 84–90).
- Écouteurs `document` : `modal.js` 21 (global, posé une fois au chargement du module) et `application.js` 149, 177–178 (`once: true` pour le démarrage). Pas de répétition observée.
- Liens : `_blank` toujours accompagné de `noopener`.
- Contenu : toutes les références (chapitres, scènes, documents, personnes, événements, sources) sont cohérentes (script).

## 6. Performance statique

- Aucun minuteur (`setInterval` 0 occurrence) : bon signe pour l'autonomie de la batterie.
- 7 `setTimeout` et 1 `clearTimeout` (comptage) : non analysés un par un.
- Pas de dépendance externe chargée : pas de coût réseau identifié à l'audit statique.

## 7. Limites de l'audit

- **Pas de dépôt Git** : aucune correction ne peut être tracée sans initialisation (DECISIONS.md D-010, à trancher en phase 5).
- Non lus : `js/main.js`, `js/systems/*`, `js/ui/*`, `migrations.js`, la plus grande partie de `application.js`, `navigation.js` et `event-manager.js`.
- Pas de test navigateur encore (phase 3). Le jeu n'est pas publié : tests en local via serveur statique.
- Pas de tests JavaScript automatisés dans le projet.
