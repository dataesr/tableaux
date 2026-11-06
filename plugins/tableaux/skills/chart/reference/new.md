# Procédure : ajouter un graphique

Exemple de référence : `client/src/boards/european-projects/pages/overview/charts/programs-funding/` (client) et sa route `server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js` (serveur). Avant d'écrire, lisez un graphique **du même tableau** et reprenez son style (séparateurs, couleurs, filtres, i18n).

## Principe : le serveur calcule, le client affiche

1. **La route serveur d'abord.** La route du tableau (`/<board-id>/<page>/<endpoint>`) filtre, agrège, joint, calcule taux et ratios, classe, trie et coupe au top-N (pipeline Mongo ou code de la route), puis renvoie des données prêtes à tracer, limitées à ce qui est affiché. Si la route n'existe pas ou renvoie des lignes brutes, ajoutez-la ou étendez-la (voir `server/src/routes/boards/AGENTS.md` et la partie serveur de [dashboard build](../../dashboard/reference/build.md)) avec un fichier `.http` dans `api-tests/`.
2. **Le client ne fait que de la mise en forme** : champs → séries, formats (`client/src/utils/format`), libellés i18n. Pas de `reduce` / `sort` / `find` imbriqués sur l'ensemble des lignes, pas de calcul de rang ou de taux, pas d'interpolation de points dans le navigateur.
3. **Un contrôle local (indicateur, onglet, tri) bascule instantanément.** Soit la réponse contient déjà les valeurs pour chaque option, soit l'option est un paramètre de la route et entre dans la `queryKey` (chaque réponse est mise en cache par `useQuery` ; `placeholderData: keepPreviousData` évite le clignotement). Mémoïsez les options Highcharts : `useMemo(() => getOptions(data, indicateur), [data, indicateur])`.
4. **Paramètres** : les filtres et contrôles qu'un utilisateur peut partager par lien sont des paramètres d'URL nommés selon [url-parameters](../../../reference/url-parameters.md) (vocabulaire commun, `snake_case`, aucune valeur par défaut dans l'URL), avec les mêmes noms dans l'appel API.

## Fichiers

Créez `client/src/boards/<board>/pages/<page>/charts/<chart-name>/` (kebab-case) :

- `query.tsx` : `getData(params)` appelle `fetch(\`${VITE_APP_SERVER_URL}/<board-id>/<page>/<endpoint>?${params}\`)`, avec `const { VITE_APP_SERVER_URL } = import.meta.env;`. Vérifiez `response.ok` et levez une erreur sinon ; ne renvoyez pas une erreur comme un succès vide. Si le tableau regroupe ses hooks dans un dossier `api/`, écrivez-y le hook au lieu de ce fichier.
- `options.tsx` : fonction pure, sans React, qui reçoit la réponse et renvoie **toujours** `createChartOptions(type, newOptions)` :

  ```tsx
  import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

  import { createChartOptions } from "<…>/components/chart-wrapper/default-options";
  import { getCssColor } from "<…>/utils/colors";

  export default function getOptions(data) {
    if (!data) return null;
    const newOptions: HighchartsInstance.Options = {
      xAxis: { type: "category" },
      yAxis: { min: 0, title: { text: "…" } },
      tooltip: {
        pointFormatter: function () {
          return `… <b>${this.y}</b>`;
        },
      },
      series: [
        { type: "bar", name: "…", color: getCssColor("<token>"), data: data.data.map((item) => [item.label, item.value]) },
      ],
    };
    return createChartOptions("bar", newOptions);
  }
  ```

  `createChartOptions` (`client/src/components/chart-wrapper/default-options.ts`) est la forme partagée du `CreateChartOptions` de european-projects (`boards/european-projects/components/chart-ep.ts`, propre à ce tableau : ne l'importez pas depuis un autre tableau). Elle fixe le fond, les polices, les couleurs de texte et de grille en tokens DSFR, l'infobulle, la légende (désactivée par défaut : `legend: { enabled: true }` pour l'afficher), désactive `credits` et `exporting`, et active l'accessibilité. Ne répétez pas ces réglages ; passez `"empty"` comme type quand chaque série fixe le sien. Attention : `deepMerge` concatène les tableaux, si bien qu'une **liste** d'axes (`yAxis: [a, b]`) est dupliquée et que les styles par défaut y écrasent ceux du graphique ; pour plusieurs axes, affectez `chartOptions.yAxis = [...]` après l'appel (exemple : `suivi-recherche/pages/bibliometrie/charts/comparaison-internationale/options.tsx`). Plusieurs variantes d'un même graphique → un fichier par variante (`options-values.tsx`, `options-rates.tsx`…), comme dans `european-projects/pages/positioning/charts/funding-evo-3-years/`.

- `utils.tsx` : fonctions utilitaires du graphique, qui lisent des valeurs déjà calculées par le serveur : `useGetParams()` (lecture des `searchParams` → chaîne de paramètres et `currentLang`), `renderDataTable(data, currentLang)` (tableau `fr-table` accessible passé à `renderData`), `readingKey(data)` si le tableau affiche une clé de lecture.
- `index.tsx` : composant par défaut.
  - `useQuery({ queryKey: ["<board>-<chart-name>", params, …], queryFn: () => getData(params), placeholderData: keepPreviousData })`. Chaque filtre et paramètre de la route va dans la `queryKey`.
  - Distinguez premier chargement, recalcul, erreur et absence de résultat :
    - premier chargement (`isLoading`) : `DefaultSkeleton` ;
    - tout recalcul ensuite (filtre, indicateur, onglet, tri) : gardez le graphique précédent, ainsi que les cartes de chiffres clés et les tableaux qui l'accompagnent, et **grisez-le** (voile avec indicateur de chargement et `aria-busy`) pendant l'appel API (`isPlaceholderData`) **et** pendant le redessin. Le redessin Highcharts est synchrone : n'appliquez la nouvelle valeur qu'une fois le voile affiché, puis retirez le voile à l'image suivante. Titres, commentaires et tableaux décrivent les données affichées, pas celles en attente. Ne laissez jamais un graphique, une carte ou un tableau périmé sans indication ; les contrôles restent utilisables et affichent tout de suite la valeur demandée. Implémentation de référence : `client/src/boards/suivi-recherche/components/chart-busy/` et `client/src/boards/suivi-recherche/hooks/use-render-transition.ts` (propres à ce tableau : ne les importez ni ne les copiez dans un autre tableau, proposez de les remonter dans `client/src/components/`) ;
    - erreur : une `Alert` en place qui conserve les filtres ; une erreur ne doit pas laisser un squelette à l'écran ;
    - succès sans données : un message explicatif.
  - `config = { id, idQuery?, title: { fr, en }, integrationURL: "/integration?chart_id=<id>", comment, readingKey, sources }`. Tout texte qui accompagne le graphique passe par ces clés, que `ChartFooter` affiche sous le graphique avec leurs intitulés, dans le même ordre pour tous les tableaux ; jamais de paragraphe libre sous le graphique :
    - `comment` (« Commentaire : ») : ce que montre le graphique, comment il est calculé, les réserves (années provisoires, points peu fiables, entités non représentées) ;
    - `readingKey` (« Exemple de lecture : ») : **une phrase concrète calculée à partir des données affichées**, avec numérateur et dénominateur (« En 2024, la France est au 3e rang sur 25 pays : 11,7 % (567 / 4 862 lauréats). »). Ce n'est pas une description des axes, qui va dans `comment`. Écrivez-la dans `utils.tsx` (`getLecture(data)`) ; omettez la clé quand aucune valeur ne permet de l'écrire ;
    - `sources` (« Sources : ») : une entrée par jeu de données, `{ label: { fr: <>…</> }, url?: { fr }, update?: Date }`. `url` n'est omis que pour un jeu non public (libellé affiché sans lien) ; `update` est la date d'extraction ou de snapshot. N'écrivez jamais « Source : … » dans `comment` ni dans le titre, et n'affichez jamais une chaîne de sources reçue de l'API : la route renvoie les sources structurées (`{ libelle, url, date }`, construites à partir des champs de métadonnées et non de leur texte libre) et la page les convertit. Une source qui ne vaut que pour un indicateur (le vivier OpenAlex de l'indice de candidature, par exemple) ne s'ajoute que lorsque cet indicateur est affiché ;
    - `description` et `subtitle` existent dans `ChartConfig` mais ne sont pas rendus par `ChartWrapper` : n'y mettez rien dont le lecteur a besoin.
    Référence : `server/src/routes/boards/suivi-recherche/sources.js`, `client/src/boards/suivi-recherche/components/sources.tsx` (`getChartSources`), et `getLectureMatrice` / `getLectureRubans` dans `client/src/boards/suivi-recherche/components/matrice/` et `rubans/`.
  - Rendu : `<ChartWrapper config={config} options={options} renderData={() => renderDataTable(data, currentLang)} />`, entouré du voile de recalcul du tableau. Sans `renderData`, le wrapper affiche le tableau natif de Highcharts (`viewData`, module `export-data`) : c'est le défaut. Ne passez `renderData` que si ce tableau natif n'est pas lisible tel quel (clés qui ne sont pas des libellés, valeurs à formater, plusieurs axes, données non tracées) — et dans ce cas, vérifiez-le à l'écran. Le module d'accessibilité Highcharts activé par `createChartOptions` ne se désactive pas. N'instanciez jamais `HighchartsReact` directement.

## Couleurs et textes

- Couleurs : `getCssColor("<token>")` / `client/src/utils/colors.ts`, `useChartColor`, ou le `colors.scss` du tableau. Ne codez jamais de valeurs hexadécimales en dur dans un nouveau graphique (thème sombre).
- Textes : passez par le `i18n.json` du tableau, et par `getI18nLabel` si le tableau est multilingue (`fr` et `en`).

## Intégration

1. Importez le graphique dans `pages/<page>/index.tsx`.
2. Si le graphique doit pouvoir être intégré dans une iframe, ajoutez-le à `client/src/boards/integration/charts-registry.tsx` avec le même `id`.
3. Le graphique n'appelle que les routes de son propre tableau (`${VITE_APP_SERVER_URL}/<board-id>/...`), jamais `/elasticsearch` ni un autre service directement.

## Accessibilité

L'accessibilité est complète (RGAA) et tout constat est bloquant. Filtres : les composants dsfr-plus (`Select`, `SegmentedControl`, etc.) ou ceux de `client/src/components/` (`select`, `range-of-years`) sont obligatoires dès qu'ils couvrent le besoin ; un composant partagé défaillant se corrige à la source, il n'est pas remplacé localement. `id` uniques (`useId`), un `<label>` visible relié à chaque contrôle, une seule taille de champ par ligne. Aucune information portée par la couleur seule ; un tableau de données lisible (natif par défaut, `renderData` si nécessaire) ; couleurs de séries par `getCssColor` / `useChartColor` (palette illustrative DSFR, lisible pour les daltoniens, contraste vérifié en thème sombre). Voir la compétence [dsfr](../../dsfr/SKILL.md) pour les pièges de mise en page.

## Vérification

- Lancez les vérifications du `AGENTS.md` racine.
- Testez la route avec le fichier `.http` du tableau et vérifiez que la réponse est déjà agrégée.
- Si possible, ouvrez la page en local : rendu, états (squelette au premier chargement, graphique grisé pendant un rechargement — à vérifier en ralentissant le réseau dans les outils de développement du navigateur), clavier, et bascule des contrôles locaux sans délai perceptible (aucun calcul de plus de ~100 ms au changement d'indicateur ; mesurez-le avec le profileur du navigateur en cas de doute).
