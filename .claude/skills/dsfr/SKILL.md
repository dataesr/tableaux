---
name: dsfr
description: Écrire ou relire de l'interface DSFR dans tableaux avec @dataesr/dsfr-plus — échelle de décision (composant → utilitaires fr-* → balisage fr-* vérifié → SCSS sur tokens), classes utilitaires, pièges CSS du DSFR et leur remède, états à couvrir, composants propres à un board. À consulter avant d'écrire ou de modifier une page, un layout, un composant ou du SCSS dans client/src.
---

# Interface DSFR dans tableaux

Le DSFR arrive par `@dataesr/dsfr-plus`, dont le JS importe `@gouvfr/dsfr/dist/dsfr.min.css` et `utility/utility.min.css` (`@gouvfr/dsfr` **1.11.0**, installé en peer) ; son propre `style.css` n'ajoute que des icônes. Pour vérifier qu'un token ou une classe existe : `grep` dans ces fichiers. Les comportements viennent de React, sauf les modales du header/footer partagés (§ JS DSFR).

## 0. Principes

### Deux sources priment sur la mémoire

Ne jamais écrire du balisage `fr-*` de mémoire : ce sera subtilement faux (classe inventée, ARIA manquante, structure d'une autre version).

1. **Les types de dsfr-plus** : `node_modules/@dataesr/dsfr-plus/dist/components/<Composant>/*.d.ts`. Si TS refuse une prop, elle n'existe pas — ne pas caster.
2. **`node_modules/@gouvfr/dsfr/example/component/<nom>/index.html`** : le DOM et l'ARIA canoniques, à la version installée. À lire avant d'écrire à la main le moindre balisage `fr-*`.

### JS DSFR

`DSFRConfig` (`main.tsx`) charge et démarre le JS du DSFR : les modales `fr-modal` pilotées par `data-fr-opened` / `aria-controls` fonctionnent pour le `Header` et le `Footer` partagés (menu mobile, thème, langue). Ailleurs, le JS DSFR agit sur des nœuds que React possède : ne pas compter dessus. Ordre des comportements : composant dsfr-plus → élément natif (`<details>`, `<dialog>`, `<select>`) → état React (`useState` + `aria-expanded` + classe/rendu conditionnel). Pour fermer une modale DSFR après une navigation, voir `concealModal` dans `layout/header`.

Il reste du balisage de ce type dans le code existant (sélecteurs de thème / langue des `global-layout.tsx`, accordéons faits main) : ne pas le recopier dans du nouveau code.

### L'échelle de décision — dans cet ordre

1. **Composants dsfr-plus** : `Container`/`Row`/`Col`, `Title`/`Text`, `Button`, `Badge`, `Tag`, `Alert`, `Notice`, `Accordion`, `Modal` (+ `ModalTitle`, `ModalContent`, `ModalFooter`), `Tabs`, `SegmentedControl`, `Select`, `Autocomplete`, `Checkbox`, `Radio`, `Toggle`, `Input`, `SearchBar`, `Breadcrumb`, `SideMenu`, `Header`/`Nav`, `Pagination`, `Stepper`, `Spinner`, `Toast`…
2. **Composants partagés du repo** : `client/src/components/` (`chart-wrapper`, `charts-skeletons`, `select`, `item-filter`, `callout`, `copy-button`…). Les chercher avant d'écrire, mais vérifier leur accessibilité : `searchable-select` (options en `div onClick`, `id` fixe) et `breadcrumb` (`fr-collapse` sans état) ne sont pas utilisables au clavier / sur mobile. Attention : `Autocomplete` de dsfr-plus est une **barre de recherche** (formulaire + bouton « Rechercher », saisie libre, pas de libellé visible, popover modal), pas un sélecteur — la sélection au clic n'y fonctionne pas comme attendu. Pour choisir dans une longue liste : `<input list>` + `<datalist>` natif dans un `fr-input-group` (exemple : `boards/suivi-recherche/components/selection`) ; pour une liste courte : `Select` de dsfr-plus.
3. **Utilitaires `fr-*`** pour l'espacement, la typo, les couleurs (§1).
4. **Balisage `fr-*` brut** — seulement si rien ne le couvre, et après lecture de l'exemple canonique.
5. **SCSS sur mesure** en dernier recours, sur tokens uniquement (§4).

**Proscrits dans du nouveau code** : `style={{}}` pour la mise en page, classes `fr-*` inventées, couleurs hex en dur (ça casse le thème sombre, piloté par `data-fr-theme`), JS DSFR, `!important`.

### Couplages d'ossature — ce qu'on ne devine pas

| Élément DSFR | Hypothèse tacite / ce qui casse | Dans tableaux |
|---|---|---|
| `fr-header` / `fr-nav` | Sur mobile, nav et outils peuvent dépendre d'une `fr-modal` pilotée par le JS DSFR ; les sous-menus ont aussi des seuils responsive. Vérifier les comportements réels des composants dsfr-plus et du board avant de composer header et navigation. | Tester au tactile et au clavier ; ne pas supposer qu'un attribut DSFR déclenche un comportement React. |
| En-tête, menu horizontal, liens d'évitement, `<main>` | Les copies à la main divergent (icône « Accueil » oubliée, barre de nav maison, skiplinks dupliqués, `id` de modale en double). | **`layout/layout.tsx` (`Layout`) + `layout/header`** : un seul header, une seule série de skiplinks, un seul `<main id="main-content">`. Le board passe `items` (Accueil en premier, `icon: "home-4-line"`), `serviceName` / `serviceTag`, `languageSelector` et `exploreLink` (désactivés par défaut), `themeSwitch`, `extra` (outils du header), `navExtra` (barre de menu). Ne jamais écrire de header, de nav, de `<main>` ni de `<SwitchTheme />` dans un board ou une page. |
| `fr-container` | Plafonne et centre ; **deux conteneurs imbriqués doublent la gouttière**. | Un seul `Container` par niveau de page. |
| `fr-container--fluid` (`Container fluid`) | Pose `overflow: hidden` : **tue `position: sticky`** en silence. | Ne pas l'utiliser autour d'un élément sticky (sidemenu, filtres collants). |
| `fr-sidemenu` | Un sommaire secondaire en page, pas une nav principale. | `SideMenu` pour les sommaires des boards. |
| `fr-grid-row` / `fr-col` | Grille de contenu à 12 colonnes, niveau page. | `Row`/`Col` pour la page ; dans un composant, une grille/flex SCSS avec `gap`. |
| `fr-btns-group` | Force la largeur des enfants (actions de formulaire). | Pas pour une simple rangée de boutons. |
| `fr-modal`, `fr-tabs`, `fr-accordion`, `fr-collapse`, `fr-toggle`, `fr-segmented`… | Hydratés par le JS DSFR sur des nœuds que React possède. | Les composants dsfr-plus correspondants. |

## 1. Les utilitaires DSFR utiles

**Espacement** — `v` = 0.25rem, `w` = 0.5rem (`2w` = 1rem) : `fr-m{t|b|l|r|x|y}-{n}{v|w}`, `fr-p…` (ex. `fr-mb-2w`, `fr-px-3v`, `fr-mt-0`). `fr-mb-0` est le cheval de trait (§3.1).

**Typographie** — `fr-text--xs|sm|md|lg|lead`, `fr-text--bold|regular|light` ; `fr-h1`…`fr-h6` utilisables sur n'importe quelle balise (`<p className="fr-h4">` pour une valeur chiffrée). Le corps fait 1rem : réserver `fr-text--sm` aux mentions et notes, pas au « texte un peu plus petit ». Couleurs : `fr-text-mention--grey`, `fr-text-title--grey`, `fr-text-default--{error|success|warning|info}`.

**Icônes** — `fr-icon-<nom>` sur un `<span aria-hidden="true">`, taille `fr-icon--sm|md|lg` ; ou la prop `icon` des composants dsfr-plus, **sans préfixe** : `Button` génère `fr-icon-${icon}` (`icon="download-line"`). Le `Callout` du repo (`components/callout.tsx`), lui, prend la classe complète (`icon="fr-icon-information-line"`). Vérifier que l'icône existe par `grep` dans les CSS (§ intro). Un bouton à icône seule porte un `aria-label` (ou `title`), pas un texte masqué à la main.

**Divers** — `fr-sr-only` (masqué visuellement, lu par les lecteurs d'écran), `fr-hidden` / `fr-unhidden-{bp}`, `fr-raw-link` (§3.2), `fr-background-alt--grey`, `fr-background-contrast--grey` pour les surfaces.

## 2. Composition

- **Gouttières plutôt que marges entre frères** : le parent (flex/grid avec `gap`, ou `Row gutters`) porte l'espace ; un enfant ne porte pas de marge extérieure. Les marges sont pour le flux de la prose.
- **Un rythme par surface** : `2w` par défaut, `1w` pour une liste serrée, `3w` pour un jeu de cartes. On varie entre groupes, pas à l'intérieur.
- **L'espace fait la hiérarchie** : plus d'espace au-dessus d'un titre de section qu'en dessous.
- **Gauche/droite** (titre + actions, libellé + valeur) : un flex `justify-content: space-between` — jamais de `float`, de positionnement absolu ni de grille à 2 colonnes.
- **La prose** (méthodologie, FAQ, mentions) garde les marges natives du DSFR : ne pas tout emballer dans des conteneurs flex.
- Les tableaux de bord méritent la largeur : graphiques et filtres ne sont pas une colonne de lecture.
- Ne pas tout mettre en cartes, ne jamais imbriquer une carte dans une carte : à l'intérieur, la hiérarchie vient de la typo et de l'espacement.
- Une rangée de filtres : une seule taille de champ, une seule famille visuelle. Les critères (« quel sous-ensemble ») sont des champs ; les contrôles d'affichage (« comment afficher » : export, vue) sont des boutons.

## 3. Pièges CSS du DSFR — symptôme, cause, remède

1. **Marges de `fr-text--*` / `fr-h*` / `<p>` dans le chrome** — un libellé décale une barre, une carte a un vide sous chaque ligne. Chaque classe de texte porte un `margin-bottom` (`--text-spacing` / `--title-spacing`, 1.5rem), et un conteneur flex bloquifie ses enfants. Remède : `fr-mb-0` sur chaque élément texte d'une carte ou d'une barre ; dans une barre dense, `--text-spacing: 0; --title-spacing: 0;` une fois sur la barre. Pas dans la prose.
2. **Tout `a[href]` est stylé** — soulignement en `background-image` (pleine largeur dans un flex en `stretch`), flèche des liens externes, couleur imposée. Remède : `fr-raw-link` sur le sous-arbre, ou dans le SCSS du composant `background-image: none; --underline-idle-width: 0; --underline-hover-width: 0;` ; aligner les liens sur `flex-start`.
3. **`<hr>` a un padding** (`padding: var(--text-spacing)`). Remède : `padding: 0` sur tout séparateur maison.
4. **Champs désalignés dans une ligne de filtres** — `.fr-input-group:not(:last-child)` / `.fr-select-group` ont une marge basse, `fr-input` une marge haute après le label. Remède : neutraliser ces marges sur les enfants directs de la rangée avec une spécificité supérieure (classe de la rangée + classe du groupe), et masquer les `.fr-messages-group` vides.
5. **Teinte de survol sur tout `button`** — le DSFR teinte `button:not(:disabled)` via `--hover-tint` / `--active-tint`. Remède : redéfinir la variable (`--hover-tint: var(--background-contrast-grey)`), ne pas combattre la règle ; sur une surface déjà teintée, monter d'un cran (`--background-contrast-grey-hover`).
6. **Anneaux de focus différents** — un `<input>` montre l'anneau au clic, un bouton seulement au clavier (`:focus-visible`). C'est voulu : ne pas « corriger ».
7. **Case à cocher décalée** — le DSFR dessine la case en `label::before` à `left: -1.5rem`, relatif au `margin-left` du label. Ne compacter que les marges de bloc, jamais ce `margin-left`.
8. **Les défauts navigateur sont remis à zéro** (listes, `<dialog>`, titres) : ajouter l'espacement par les utilitaires, ne pas supposer qu'il existe.
9. **Un seul `::before`** — les icônes `fr-icon-*` dessinent dans `::before`, la surcouche de `fr-enlarge-link` aussi : un lien couvrant qui porte une icône perd sa surcouche (le clic ne marche que sur le texte). Mettre l'icône à droite (`::after`) ou dans un `<span>` séparé.
10. **Focus dans un popup maison** — un anneau extérieur peut être rogné par les bords. Préserver l'indicateur de focus ; si un style spécifique est indispensable, utiliser un token DSFR vérifié et une règle localisée au popup plutôt qu'une couleur codée en dur.

## 4. Composants propres à un board

- **Composer d'abord** : la plupart des « composants sur mesure » sont des composants dsfr-plus + utilitaires typo/espacement.
- **Les tokens font l'apparence DSFR** : couleurs par variables de décision (`var(--text-mention-grey)`, `var(--background-alt-grey)`, `var(--border-default-grey)`…), jamais d'hex — c'est ce qui garde le thème sombre gratuit. Ombres : `var(--raised-shadow)`, `var(--overlap-shadow)`. Pour les graphiques, les couleurs passent par `useChartColor`, `client/src/utils/colors.ts` et les `colors.scss` des boards, qui gèrent le thème.
- **Sémantique** : un vrai `<button type="button">` ou `<a href>` reçoit focus, teintes et clavier du DSFR ; un `div onClick` jamais. On surcharge les opinions DSFR non voulues (§3), on ne dégrade pas l'élément.
- **SCSS** : colocalisé (`styles.scss` à côté du composant), classes préfixées par le board, en reprenant le préfixe déjà en place (ex. `ep-…` pour european-projects, `outcomes-…` pour devenir-etudiants, `atlas-…`) ; ne jamais créer de classe `fr-*`, propriétés logiques (`margin-inline`, `padding-block`), pas d'`!important`.
- **Échelle d'extraction** : 1 usage = local au board ; besoin réel dans un 2ᵉ board = remonter dans `client/src/components/`. Jamais par anticipation, jamais par copier-coller entre boards. Un board n'importe pas les fichiers d'un autre board (seul `boards/integration/charts-registry.tsx` le fait, par construction).

## 5. Construire et valider

- **Ordre** : structure avec de vraies données (libellés français réels, volumes réels) → mise en page → typo et couleurs → états interactifs → états limites → responsive.
- **États de chaque élément interactif** : normal, survol, focus (dessin distinct du survol), actif, désactivé, chargement, erreur, vide.
  - Chargement : `DefaultSkeleton` (ou les autres `charts-skeletons`) ; `Spinner` réservé aux actions.
  - Vide : un message qui explique quoi faire (changer de filtre, d'année…), pas un graphique vide.
  - Erreur attendue (filtre sans résultat, 4xx) : affichée sur place (`Alert`, `Notice`) sans démonter la page ni les filtres.
- **États limites** : 0 élément, 1 élément, des centaines, des libellés très longs (noms d'établissements), années sans données.
- **Accessibilité (RGAA)** : `id` uniques via `useId`, chaque champ a un `<label>`, ordre de titres cohérent (un seul `h1` par page), information jamais portée par la seule couleur, contrastes via les tokens.
- **Validation humaine** : on ne voit pas le rendu. Lancer les vérifications indiquées dans le `AGENTS.md` racine, relire contre le §3, puis donner à l'utilisateur **la route à ouvrir** (`http://localhost:5173/<board>/<page>`) et une **liste de vérification** : thème clair/sombre, mobile, navigation clavier, états vides et limites à déclencher.
