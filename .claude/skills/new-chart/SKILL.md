---
name: new-chart
description: Ajouter un graphique Highcharts à une page d'un board (dossier charts/<nom>/ avec index.tsx + utils.tsx, ChartWrapper, useQuery). À utiliser quand on demande de créer, ajouter ou dupliquer un graphique dans client/src/boards.
---

# Ajouter un graphique

Exemple de référence : `client/src/boards/template/pages/overview/charts/funded-labs/`. Avant d'écrire, lire un graphique **du même board** et calquer son style (points-virgules, couleurs, filtres, i18n).

## Étapes

1. Créer `client/src/boards/<board>/pages/<page>/charts/<chart-name>/` (kebab-case).
2. `utils.tsx` : fonctions pures sans React.
   - `getSeries(data)` : transforme la réponse API/ES en `{ categories, series }`. Traiter explicitement les données absentes ou vides ; ne pas masquer une réponse invalide comme un succès vide.
   - `getOptions(...)` : renvoie l'objet d'options Highcharts (`credits: { enabled: false }`, titres d'axes, etc.).
3. `index.tsx` : composant par défaut.
   - `const { VITE_APP_SERVER_URL } = import.meta.env;`
   - Données : si le board a un dossier `api/`, y écrire le hook (`useQuery`) et l'importer ici ; sinon `useQuery` dans le composant, comme le reste du board. Tous les filtres vont dans la `queryKey` (`["<board>-<chart-name>", ...filtres]`).
   - Distinguer chargement, erreur et absence de résultat : `DefaultSkeleton` pendant le chargement, `Alert` sur place en cas d'erreur en conservant les filtres, et un message explicatif si la requête réussit sans données. Ne pas laisser l'erreur afficher un squelette indéfiniment.
   - Couleurs : `useChartColor`, `client/src/utils/colors.ts` ou le `colors.scss` du board. Jamais d'hex en dur dans un nouveau graphique (thème sombre).
   - `config = { id, title, integrationURL: "/integration?chart_id=<id>" }` (+ `comment`, `sources`, `description` si le board les utilise).
   - Rendu : `<ChartWrapper config={config} options={options} />` (ne jamais instancier `HighchartsReact` directement).
   - Textes : passer par le `i18n.json` du board et `getI18nLabel` si le board est multilingue.
4. Importer le graphique dans `pages/<page>/index.tsx`.
5. Si le graphique doit être intégrable en iframe : l'ajouter dans `client/src/boards/integration/charts-registry.tsx` avec le même `id`.
6. Si une nouvelle route serveur est nécessaire : voir le skill `new-board` (partie serveur) et ajouter un fichier `.http` dans `api-tests/`.

## Accessibilité

Filtres : préférer les composants dsfr-plus (`Select`, `SegmentedControl`…) ou ceux de `client/src/components/` (`select`, `range-of-years`…) ; sinon `id` uniques (`useId`) et `<label>` associé. Une seule taille de champ par rangée. Pas d'information portée uniquement par la couleur. Voir le skill `dsfr` pour les pièges de mise en page.

## Vérification

Lancer les vérifications indiquées dans le `AGENTS.md` racine et, si possible, ouvrir la page localement pour vérifier le rendu, les états et l'accessibilité clavier.
