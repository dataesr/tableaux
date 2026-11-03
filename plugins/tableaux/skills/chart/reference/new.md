# Procédure : ajouter un graphique

Exemple de référence : `client/src/boards/template/pages/overview/charts/funded-labs/`. Avant d'écrire, lisez un graphique **du même tableau** et reprenez son style (séparateurs, couleurs, filtres, i18n).

## Étapes

1. Créez `client/src/boards/<board>/pages/<page>/charts/<chart-name>/` (kebab-case).
2. `utils.tsx` : fonctions pures, sans React.
   - `getSeries(data)` : transforme la réponse de l'API en `{ categories, series }`. Gérez explicitement les données absentes ou vides ; n'affichez pas une réponse invalide comme un succès vide.
   - `getOptions(...)` : renvoie l'objet d'options Highcharts (`credits: { enabled: false }`, titres d'axes, etc.).
3. `index.tsx` : composant par défaut.
   - `const { VITE_APP_SERVER_URL } = import.meta.env;`
   - Données : si le tableau a un dossier `api/`, placez-y le hook (`useQuery`) et importez-le ici. Sinon, appelez `useQuery` dans le composant, comme le reste du tableau. Chaque filtre va dans la `queryKey` (`["<board>-<chart-name>", ...filters]`).
   - Distinguez le chargement, l'erreur et l'absence de résultat : `DefaultSkeleton` pendant le chargement, une `Alert` en place en cas d'erreur qui conserve les filtres, et un message explicatif lorsque la requête réussit sans données. Une erreur ne doit pas laisser un squelette à l'écran.
   - Couleurs : `useChartColor`, `client/src/utils/colors.ts`, ou le `colors.scss` du tableau. Ne codez jamais de valeurs hexadécimales en dur dans un nouveau graphique (thème sombre).
   - `config = { id, title, integrationURL: "/integration?chart_id=<id>" }` (ainsi que `comment`, `sources` et `description` si le tableau les utilise).
   - Rendu : `<ChartWrapper config={config} options={options} />`. N'instanciez jamais `HighchartsReact` directement.
   - Textes : passez par le `i18n.json` du tableau, et par `getI18nLabel` si le tableau est multilingue.
4. Importez le graphique dans `pages/<page>/index.tsx`.
5. Si le graphique doit pouvoir être intégré dans une iframe, ajoutez-le à `client/src/boards/integration/charts-registry.tsx` avec le même `id`.
6. Si une nouvelle route serveur est nécessaire, suivez la partie serveur de [dashboard build](../../dashboard/reference/build.md) et ajoutez un fichier `.http` dans `api-tests/`. Le graphique n'appelle que les routes de son propre tableau (`${VITE_APP_SERVER_URL}/<board-id>/...`), jamais `/elasticsearch` ni un autre service directement.

## Accessibilité

Filtres : privilégiez les composants dsfr-plus (`Select`, `SegmentedControl`, etc.) ou ceux de `client/src/components/` (`select`, `range-of-years`). Sinon, utilisez des `id` uniques (`useId`) et un `<label>` relié au contrôle. Une seule taille de champ par ligne. Aucune information portée par la couleur seule. Voir la compétence [dsfr](../../dsfr/SKILL.md) pour les pièges de mise en page.

## Vérification

Lancez les vérifications du `AGENTS.md` racine. Si possible, ouvrez la page en local et vérifiez le rendu, les états et l'accessibilité au clavier.
