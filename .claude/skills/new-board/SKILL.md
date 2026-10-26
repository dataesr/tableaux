---
name: new-board
description: Créer un nouveau tableau de bord (board) à partir du board template — dossier client, routes, i18n, sitemap, routes serveur et entrée MongoDB. À utiliser quand on demande de créer, initialiser ou scaffolder un nouveau tableau de bord.
---

# Créer un nouveau board

Référence : `client/src/boards/template/` et `server/src/routes/boards/template/`. Demander l'`id` du board (kebab-case) s'il n'est pas fourni : il doit être identique au nom du dossier **et** à l'`id` du document MongoDB.

## Client

1. Copier `client/src/boards/template/` vers `client/src/boards/<board-id>/`.
2. Renommer `TemplateRoutes` dans `routes.tsx` et adapter les pages (`pages/home`, `pages/overview`…).
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

## Vérification

`cd client && npx tsc --noEmit`, puis `npm start` et ouvrir `http://localhost:5173/<board-id>`.
