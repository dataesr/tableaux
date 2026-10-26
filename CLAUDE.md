# CLAUDE.md

Contexte pour Claude Code sur le repo **tableaux** (dataesr) : tableaux de bord de données de l'enseignement supérieur et de la recherche.

## Stack

- Monorepo npm workspaces, Node 24 : `client/` + `server/`.
- **client** : React 19, TypeScript, Vite 7, react-router 7, TanStack Query, Highcharts (via `highcharts-react-official`), DSFR via `@dataesr/dsfr-plus`, SCSS.
- **server** : Express 4 (ESM, JS pur), MongoDB, proxy Elasticsearch, logger winston.
- En prod, le build Vite du client est copié dans `server/dist` et servi par Express (voir `Dockerfile`).

## Commandes

```bash
npm i                                  # installation (racine, installe les deux workspaces)
npm start                              # client (http://localhost:5173) + server (http://localhost:3000) en parallèle
npm run build                          # build prod du client vers server/dist
npm run build:staging                  # build staging
cd client && npx tsc --noEmit          # typecheck : LA vérification à lancer après chaque modif client
```

- Avant de rendre la main : `npx tsc --noEmit` dans `client/`, puis donner à l'utilisateur la route à ouvrir et quoi vérifier (thème sombre, mobile, clavier, états vides). Une page se valide à l'œil, dans l'app qui tourne.
- Il n'y a **pas de tests automatisés**. Les routes serveur se testent avec les fichiers `.http` dans `server/src/routes/**/api-tests/`.
- `npm -w client run lint` est **cassé** (ESLint 9 sans `eslint.config.js`). Ne pas s'y fier ; se caler sur le style du code voisin.
- Ne jamais lancer `npm run deploy:*` : ces scripts bumpent la version, mergent `staging` dans `main` et poussent des tags (déploiement prod).

## Variables d'environnement

Les fichiers `.env` contiennent des secrets : **ne pas les lire ni afficher leurs valeurs**. Les noms utilisés sont visibles dans le code (`import.meta.env.VITE_*` côté client, `process.env.*` côté serveur, ex. `MONGO_URI`, `ES_TOKEN_SCANR`, `VITE_APP_SERVER_URL`).

## Architecture

### Boards (tableaux de bord)

Chaque tableau de bord est un dossier `client/src/boards/<board-id>/`. La liste des boards vient de MongoDB (collection `boards`, via `GET /api/admin/list-dashboards`) et `client/src/router.tsx` charge dynamiquement `./boards/${id}/routes.tsx`. **Le nom du dossier doit être identique à l'`id` en base.**

Structure type (référence : `client/src/boards/template/`) :

```
boards/<board-id>/
  routes.tsx              # Routes du board, RouteWithTitle + title-i18n.json
  title-i18n.json         # Titres des pages { key: { fr, en } }
  sitemap-config.ts       # Optionnel, BoardSitemapConfig (plan du site + footer)
  styles.scss
  components/layouts/     # global-layout.tsx, sidemenu-layout.tsx
  pages/<page>/
    index.tsx
    charts/<chart-name>/
      index.tsx           # useQuery + ChartWrapper
      utils.tsx           # getOptions / getSeries (fonctions pures)
```

Côté serveur, les routes spécifiques d'un board sont dans `server/src/routes/boards/<board>/` (`index.js` qui agrège `routes/*.js`) et doivent être enregistrées dans `server/src/router.js` (ordre alphabétique). Toutes les routes sont préfixées par `/api`.

### Graphiques

- Toujours passer par `client/src/components/chart-wrapper` (`<ChartWrapper config={config} options={options} />`) : il gère les modules Highcharts, l'export, l'accessibilité, le footer (sources, commentaire) et le code d'intégration.
- `config` contient au minimum `id`, `title` et `integrationURL: "/integration?chart_id=<id>"`.
- Pendant le chargement, afficher `DefaultSkeleton` (`components/charts-skeletons/default.tsx`).
- Requêtes de données : `useQuery` avec une `queryKey` incluant tous les filtres, `fetch(\`${VITE_APP_SERVER_URL}/...\`)`. Les requêtes Elasticsearch passent par `POST ${VITE_APP_SERVER_URL}/elasticsearch?index=...`.
- Pour qu'un graphique soit intégrable en iframe, l'ajouter dans `client/src/boards/integration/charts-registry.tsx` (voir `client/src/boards/integration/README.md`).

### i18n

Convention principale (sans lib) : fichiers `i18n.json` / `title-i18n.json` au format `{ "cle": { "fr": "...", "en": "..." } }`, lus avec `getI18nLabel(i18n, key, currentLang)` depuis `client/src/utils.tsx`. La langue courante vient du query param `?language=` (défaut `fr`). Toujours fournir `fr` ; `en` si le board est multilingue. `react-intl` (`IntlProvider` / `FormattedMessage`) n'est utilisé que ponctuellement (`boards/european-projects/pages/home`) : ne pas l'étendre ailleurs sans demande.

### DSFR et accessibilité

Le site est un site public de l'État : le RGAA s'applique (beaucoup de correctifs récents portent là-dessus, ex. #166). Le DSFR passe par `@dataesr/dsfr-plus`, qui embarque le CSS de `@gouvfr/dsfr` 1.11.0. Détails, pièges CSS et états à couvrir : skill `dsfr` (`.claude/skills/dsfr/SKILL.md`), à suivre pour tout code d'interface.

Règles non négociables :

- **Le JS du DSFR n'est jamais chargé.** Les comportements viennent de dsfr-plus, de l'élément natif ou d'un état React. Du balisage qui s'appuie sur `data-fr-opened`, `.disclose()` ou une `fr-modal` / `fr-collapse` sans état React ne fait rien.
- **Pas de HTML DSFR écrit de mémoire.** Composant dsfr-plus d'abord ; sinon, lire `node_modules/@gouvfr/dsfr/example/component/<nom>/index.html` avant d'écrire du `fr-*`.
- Pas de couleur hex en dur ni de `style={{}}` de mise en page dans du nouveau code : tokens DSFR (`var(--…)`) et utilitaires `fr-*`, pour que le thème sombre (`data-fr-theme`) fonctionne.

## Règles d'architecture

- **Le partagé se mérite** : un composant, un hook ou un utilitaire ne remonte dans `client/src/components|hooks|utils` qu'au moment où un deuxième board en a besoin. Jamais par anticipation.
- **Un board n'importe pas un autre board.** Seul `boards/integration/charts-registry.tsx` le fait, par construction. Deux boards qui partagent passent par l'étage commun.
- **Accès aux données** : si le board a un module `api/` (`devenir-etudiants`, `european-projects`, `structures-finance`), y ajouter le hook (`useQuery`) et l'importer depuis le composant. Sinon, suivre le pattern local du board. Ne pas refactorer l'existant sans demande.
- **Erreurs côté client** : les erreurs attendues (pas de données pour un filtre, 4xx) restent dans la page, affichées sur place. On ne démonte jamais les filtres pour une page d'erreur.
- **Erreurs côté serveur** : dans du nouveau code, lever les classes de `server/src/commons/errors` (`BadRequestError`, `NotFoundError`…), que `handleErrors` traduit en statut + JSON, plutôt qu'un `res.status(500)` ad hoc ou un `new Error` nu.
- **Logs serveur** : `logger` (`server/src/services/logger.js`, winston), pas `console.log`, qui sert seulement au debug local.
- **Variables `VITE_*`** : elles sont gravées dans le bundle client au build (le mode `staging` / `production` est un choix de build). Jamais de secret dans un `VITE_*` ; les secrets restent côté serveur (`process.env`).
- `client/public/` sert les fichiers aux URL stables (référencés de l'extérieur) ; un asset importé depuis `src/` est haché.

## Conventions

- Imports avec extension explicite (`./utils.tsx`, `./routes/overview.js`) ; côté serveur, ESM avec `.js` obligatoire.
- Indentation 2 espaces, double quotes. Le style (points-virgules ou non) varie selon les fichiers : suivre celui du fichier modifié.
- Textes UI, commentaires et docs majoritairement en français.
- Branches : le travail se fait sur `staging` (déployé automatiquement sur https://tableaux.staging.dataesr.ovh). `main` = prod, mise à jour uniquement par les scripts de déploiement.
- Commits : Conventional Commits avec scope = board ou composant, et référence d'issue si pertinent. Ex : `fix(devenir-etudiants): restore accessible remove buttons`, `fix(accessibility): ..., see #166`. Types reconnus par le changelog (`.github/config/changelog.js`) : `feat`, `fix`, `improvements`, `refactor`, `perf`, `build`, `ci`, `docs`, `test`, `style`, `chore`.
