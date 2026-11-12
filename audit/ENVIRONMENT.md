# ENVIRONMENT — Phase 0

Mission démarrée le 2026-11-12 à 00:00:04 (+01:00), par le minuteur armé à 22:05:55 le 11 novembre.

## Versions (sorties réelles des commandes)

| Outil | Commande | Sortie |
|---|---|---|
| Node.js | `node --version` | `v24.22.1` |
| npm | `npm --version` | `11.19.1` |
| Git | `git --version` | `git version 2.56.0.windows.4` |
| GitHub CLI | `gh --version` | `gh version 2.103.3 (2026-10-26)` |
| PowerShell | `$PSVersionTable.PSVersion` | `5.1.26100.9818` (Windows PowerShell : `Get-ChildItem -Depth` n'existe pas) |

## Authentification GitHub (`gh auth status`)

- Hôte : github.com. Compte actif : **Casifox**. Protocole Git : HTTPS. Stockage : keyring.
- Scopes du token : `delete_repo`, `gist`, `read:org`, `repo`, `user`, `workflow`.
- Le token n'est pas reproduit ici (masqué par gh).
- Observation : le scope `delete_repo` est accordé. La mission ne l'utilise pas. Réduire ce scope relève de l'utilisateur.
- `gh repo list Casifox` fonctionne (11 dépôts visibles). Détail en phase 1.

## Disque

- Lecteur C: 163,05 Go libres, 312,8 Go utilisés (`Get-PSDrive -Name C`).
- Contrainte : Chromium seul pour Playwright.

## Dossiers

- `C:\Users\Noah\Documents\` : présent. Aucun fichier à la racine (vérifié par `Get-ChildItem -File`).
- `C:\Users\Noah\Documents\CASIFOX-GAME-HUB\` : existait avant la mission, vide. Réutilisé (voir DECISIONS.md D-006).
- `C:\Users\Noah\AGENTS.md` : absent avant la mission. Créé en phase 0.

## Outillage

- `audit-tools/` : `package.json` créé. Playwright `1.65.0` installé dans `audit-tools/` uniquement (`npm install --save-dev playwright@latest`, npm signale 0 vulnérabilité).
- Chromium seul installé (`npx playwright install chromium`) : Chrome for Testing `158.0.8127.18` (`chromium-1254`) et Chrome Headless Shell (`chromium_headless_shell-1254`), dans `%LOCALAPPDATA%\ms-playwright\`.
- Vérification réelle : `chromium.launch()` puis `close()` depuis `audit-tools/` → sortie `CHROMIUM OK 158.0.8127.18`.
- Python `3.12.10` disponible (`python --version`), nécessaire pour `tests/validate_content.py` (AVANT LE SILENCE) et `tools/make-og.py` (Neon Jackpot).

## Limites connues

- Modèle d'exécution : `claude-haiku-5-5` (fournisseur `opencode-go`). Le prompt recommande un modèle plus puissant pour les phases 0 à 6. Voir DECISIONS.md D-008.
- L'ordinateur doit rester allumé et OpenCode ouvert pendant toute la mission. Une mise en veille interrompt le travail.
- Pas d'accès à un navigateur visible : les tests Playwright tournent en mode headless.
