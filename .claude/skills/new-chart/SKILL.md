---
name: new-chart
description: Ajouter un graphique Highcharts à une page d'un board, sur le modèle de european-projects (dossier charts/<nom>/ avec index.tsx, query.tsx, options.tsx via createChartOptions, utils.tsx ; calculs côté serveur, ChartWrapper, useQuery). À utiliser quand on demande de créer, ajouter ou dupliquer un graphique dans client/src/boards.
---

# Ajouter un graphique

Référence : `client/src/boards/european-projects/pages/overview/charts/programs-funding/` (client) et `server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js` (serveur). Avant d'écrire, lire aussi un graphique **du même board** et calquer son style (points-virgules, couleurs, filtres, i18n).

## Principe : le serveur calcule, le client affiche

1. **Route serveur d'abord.** La route du board (`/<board-id>/<page>/<endpoint>`) filtre, agrège, joint, calcule taux et ratios, classe, trie et coupe au top-N (pipeline Mongo ou code de la route), puis renvoie des données prêtes à tracer, limitées à ce qui est affiché. Si la route n'existe pas ou renvoie des lignes brutes, l'ajouter ou l'étendre (voir `server/src/routes/boards/AGENTS.md` et le skill `new-board`) avec un `.http` dans `api-tests/`.
2. **Le client ne fait que du mapping** : champs → séries, formats (`client/src/utils/format`), libellés i18n. Pas de `reduce`/`sort`/`find` imbriqués sur l'ensemble des lignes, pas de calcul de rang ou de taux, pas d'interpolation de points.
3. **Contrôle local (indicateur, onglet, tri) = bascule instantanée.** Soit la réponse contient déjà les valeurs pour chaque option, soit l'option est un paramètre de la route et entre dans la `queryKey` (chaque réponse est mise en cache par `useQuery`, `placeholderData: keepPreviousData` évite le clignotement). Les options Highcharts sont mémoïsées : `useMemo(() => getOptions(data, indicateur), [data, indicateur])`.

## Fichiers

Créer `client/src/boards/<board>/pages/<page>/charts/<chart-name>/` (kebab-case) :

- `query.tsx` — `getData(params)` : `fetch(\`${VITE_APP_SERVER_URL}/<board-id>/<page>/<endpoint>?${params}\`)`, avec `const { VITE_APP_SERVER_URL } = import.meta.env;`. Vérifier `response.ok`et lever une erreur sinon (ne pas renvoyer une erreur comme un succès vide). Si le board centralise ses hooks dans un dossier`api/`, y écrire le hook au lieu de ce fichier.
- `options.tsx` — fonction pure, sans React, qui reçoit la réponse et renvoie **toujours** `createChartOptions(type, newOptions)` :

  ```tsx
  import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js"

  import { createChartOptions } from "<…>/components/chart-wrapper/default-options"
  import { getCssColor } from "<…>/utils/colors"

  export default function getOptions(data) {
    if (!data) return null
    const newOptions: HighchartsInstance.Options = {
      xAxis: { type: "category" },
      yAxis: { min: 0, title: { text: "…" } },
      tooltip: {
        pointFormatter: function () {
          return `… <b>${this.y}</b>`
        },
      },
      series: [
        { type: "bar", name: "…", color: getCssColor("<token>"), data: data.data.map((item) => [item.label, item.value]) },
      ],
    }
    return createChartOptions("bar", newOptions)
  }
  ```

  `createChartOptions` (`client/src/components/chart-wrapper/default-options.ts`) est la version partagée du `CreateChartOptions` de european-projects (`boards/european-projects/components/chart-ep.ts`, local à ce board : ne pas l'importer depuis un autre board). Il fournit fond, polices, couleurs de texte et de grille en tokens DSFR, tooltip, légende (désactivée par défaut : `legend: { enabled: true }` pour l'afficher), `credits`/`exporting` désactivés et accessibilité. Ne pas répéter ces réglages ; passer `"empty"` comme type quand chaque série fixe le sien. Attention : `deepMerge` concatène les tableaux, si bien qu'une **liste** d'axes (`yAxis: [a, b]`) est dupliquée et que les styles par défaut y écrasent ceux du graphique ; pour plusieurs axes, affecter `chartOptions.yAxis = [...]` après l'appel (exemple : `suivi-recherche/pages/bibliometrie/charts/comparaison-internationale/options.tsx`). Plusieurs variantes d'un même graphique → un fichier par variante (`options-values.tsx`, `options-rates.tsx`…), comme `european-projects/pages/positioning/charts/funding-evo-3-years/`.

- `utils.tsx` — helpers du graphique : `useGetParams()` (lecture des `searchParams` → chaîne de paramètres + `currentLang`), `renderDataTable(data, currentLang)` (tableau `fr-table` accessible passé à `renderData`), `readingKey(data)` si le board affiche une clé de lecture. Ces fonctions lisent des valeurs déjà calculées par le serveur.
- `index.tsx` — composant par défaut :
  - `useQuery({ queryKey: ["<board>-<chart-name>", params, …], queryFn: () => getData(params) })`. Tous les filtres et paramètres de la route vont dans la `queryKey`.
  - Distinguer premier chargement, rechargement, erreur et absence de résultat :
    - premier chargement (`isLoading`) : `DefaultSkeleton` ;
    - tout recalcul ensuite (changement de filtre, d'indicateur, d'onglet) : garder le graphique précédent — ainsi que les cartes de chiffres clés et les tableaux qui l'accompagnent — (`placeholderData: keepPreviousData` dans le `useQuery`) et le **griser** (overlay avec indicateur de chargement et `aria-busy`) pendant l'appel API (`isPlaceholderData`) **et** pendant le redessin. Le redessin Highcharts est synchrone : appliquer la nouvelle valeur seulement après que le grisé a été peint, puis retirer le grisé à l'image suivante. Titre, commentaire et tableaux décrivent les données affichées, pas celles en attente. Ne jamais laisser un graphique, une carte ou un tableau périmé sans indication ; les contrôles restent utilisables et affichent tout de suite la valeur demandée. Implémentation de référence : `client/src/boards/suivi-recherche/components/chart-busy/` et `client/src/boards/suivi-recherche/hooks/use-render-transition.ts` (locales à ce board : ne pas les importer ni les copier dans un autre board, proposer de les remonter dans `client/src/components/`) ;
    - erreur : `Alert` sur place en conservant les filtres ; ne pas laisser une erreur afficher un squelette indéfiniment ;
    - succès sans données : message explicatif.
  - `config = { id, idQuery?, title: { fr, en }, integrationURL }` (+ `comment`, `readingKey`, `sources`, `description` si le board les utilise).
  - Rendu : `<ChartWrapper config={config} options={options} renderData={() => renderDataTable(data, currentLang)} />`, entouré du grisé du board (jamais `HighchartsReact` directement).

## Couleurs et textes

- Couleurs : `getCssColor("<token>")` / `client/src/utils/colors.ts`, `useChartColor` ou le `colors.scss` du board. Jamais d'hex en dur (thème sombre).
- Textes : `i18n.json` du board et `getI18nLabel` si le board est multilingue (`fr` et `en`).

## Intégration

1. Importer le graphique dans `pages/<page>/index.tsx`.
2. Si le graphique doit être intégrable en iframe : l'ajouter dans `client/src/boards/integration/charts-registry.tsx` avec le même `id`.
3. Le graphique n'appelle que les routes de son board (`${VITE_APP_SERVER_URL}/<board-id>/...`), jamais `/elasticsearch` ni un autre service directement.

## Accessibilité

Filtres : préférer les composants dsfr-plus (`Select`, `SegmentedControl`…) ou ceux de `client/src/components/` (`select`, `range-of-years`…) ; sinon `id` uniques (`useId`) et `<label>` associé. Une seule taille de champ par rangée. Pas d'information portée uniquement par la couleur ; fournir `renderData`. Voir le skill `dsfr` pour les pièges de mise en page.

## Vérification

- Lancer les vérifications indiquées dans le `AGENTS.md` racine.
- Exercer la route avec le `.http` du board et vérifier que la réponse est déjà agrégée.
- Si possible, ouvrir la page localement : rendu, états (squelette au premier chargement, graphique grisé pendant un rechargement — à vérifier en ralentissant le réseau dans les outils du navigateur), clavier, et bascule des contrôles locaux sans latence perceptible (pas de calcul de plus de ~100 ms au changement d'indicateur ; le mesurer avec le profiler du navigateur en cas de doute).
