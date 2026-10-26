---
name: new-board
description: Créer un nouveau tableau de bord (board) à partir du board template — dossier client, routes, i18n, sitemap, routes serveur et entrée MongoDB. À utiliser quand on demande de créer, initialiser ou scaffolder un nouveau tableau de bord.
---

# Créer un nouveau board

Référence : `client/src/boards/template/` et `server/src/routes/boards/template/`. Demander l'`id` du board (kebab-case) s'il n'est pas fourni : il doit être identique au nom du dossier **et** à l'`id` du document MongoDB.

## Client

1. Inspecter le template et un board existant similaire, puis créer uniquement les fichiers nécessaires dans `client/src/boards/<board-id>/`. Le template est une référence, pas un générateur à copier en bloc.
2. Créer ou adapter `routes.tsx` et les pages ; renommer `TemplateRoutes` si le template sert de point de départ.
3. Mettre à jour `title-i18n.json` (`fr` obligatoire, `en` si multilingue) et les `i18n.json` des layouts / sidemenu.
4. Ajouter `sitemap-config.ts` exportant `SITEMAP: BoardSitemapConfig` (exemple : `client/src/boards/devenir-etudiants/sitemap-config.ts`) : il alimente le plan du site et le footer.
5. **Ne pas** modifier `client/src/router.tsx` : les routes du board sont chargées dynamiquement depuis la liste MongoDB.

## Serveur (si le board a besoin d'API dédiées)

1. Créer `server/src/routes/boards/<board-id>/index.js` qui agrège `routes/*.js` (cf. template).
2. Chaque route : `router.route("/<board-id>/<page>/<endpoint>")`, paramètres validés avec `checkQuery` (`server/src/routes/utils.js`), accès Mongo via `server/src/services/mongo.js`.
3. Enregistrer le router dans `server/src/router.js` (import + `router.use`, ordre alphabétique).
4. Ajouter un fichier `api-tests/<page>/*.http` (ex. `GET http://localhost:3000/api/<board-id>/...`).

## Enregistrement du board

Le board n'apparaît que s'il existe dans la collection Mongo `boards` (`id`, `name_fr`, `name_en`, `description_fr`, `description_en`, `url`, optionnellement `homePageVisible`, `isMultilingual`). En local : `POST /api/admin/add-dashboard` ou l'interface `/admin` (désactivée en production). En prod : voir la section dédiée du `README.md`. Ne pas écrire en base sans l'accord explicite de l'utilisateur.
Une création de prototype n'implique pas cette inscription : ne pas écrire en base ni modifier de métadonnées de production sans demande explicite et accord humain.

Utiliser des fixtures synthétiques ou publiques par défaut. Ne pas supposer qu'un dossier de board est privé ni exposer des identifiants dans le client.

## Vérification

Lancer les vérifications indiquées dans le `AGENTS.md` racine. Si un aperçu local est disponible, donner la route `http://localhost:5173/<board-id>` et demander une vérification du responsive, des thèmes, du clavier et des états vides/erreurs.
