# Paramètres d'URL

S'applique aux paramètres de requête des pages des tableaux : l'état qu'un utilisateur peut garder en favori ou partager (onglet sélectionné, structure, période, filtres). Les routes API des tableaux utilisent les mêmes noms pour les mêmes notions.

## Règles générales

- Une page est un chemin (`/suivi-recherche/bibliometrie`) ; l'onglet sélectionné d'une page est le paramètre `section`, jamais un segment de chemin.
- Les noms sont en `snake_case`. Les notions partagées utilisent les noms du tableau ci-dessous, dans tous les tableaux de bord ; les paramètres propres à un tableau sont libres mais en `snake_case` (`perimetre`, `bac_type`).
- Un paramètre de page et le paramètre d'API de la même notion ont le même nom et la même valeur.
- Les valeurs sont des codes ou des identifiants, jamais des libellés, sauf `region` (voir plus bas).
- Les listes sont séparées par des virgules, sans espace : `year=2021,2022`. Les booléens valent `true` / `false` ; la simple présence d'un paramètre ne signifie rien.
- Les valeurs par défaut ne sont pas écrites dans l'URL : un paramètre absent vaut sa valeur par défaut ; quand l'utilisateur choisit de nouveau la valeur par défaut, supprimez le paramètre. N'ajoutez pas de paramètres au chargement de la page.
- Une valeur inconnue ou invalide revient à la valeur par défaut côté page (pas de plantage, pas de page blanche) ; la route API la valide et répond 400 (`BadRequestError`).
- Mettez à jour les paramètres avec `setSearchParams((previous) => …)` (ou à partir d'une copie des `URLSearchParams` courants) pour conserver les autres paramètres. Les liens internes à un tableau conservent la chaîne de requête courante.

## Vocabulaire commun

| Paramètre | Valeur | Absent signifie |
|---|---|---|
| `section` | Onglet sélectionné de la page, identifiant en kebab-case (`section=etablissements`) | Premier onglet |
| `language` | `fr` ou `en` | `fr` |
| `paysage_id` | Identifiant Paysage (`bxPQe`) ; plusieurs : séparés par des virgules | Périmètre national |
| `ror_id` | Identifiant ROR sans le préfixe d'URL (`02feahw73`) ; plusieurs : séparés par des virgules | Périmètre national |
| `include_components` | `true` pour inclure les composantes de la structure | `false` |
| `year` | Année seule, `AAAA` | Dernière année disponible |
| `year_min`, `year_max` | Bornes de la période, incluses, `AAAA` | Toute la période disponible |
| `academic_year` | `AAAA-AAAA` (`2023-2024`) | Dernière année disponible |
| `region` | Libellé de la région tel que fourni par la source de données (`Île-de-France`), encodé pour l'URL | Toutes les régions |
| `country_code` | ISO 3166-1 alpha-3 (`FRA`) | Valeur par défaut du tableau |

- Les identifiants de structure sont nommés d'après leur référentiel : `paysage_id`, `ror_id` ; un nouveau référentiel suit le même modèle (`<referentiel>_id`). N'utilisez jamais un `structure_id` générique, `entite` ni un identifiant interne de base de données.
- Un tableau documente le ou les référentiels qu'il accepte. La conversion entre référentiels se fait sur le serveur (par exemple, la route `meta` du tableau renvoie `paysage_id` à côté de `ror_id`), jamais dans le navigateur.
- `region` porte provisoirement le libellé utilisé par les sources de données, encodé avec `URLSearchParams` (jamais par concaténation de chaînes). Il passera à un code INSEE (`region_code`) quand les sources en exposeront un ; n'introduisez pas d'autres paramètres partagés dont la valeur est un libellé.
- Un seul niveau d'onglets par page dans `section`. Un choix imbriqué dans une section est un paramètre propre au tableau.

## Liens entre tableaux

- Construisez les liens entre tableaux avec un utilitaire partagé (à créer dans `client/src/utils/` avec le premier lien entre deux tableaux), qui ne transmet que les paramètres du vocabulaire commun. Les tableaux ne s'importent toujours pas les uns les autres.
- Le tableau cible ignore les paramètres qu'il ne connaît pas.
- Quand la cible utilise un autre référentiel, la page source obtient l'identifiant cible dans sa propre réponse d'API (`paysage_id` pour un lien de suivi-recherche vers financements-par-aap).

## Renommer un paramètre existant

- Gardez les anciens noms lisibles : au chargement, faites correspondre chaque ancien nom au nouveau et réécrivez l'URL avec `replace`, avant d'afficher la page, pour que les favoris et les liens partagés continuent de fonctionner. Gardez la table de correspondance dans le tableau (`legacy-params.ts`) et listez-la dans la pull request.
- Changez le nom du paramètre d'API et les fichiers de requêtes `.http` dans la même pull request.

## Liste de contrôle

- [ ] Les onglets utilisent `section` ; les pages utilisent des chemins.
- [ ] Les notions partagées utilisent les noms et formats de valeur communs.
- [ ] Aucune valeur par défaut n'est écrite dans l'URL ; les valeurs invalides reviennent aux valeurs par défaut.
- [ ] Mêmes noms dans l'URL de la page, la route API et les fichiers `.http`.
- [ ] Les anciens noms (s'il y en a) sont mis en correspondance et réécrits.
