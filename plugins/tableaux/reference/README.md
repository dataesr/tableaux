# Conventions de prototypage de tableaux de bord

Ce document décrit l'architecture actuelle de tableaux pour le travail de création de tableaux de bord assisté par IA. Il n'autorise pas l'accès à tous les services présents dans le dépôt. Les sources authentifiées nécessitent la confirmation manuelle du développeur avant toute utilisation (voir la section Sources de données).

## Périmètre et statut

- Les données du prototype proviennent d'une source de données que l'utilisateur choisit au départ : une source de données du dépôt (MongoDB, Elasticsearch, Paysage, ODS) ou une source définie par l'utilisateur. Il n'existe ni jeux de données de test (fixtures) ni données d'exemple générées. Une source du dépôt requiert la confirmation manuelle du développeur et un accès en lecture.
- Le backend est le service Node.js/Express existant ; n'ajoutez pas de service Python/FastAPI.
- Les outils de découverte et de validation de manifeste existent dans le dépôt distinct `dataesr-mcp` (endpoint `/tableaux`) mais ne sont pas déployés. Ils lisent ce dépôt depuis GitHub (branche `staging` par défaut), donc `index.json` doit être poussé avant qu'ils fonctionnent. Ils valident le manifeste et n'effectuent que des contrôles statiques du bundle, pas du code généré. Il n'existe aucun bac à sable isolé pour exécuter les projets générés.
- Lacune du flux de discussion : le MCP peut planifier et valider, mais ne peut pas produire un bundle de fichiers de tableau depuis le chat. Un outil `scaffold_board(id, routes)` qui renvoie un bundle à importer est une évolution future envisageable ; il n'est pas implémenté.
- Décisions en suspens : jeux de données de prévisualisation approuvés et leurs responsables, ajout éventuel d'une validation exécutable en bac à sable, et maintien de la soumission par import et relecture manuels, ou passage à un flux de branche ou de PR de bot restreint.

## Modèle de tableau

Il existe un seul profil de prototype : un **tableau** composé d'un dossier client et de ses propres routes serveur. Le navigateur n'appelle que les routes du tableau (`/<board-id>/...`) ; ces routes lisent les données. La source de données relève du serveur : la promotion peut donc modifier l'accès aux données dans la route, tout en laissant inchangés l'URL, la forme de la réponse et le code client.

| Élément | Emplacement | Remarques |
| --- | --- | --- |
| Tableau client | `client/src/boards/<board-id>/` | Suit `client/src/boards/template/` |
| Routes serveur | `server/src/routes/boards/<board-id>/` | Montées depuis `server/src/router.js` ; suivent `server/src/routes/boards/template/` |
| Accès aux données | Dans les routes du tableau | Source du dépôt ou définie par l'utilisateur, voir Sources de données |

## Structure native du dépôt et enregistrement

Travaillez directement dans `client/src/boards/<board-id>/` et `server/src/routes/boards/<board-id>/`. Un tableau généré doit utiliser les conventions existantes de routes, de pages et de composants, au lieu d'ajouter une application `web/` parallèle.

Le routeur racine obtient les enregistrements de tableaux depuis `/admin/list-dashboards` et importe dynamiquement `client/src/boards/<record.id>/routes.tsx`. Un dossier seul ne publie pas de tableau de bord. L'enregistrement en production requiert en plus un enregistrement MongoDB `boards` dont l'`id` correspond au dossier. Ne créez ni ne modifiez d'enregistrements de production pendant le prototypage. Traitez l'enregistrement comme une étape de promotion relue par un humain.

L'API Express se trouve dans `server/`. Chaque tableau crée son routeur et le monte dans `server/src/router.js`, même lorsque sa source de données est définie par l'utilisateur. Le serveur se connecte à MongoDB au démarrage ; exécuter un tableau en local nécessite donc la base MongoDB dont disposent déjà les développeurs du dépôt. Le travail côté backend est tout de même relu par le responsable des données : identifiez la propriété des données, la validation des entrées et l'exposition au déploiement.

L'intégration des graphiques en iframe est une surface distincte. Lorsqu'elle est explicitement demandée, suivez `client/src/boards/integration/README.md` et enregistrez le graphique dans `client/src/boards/integration/charts-registry.tsx`.

## Références d'implémentation existantes

- **Routes et mise en page du tableau :** `client/src/boards/template/routes.tsx`, `client/src/boards/template/components/layouts/global-layout.tsx`, `client/src/boards/template/components/layouts/sidemenu-layout.tsx`.
- **Composition des pages :** `client/src/boards/template/pages/home/index.tsx` et `client/src/boards/template/pages/overview/index.tsx`.
- **Enveloppe de graphique :** `client/src/components/chart-wrapper/index.tsx`, `ChartWrapper({ config, options, constructorType?, hideTitle?, legend?, renderData? })`.
- **Options de graphique :** `client/src/components/chart-wrapper/default-options.ts`, `createChartOptions(type, options)`, la forme partagée de `CreateChartOptions` de `european-projects`. Chaque graphique construit ses options Highcharts avec elle (tokens DSFR, polices, axes, infobulle, valeurs par défaut d'accessibilité). Elle concatène les listes d'axes ; définissez donc les tableaux `yAxis`/`xAxis` après l'appel.
- **Référence de graphique (structure et flux de données) :** `client/src/boards/european-projects/pages/overview/charts/programs-funding/` (`index.tsx`, `query.tsx`, `options.tsx`, `utils.tsx` avec `renderDataTable`) et sa route `server/src/routes/boards/european-projects/routes/horizon-europe/overview/programs-funding/index.js`, qui renvoie des agrégats et des taux de réussite déjà calculés.
- **Où les calculs ont lieu :** côté serveur. Les routes renvoient des données prêtes pour le graphique (agrégées, classées, triées, limitées à ce qui est affiché) ; le client les transforme en séries et les met en forme. Un contrôle local de graphique (indicateur, onglet) est un paramètre de route ou figure déjà dans la réponse, de sorte que le changement est instantané.
- **Paramètres d'URL et d'API :** `plugins/tableaux/reference/url-parameters.md` (vocabulaire commun : `section` pour l'onglet sélectionné, `paysage_id` / `ror_id`, `year_min` / `year_max`, `region`… ; mêmes noms dans l'URL des pages et dans les routes). Référence : `client/src/boards/suivi-recherche/hooks/use-selection.ts`, `pages/bibliometrie/sections.ts`.
- **Chargement et couleurs des graphiques :** `client/src/components/charts-skeletons/` et `client/src/hooks/useChartColor.tsx`.
- **Exemple de graphique (usage des composants uniquement) :** `client/src/boards/template/pages/overview/charts/funded-labs/index.tsx` montre `ChartWrapper`, `useQuery`, les squelettes et `useChartColor`. Comme les autres graphiques de ce dossier, il interroge directement depuis le navigateur le proxy Elasticsearch de production (`/elasticsearch`), et la page modèle ne l'affiche pas. Ne copiez pas cet accès aux données : les graphiques d'un prototype appellent les routes serveur propres au tableau.
- **Routeur serveur :** `server/src/routes/boards/template/` est un squelette minimal (`/template/overview/test`) sans fichier de données. Ajoutez l'accès aux données au routeur d'un nouveau tableau comme décrit dans « Modèle de tableau » ci-dessus.
- **Interface partagée :** `client/src/components/` et `@dataesr/dsfr-plus`, déjà listés dans `client/package.json`.

Les exemples montrent des modèles, et non une API de composants universelle. Inspectez les exports réels et les usages voisins avant de générer du code.

## Sources de données

| Identifiant de source | Implémentation dans le dépôt | Statut du prototype | Substitut requis / approbation |
| --- | --- | --- | --- |
| `mongodb` | `server/src/services/mongo.js` (et `mongo-accessibility.js`), lu depuis les routes des tableaux | Confirmation de la cible | Le développeur confirme les collections et champs exacts
| `elasticsearch` | Proxy Express `/elasticsearch` (`ES_TOKEN_*`) ; plusieurs tableaux l'appellent aussi depuis le navigateur | Confirmation de la cible | Le développeur confirme l'index et les champs exacts ; lisez-le côté serveur depuis les routes du tableau, et non depuis le navigateur |
| `paysage` | `PAYSAGE_API_URL` / `PAYSAGE_API_KEY`, actuellement appelés séparément depuis `atlas` et `european-projects` | Confirmation de la cible | Le développeur confirme ; réutilisez un client partagé plutôt qu'une troisième copie |
| `ods` | `ODS_API_URL` / `ODS_API_KEY`, utilisés par `structures-finance` | Confirmation de la cible | Le développeur confirme |
| `external` | Une source publique ou définie par l'utilisateur, non hébergée par le projet (OpenAlex, OEB, Eurostat, un fichier fourni par l'utilisateur), appelée depuis les routes du tableau | Approbation requise | Consigner la licence, la date de récupération et l'URL ; un appel en direct nécessite une mise en cache et une décision d'egress de la plateforme ; |

Chaque source dispose d'un guide dans [`guides/`](./guides/) ; les questions à poser avant d'utiliser une source se trouvent dans [`guides/data-specs.md`](./guides/data-specs.md).

Les sources du dépôt (`mongodb`, `elasticsearch`, `paysage`, `ods`) sont toujours en lecture seule et leurs identifiants sont déjà configurés, de sorte qu'aucun jeton n'est demandé. Avant toute lecture, le développeur ne confirme que l'index ou la collection exacts et la classification des données. Une nouvelle source nécessite également la confirmation du nom de son jeton (jamais sa valeur). Aucun identifiant ni chaîne de connexion de production n'a sa place dans ce document.

[`index.json`](./index.json) est la forme lisible par machine de ce document : fichiers de consignes, chemins des modèles, composants et sources de données ci-dessus avec leur statut. Le serveur `/tableaux` de `dataesr-mcp` lit depuis GitHub, au moment de la requête, ce fichier, les fichiers `AGENTS.md`, les skills, les fichiers modèles et le schéma du manifeste, et ne stocke rien lui-même. Lorsque vous ajoutez ou déplacez un modèle, un fichier de consignes, un composant ou une source de données, mettez à jour `index.json` dans la même modification.

## Code commun ou dédié

Les serveurs de tableaux existants partagent une infrastructure mais presque aucune logique de données : une connexion MongoDB et une collection `boards`, `server/src/commons/errors` (utilisé par peu de tableaux), `routes/utils.js`, et du code client Paysage dupliqué. Aucun couple de tableaux ne lit le même jeu de données. Avant d'écrire un utilitaire pour un nouveau tableau :

1. Recherchez un équivalent existant dans `server/src/commons`, `server/src/services`, `server/src/routes/utils.js` et dans les routeurs des autres tableaux, et réutilisez-le.
2. Placez le code dans le tableau lorsqu'il dépend de son jeu de données : pipelines d'agrégation, noms de collections, vocabulaires de filtres, mise en forme des réponses. C'est le comportement par défaut.
3. Ne déplacez vers `commons`/`services` que l'infrastructure neutre au domaine dont un second tableau a besoin : gestion des erreurs, validation des requêtes, mise en cache, clients d'API externes (Paysage, ODS), accès à la base de données. Extrayez après la seconde utilisation réelle, pas de façon spéculative.
4. Ne modifiez jamais silencieusement le code partagé pour un seul tableau. Listez les extractions proposées dans `common_candidates` du manifeste et dans la pull request, pour décision du relecteur.

## Manifeste du bundle

`board.manifest.json` est un ensemble de métadonnées proposées, conservé à la racine du tableau lorsqu'un bundle généré doit voyager séparément. Il ne remplace pas les métadonnées du tableau de bord dans MongoDB et n'est pas utilisé par le runtime actuel. Sa partie utile est le contrat backend : `routes` liste les points de terminaison du tableau et `data_sources` ce qu'ils lisent, afin qu'un responsable des données puisse le relire avant de lire le code.

Le schéma JSON est [`manifest.json`](./manifest.json). `id` doit correspondre aux noms prévus des dossiers client et serveur et, lors de la promotion, à `boards.id` dans MongoDB ; chaque chemin de route doit commencer par `/<id>/` (le schéma ne peut pas le vérifier).

Exemple :

```json
{
  "$schema": "../../../../plugins/tableaux/reference/manifest.json",
  "schema_version": 1,
  "id": "research-funding",
  "name": "Financement de la recherche",
  "description": "Prototype d'évolution des financements",
  "data_sources": ["mongodb"],
  "routes": [
    {
      "method": "GET",
      "path": "/research-funding/overview/funding-by-year",
      "description": "Projets financés par an"
    }
  ],
  "common_candidates": [],
  "features": ["filters", "time-series-chart", "data-table"]
}
```

## Skills du plugin

Le flux de travail se trouve dans le plugin `tableaux`, à l'emplacement [`plugins/tableaux/`](../).

### Installer avec GitHub Copilot CLI

Depuis la racine du dépôt :

```bash
copilot plugin install ./plugins/tableaux
```

### Installer avec Claude Code

La racine du dépôt contient une marketplace, [`.claude-plugin/marketplace.json`](../../../.claude-plugin/marketplace.json), qui liste le plugin `tableaux`. Depuis la racine du dépôt :

```bash
claude plugin marketplace add ./
claude plugin install tableaux@dataesr-tableaux --scope project
```

Ou depuis une session Claude Code :

```text
/plugin marketplace add dataesr/tableaux
/plugin install tableaux@dataesr-tableaux
```

| Skill | Finalité |
| --- | --- |
| `/dashboard init` | Clarifie la demande et demande quelle source de données utiliser (du dépôt ou définie par l'utilisateur), puis les champs. N'écrit rien. |
| `/dashboard build` | Construit le tableau à partir d'un brief confirmé : squelette, routeur serveur, graphiques (`chart`) et mise en forme (`dsfr`). |
| `/dashboard critique` | Liste de contrôle en lecture seule : ergonomie, exactitude des données, usage du DSFR, adéquation à l'infrastructure. |
| `/dashboard accessibility` | Liste de contrôle en lecture seule pour le RGAA / WCAG 2.1 AA : clavier, libellés, contraste, alternatives textuelles des graphiques, titres. |
| `/chart new` | Ajoute un graphique Highcharts à une page de tableau. |
| `dsfr` | Composants, mise en page et règles de mise en forme du DSFR, utilisés par les modes ci-dessus. |

## Vérifications et livraison

Exécutez les vérifications documentées dans le `AGENTS.md` racine et rapportez les résultats réels des commandes.

À la date de rédaction :

```powershell
npm run build
```

`npm run build` exécute la compilation TypeScript et Vite. Le lint du client existe mais dépend actuellement de la migration vers la configuration plate d'ESLint 9. Le dépôt ne dispose d'aucun lanceur de tests unitaires, navigateur ou accessibilité configuré, ni de commande générique de squelette ou d'import, ni de flux de validation des pull requests. Une archive externe nécessite donc un import et une relecture manuels ainsi que ces vérifications locales ; ne la présentez pas comme validée automatiquement ni comme prête pour la production.
