# Mode : accessibility

En lecture seule par défaut. Le référentiel visé est le RGAA 4 (le référentiel français du secteur public, fondé sur WCAG 2.1 AA), et l'objectif est la **conformité complète** : tout constat est bloquant, quelle que soit sa gravité apparente ; une régression d'accessibilité est un bug. Cette liste sert aussi **pendant l'écriture** (modes `build` et `chart`), pas seulement en relecture. Lisez le code des pages, des composants et des graphiques, et signalez les constats avec le critère auquel ils se rapportent. Utilisez [dsfr](../../dsfr/SKILL.md) pour un usage correct des composants avant de proposer une correction. Ne modifiez des fichiers que si l'utilisateur demande des corrections.

Cible : un identifiant ou un chemin de tableau, par exemple `client/src/boards/<board-id>`.

## Clavier et focus

- Chaque contrôle (filtres, onglets, boutons de graphiques, tris de tableaux, boutons d'export ou de copie) est accessible et utilisable au clavier seul, dans un ordre logique.
- Le focus est visible et jamais supprimé par des styles personnalisés. La fermeture d'un panneau ou d'un select renvoie le focus vers un élément pertinent.
- Aucun piège clavier dans les widgets personnalisés tels que `ItemFilter` ou `Select`.
- Les éléments natifs (`button`, `a`, `select`) sont privilégiés aux rôles ARIA sur des `div`.

## Noms, libellés et langue

- Chaque champ de formulaire a un libellé visible, relié par `for`/`id` ou par la propriété `label` du composant. Les placeholders ne sont pas des libellés.
- Les boutons et liens ont un nom compréhensible hors contexte (pas de « Voir plus » seul, pas de contrôle réduit à une icône sans libellé).
- La page a un attribut `lang` correspondant à sa langue et un titre qui identifie la page.
- Les passages dans une autre langue sont signalés par `lang`.

## Couleur et contraste

- Le texte et les éléments essentiels de l'interface atteignent un contraste d'au moins 4,5:1 (3:1 pour les grands textes et les composants d'interface), en utilisant les tokens DSFR.
- L'information n'est pas transmise par la couleur seule. Les séries de graphiques disposent d'un second repère (motif, marqueur, étiquette ou entrée de légende textuelle).
- Aucune couleur codée en dur dans le nouveau code. Les couleurs issues de `useChartColor` sont vérifiées par rapport à l'arrière-plan.
- Le contenu reste lisible lorsque le texte est agrandi à 200 % et lorsque la page se réorganise à une largeur de 320 px.

## Graphiques et données

- Chaque graphique `ChartWrapper` dispose d'une alternative textuelle : un titre et une description (`ChartConfig.description`) qui énoncent l'essentiel, **et** un tableau de données : celui que `ChartWrapper` génère nativement via Highcharts (`viewData`) par défaut, ou un `renderData` sur mesure lorsque le tableau natif n'est pas lisible tel quel (clés qui ne sont pas des libellés, valeurs sans unité ni format, plusieurs axes mélangés). Vérifiez le tableau réellement affiché, pas seulement la présence du bouton « Données ».
- Les réglages d'accessibilité de Highcharts (navigation au clavier, description pour lecteur d'écran) ne sont pas désactivés sans raison.
- Le contenu des info-bulles est accessible au focus comme au survol.
- Les états de chargement, vide et d'erreur sont annoncés aux technologies d'assistance (`role="status"` ou `role="alert"`, ou le composant DSFR équivalent).
- Les squelettes (skeletons) ne remplacent pas un message indiquant que la page se charge.

## Structure et titres

- Un seul `h1` par page ; les titres suivent un ordre logique, sans niveaux sautés.
- Les repères (`header`, `nav`, `main`, `footer`) proviennent des mises en page des tableaux ; ne les supprimez pas.
- Les tableaux utilisent `th` avec `scope`, ainsi qu'une légende ou un nom accessible.
- Les liens d'évitement et la navigation répétée sont fournis par les mises en page existantes ; ne les supprimez pas.

## Animation et médias

- Aucun contenu ne clignote plus de trois fois par seconde. Les animations respectent `prefers-reduced-motion`.
- La lecture automatique des médias est évitée. Toute image de texte dispose d'une alternative.

## Rapport

Listez chaque constat avec son critère RGAA, le fichier et la ligne, l'impact et la correction. Ne les triez pas en « bloquants » et « à corriger plus tard » : tous doivent être corrigés avant livraison. Indiquez quelles vérifications ont été faites par simple lecture du code. Recommandez un test manuel au clavier et avec un lecteur d'écran sur la page finale, puisque cette relecture n'exécute pas la page.
