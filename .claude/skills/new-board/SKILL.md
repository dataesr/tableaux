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
2. Chaque route : `router.route("/<board-id>/<page>/<endpoint>")`. Réponse au format `{ data, provenance }`, **prête à tracer** : filtres, agrégats, taux, rangs, tris et top-N sont calculés dans la route (pipeline Mongo ou code serveur, sur fixtures comme sur données réelles), jamais laissés au navigateur. Un indicateur que l'utilisateur peut changer est soit un paramètre validé de la route, soit déjà présent pour chaque valeur dans la réponse. Modèle : `server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js`. Valider les paramètres en levant les erreurs de `server/src/commons/errors` (ex. `BadRequestError`) ; `checkQuery` (`server/src/routes/utils.js`) n'interrompt pas le handler. Accès Mongo via `server/src/services/mongo.js` seulement quand la source est approuvée.
3. Prototype : lire des fixtures JSON synthétiques ou publiques dans `server/src/routes/boards/<board-id>/data/fixtures/`, avec l'accès aux données isolé dans `readFixture` pour pouvoir le remplacer sans changer le chemin ni la forme de la réponse.
4. Enregistrer le router dans `server/src/router.js` (import + `router.use`, ordre alphabétique).
5. Ajouter un fichier `api-tests/<page>/*.http` (ex. `GET http://localhost:3000/api/<board-id>/...`).
6. Code commun ou dédié : avant d'écrire un helper, chercher dans `server/src/commons`, `server/src/services`, `routes/utils.js` et les autres boards. Garder dans le board ce qui dépend du jeu de données (pipelines, noms de collections, vocabulaires de filtres, mise en forme des réponses). N'extraire vers `commons`/`services` que l'infrastructure neutre qu'un second board utilise déjà ; signaler les candidats au lieu de modifier le code partagé.

## Enregistrement du board

Le board n'apparaît que s'il existe dans la collection Mongo `boards` (`id`, `name_fr`, `name_en`, `description_fr`, `description_en`, `url`, optionnellement `homePageVisible`, `isMultilingual`). En local : `POST /api/admin/add-dashboard` ou l'interface `/admin` (désactivée en production). En prod : voir la section dédiée du `README.md`. Ne pas écrire en base sans l'accord explicite de l'utilisateur.

## Vérification

`cd client && npx tsc --noEmit`, puis `npm start` et ouvrir `http://localhost:5173/<board-id>`.
