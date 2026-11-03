# Mode : critique

En lecture seule. Lisez le code client et serveur du tableau, et signalez les constats. Ne modifiez aucun fichier. Pour les vérifications d'accessibilité, utilisez le mode [accessibility](./accessibility.md) et incluez ses constats bloquants dans le rapport.

Cible : un identifiant ou un chemin de tableau, par exemple `client/src/boards/<board-id>`.

## Ergonomie

- La page répond à la question énoncée dans le cahier des charges, et le premier écran affiche le résultat principal.
- Les filtres ont des libellés clairs, des valeurs par défaut et une réinitialisation visible. Modifier un filtre met à jour chaque graphique concerné.
- Chaque graphique a un titre, une unité et une courte description ou ligne de source (`ChartConfig`).
- Les états vide, de chargement et d'erreur sont gérés sur chaque page. Un filtre qui ne renvoie aucune donnée l'indique.
- Les libellés sont dans les langues prises en charge par le tableau (français, et anglais si multilingue), sans chaînes mêlant plusieurs langues.

## Exactitude des données

- La source de données correspond au cahier des charges validé. Aucun jeu de test, aucune donnée d'exemple ni aucun chiffre inventé n'apparaît dans le code, l'interface ou les routes.
- Les agrégations correspondent à leurs libellés : la métrique, l'année, le dénominateur et l'entité sont ceux confirmés par l'utilisateur.
- Les doublons, valeurs nulles et champs multivalués sont traités comme convenu avec le développeur et consignés dans le manifeste.
- La fenêtre temporelle et la fréquence de mise à jour sont indiquées dans l'interface ou le résumé.
- Les données personnelles ne sont ni affichées ni exportées au-delà de ce que le cahier des charges autorise ; les données agrégées sont privilégiées.
- Le navigateur n'appelle jamais directement une source de données ; tout accès passe par les routes du tableau.

## Utilisation du DSFR

- Les composants proviennent de `@dataesr/dsfr-plus` et sont utilisés conformément à [dsfr](../../dsfr/SKILL.md) ; aucun balisage `fr-*` brut inventé de mémoire ; **aucun composant DSFR réécrit à la main** (navigation, onglets, accordéon, modale, sélecteur…) — signalez chaque cas avec le composant dsfr-plus qui aurait dû servir.
- Le header, les liens d'évitement, `<main>` et le pied de page viennent de `Layout` (`client/src/layout/layout.tsx`, PR #201 de Victor), identiques dans tous les tableaux : signalez comme bloquant tout `fr-header`, barre de navigation, `<main>`, `<SwitchTheme />` ou liens d'évitement écrits dans le tableau, et toute option du header (lien « Explorer », sélecteur de langue) activée différemment des autres tableaux. Le reste du layout (footer, liens d'évitement, barre de filtres, cartes de chiffres clés) suit le board `template` ; signalez toute divergence de design.
- Le SCSS du tableau ne fait que disposer : signalez toute règle d'apparence (`color`, `background`, `border`, `box-shadow`, `border-radius`, `font-*`, états `:hover`/`:focus`/`[aria-current]`).
- Les couleurs sont des tokens de décision DSFR utilisés pour leur rôle (pas d'hex, pas de primitive, pas de token d'état hors de son état) ; aucun style de mise en page en ligne dans le nouveau code.
- Les titres suivent un ordre logique unique, et la page utilise les mises en page existantes du tableau.
- Le tableau est branché à tous les périmètres transverses : `Footer` partagé, `sitemap-config.ts` et route `plan-du-site`, titres de page (`title-i18n.json` + `useTitle`), liens contact et accessibilité résolus pour `?from=<board-id>` (enregistrement MongoDB, audit `tableaux_<board-id>`). Signalez chaque périmètre manquant comme bloquant.
- Aucun comportement réservé au JavaScript du DSFR n'est utilisé.

## Conformité à l'infrastructure

- Le tableau respecte `client/src/boards/AGENTS.md` et `server/src/routes/boards/AGENTS.md`.
- Le routeur serveur est monté dans `server/src/router.js`, et les chemins de route commencent par `/<board-id>/`.
- Les identifiants et jetons restent côté serveur ; aucun secret n'apparaît dans le code client, les journaux ou le manifeste.
- Le code partagé est réutilisé depuis `server/src/commons` ou `server/src/services` ; la logique propre au jeu de données reste dans le tableau.
- Les erreurs de données attendues sont affichées sur la page afin que l'utilisateur puisse ajuster les filtres.
- Code situé dans `server/src/routes/boards/<board-id>/` ou `client/src/boards/<board-id>/` qui est générique (par exemple un client API, un formateur, un wrapper DSFR, un helper de tri ou d'agrégation) et pourrait être partagé. Cherchez une seconde utilisation dans `server/src/commons`, `server/src/services`, `client/src/components` et dans les autres tableaux, et listez chaque candidat avec les fichiers concernés. Ne déplacez aucun code pendant une revue critique ; la décision de service commun revient à `build`.

## Rapport

Regroupez les constats par section, avec leur gravité (bloquant, à corriger, remarque), le fichier et la ligne, et une correction suggérée. Terminez par les vérifications qui n'ont pas été exécutées.
