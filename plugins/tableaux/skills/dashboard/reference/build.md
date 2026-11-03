# Mode : build

Implémentez un tableau de bord à partir d'un cahier des charges validé. Lancez `init` d'abord s'il n'existe pas de source de données confirmée.

## 1. Vérifier le cahier des charges

Arrêtez-vous tant que la source de données n'est pas confirmée : une source du dépôt avec confirmation manuelle, ou une source définie par l'utilisateur avec sa licence et son URL. Ne revenez jamais à des jeux de test (fixtures), à des données d'exemple ni à des valeurs générées.

## 2. Planifier le contrat

1. Lisez les fichiers AGENTS.md listés à l'étape 1 de `init`.
2. Inspectez un tableau existant comportant une page ou un graphique similaire. Vérifiez les exports et types réels de tout composant partagé avant de l'utiliser.
3. Définissez d'abord le contrat backend : routes `/<board-id>/<page>/<endpoint>`, paramètres de requête et formats de réponse `{ data, provenance }`. Faites-le valider avant de construire.

## 3. Créer la structure du tableau

Identifiant du tableau : kebab-case, identique au nom du dossier et à l'`id` du document `boards` de MongoDB. Utilisez le modèle comme référence, et non comme générateur à copier intégralement.

### Client (`client/src/boards/<board-id>/`)

1. Ne créez que les fichiers nécessaires. Renommez `TemplateRoutes` si le modèle sert de point de départ.
2. Créez ou adaptez `routes.tsx` et les pages.
3. Mettez à jour `title-i18n.json` (`fr` obligatoire, `en` si le tableau est multilingue) ainsi que les fichiers `i18n.json` des mises en page et du menu latéral.
4. Ajoutez `sitemap-config.ts` exportant `SITEMAP: BoardSitemapConfig` (exemple : `client/src/boards/devenir-etudiants/sitemap-config.ts`). Il alimente le plan du site et le pied de page.
5. **Ne modifiez pas** `client/src/router.tsx`. Les routes des tableaux sont chargées dynamiquement depuis la liste MongoDB.

### Serveur (`server/src/routes/boards/<board-id>/`, chaque tableau possède son propre routeur)

1. Créez `index.js`, qui agrège `routes/*.js` (voir le modèle). N'ajoutez pas de dossier `data/` ni de jeux de test (fixtures).
2. Chaque route : `router.route("/<board-id>/<page>/<endpoint>")`. Réponse au format { data, provenance }, prête pour l'audit : filtres, agrégations, taux, classements, tris et calculs top-N sont effectués dans la route (pipeline Mongo ou code côté serveur), jamais laissés au navigateur.
Toute métrique que l'utilisateur peut modifier doit être soit un paramètre de route validé, soit déjà disponible pour chaque valeur de la réponse.
Exemple : server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js. Validez les paramètres en lançant les classes d'erreur de `server/src/commons/errors` (par exemple `BadRequestError`). `checkQuery` dans `server/src/routes/utils.js` n'interrompt pas le gestionnaire. N'utilisez Mongo via `server/src/services/mongo.js` qu'une fois la source confirmée.
3. Source de données : uniquement celle confirmée à l'étape 1. Isolez l'accès aux données dans un helper propre au tableau, afin que la source puisse changer sans modifier le chemin de la route ni le format de réponse. Si la source est nouvelle (pas une source du dépôt), demandez avant d'écrire du code s'il s'agit d'un **service commun** (`server/src/services/`, réutilisable par d'autres tableaux) ou d'un développement **propre au tableau** (`server/src/routes/boards/<board-id>/`). Par défaut, propre au tableau.
4. Enregistrez le routeur dans `server/src/router.js` (import et `router.use`, par ordre alphabétique).
5. Ajoutez les fichiers `api-tests/<page>/*.http` (par exemple `GET http://localhost:3000/api/<board-id>/...`).
6. Code commun ou propre : avant d'écrire un helper, cherchez dans `server/src/commons`, `server/src/services`, `routes/utils.js` et dans les autres tableaux. Gardez dans le tableau tout ce qui dépend du jeu de données (pipelines, noms de collections, vocabulaires de filtres, mise en forme des réponses). Ne déplacez du code vers `commons` ou `services` que lorsqu'un second tableau l'utilise déjà. Listez les candidats au lieu de modifier le code partagé (voir le README, « Code commun ou propre »).

## 4. Graphiques et interface

- Pour chaque graphique, suivez [chart](../../chart/SKILL.md). Les graphiques n'appellent que les routes propres au tableau, utilisent `ChartWrapper` et gèrent les états de chargement, d'erreur et vide.
- Pour la mise en page, les composants et le style, suivez [dsfr](../../dsfr/SKILL.md). Utilisez les tokens DSFR, et non des couleurs codées en dur.

## 5. Manifeste (uniquement si un paquet portable est demandé)

Rédigez `board.manifest.json` à la racine du tableau et vérifiez-le par rapport à `plugins/tableaux/reference/manifest.json`. Confirmez que chaque route commence par `/<board-id>/`. Consignez les confirmations cibles des sources du dépôt dans `data_sources`. Le manifeste est une documentation : ce n'est ni un enregistrement ni une autorisation.

## 6. Enregistrement

Le tableau n'apparaît que lorsqu'un enregistrement existe dans la collection MongoDB `boards` (`id`, `name_fr`, `name_en`, `description_fr`, `description_en`, `url`, et optionnellement `homePageVisible`, `isMultilingual`). En local, utilisez `POST /api/admin/add-dashboard` ou la page `/admin` (désactivée en production). Pour la production, consultez la section du README qui s'y rapporte. N'écrivez pas dans la base de données sans approbation explicite de l'utilisateur. La création d'un prototype n'implique pas d'enregistrement, et aucune métadonnée de production n'est modifiée sans demande claire et approbation humaine.

Ne supposez pas qu'un dossier de tableau est privé, et n'exposez pas d'identifiants dans le code client.

## 7. Registre des graphiques

Si un graphique doit pouvoir être intégré dans une iframe, ajoutez-le à `client/src/boards/integration/charts-registry.tsx` avec le même `id`.

## 8. Vérifications

1. Lancez `npm run build` à la racine du dépôt. Sous Windows, il échoue sur `rm -rf` ; dans ce cas, lancez `npm -w client run build` et signalez-le. `npm -w client run lint` n'est pas configuré.
2. Testez les routes avec les fichiers `.http`.
3. Si un aperçu local est disponible, indiquez la route `http://localhost:5173/<board-id>` et demandez une vérification manuelle de la mise en page adaptative, des thèmes, de l'usage au clavier et des états vide ou d'erreur.
4. Appliquez la [liste de contrôle accessibilité](./accessibility.md) à l'interface et corrigez les constats bloquants avant de rendre compte.

## 9. Rapport

Listez les fichiers modifiés, la source de données confirmée, les résultats des vérifications (en indiquant celles qui n'ont pas été exécutées), les constats d'accessibilité encore ouverts, les extractions de code commun proposées, et ce que la promotion requiert : un enregistrement `boards` MongoDB correspondant, la source de données confirmée branchée dans les routes, la relecture des routes par le responsable, et éventuellement une entrée dans le registre des graphiques. N'enregistrez pas le tableau, ne déployez pas, ne créez pas de branche et n'ouvrez pas de pull request sauf demande explicite.
