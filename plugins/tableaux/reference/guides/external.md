# Sources publiques externes

Données publiques non hébergées par le projet : OpenAlex, EPO, Eurostat, ou toute autre base de données ou site public. **Confirmation requise** pour toute nouvelle source : le développeur confirme la source, les champs, la licence, le nom du jeton si l'un est nécessaire (jamais sa valeur), et si la source devient un service commun ou une construction propre au tableau.

## Contraintes

- **En direct :** les routes serveur du tableau appellent l'API au moment de la requête. Cela nécessite une mise en cache, une gestion des limites de débit et une décision d'accès réseau par le responsable de la plateforme. Le navigateur n'appelle jamais l'API externe.

- **Instantané :** une copie datée de la source, extraite une seule fois par une commande documentée, puis servie par les propres routes du tableau. Le tableau n'interroge jamais la source pour un instantané. Utilisez-le lorsque la source est soumise à des limites de débit, volumineuse, sensible sur le plan de la licence, ou lorsque les chiffres doivent être reproductibles à une date donnée.

## Instantanés

Un instantané correspond à ce que la source publique a renvoyé, stocké avec sa provenance. Il ne contient **que des données réelles** : jamais un jeu de test, un échantillon, ni un fichier écrit ou généré à la main.

### Enregistrement de provenance (obligatoire)

Chaque instantané dispose d'un enregistrement de métadonnées stocké à côté des données :

- `source` : nom de la source publique (par exemple `OpenAlex`).
- `endpoint` : URL de base et requête ou filtres exacts utilisés.
- `retrieved_at` : date et heure ISO 8601 de l'extraction.
- `source_date` : date des données propres à la source, lorsqu'elle existe.
- `licence` : telle qu'indiquée par la source, avec son URL.
- `record_count` : nombre d'enregistrements stockés.
- `sha256` : somme de contrôle des données stockées.
- `command` : le script ou la commande qui a produit l'instantané.

### Options de stockage

| Option | Emplacement | À utiliser quand | Contraintes |
| --- | --- | --- | --- |
| Fichier local | `server/src/routes/boards/<board-id>/snapshots/` : un fichier de données JSON ou NDJSON et son fichier de métadonnées | Petits extraits agrégés (quelques Mo au maximum), avec une licence autorisant la redistribution | Versionné dans git, ce qui fait grossir le dépôt. |
| Collection MongoDB | Une collection de la base Mongo du tableau, avec la provenance dans un document de métadonnées | Extraits volumineux ou souvent interrogés. Précédent : `suivi-recherche` stocke `snapshot_openalex` (source et date) dans `biblio_meta`, calculé hors ligne. | L'écriture nécessite une approbation humaine explicite. Le tableau la lit en lecture seule. |
| Index Elasticsearch | Un index dédié, lu via le proxy `/elasticsearch` | Extraits volumineux ou très orientés recherche | La création d'index nécessite une approbation humaine explicite, et le mapping est documenté. |

L'emplacement des instantanés relève du choix du développeur pour chaque source. Utilisez le tableau ci-dessus pour en recommander un : un fichier local pour les petits extraits agrégés, MongoDB pour les extraits volumineux ou souvent interrogés. Consignez le choix dans le manifeste du tableau.

### Règles

- Un instantané est produit par un script ou une commande documentée, et la `command` figurant dans les métadonnées doit reproduire le `sha256`. N'écrivez jamais un instantané à la main.
- Une actualisation crée un nouvel instantané daté. Conservez le précédent jusqu'à ce que le tableau bascule sur le nouveau, afin de pouvoir comparer les chiffres.
- Les routes du tableau ne lisent que l'instantané. Leur réponse utilise la forme standard `{ data, provenance }`, où `provenance` reprend `source`, `source_date`, `retrieved_at` et `licence` de l'enregistrement de métadonnées.
- La cadence d'actualisation est manuelle et elle est indiquée dans l'interface ou dans le résumé final.

## Exemples

- **OpenAlex** — œuvres, institutions, sources, financeurs. API gratuite, CC0 pour les métadonnées, aucune clé nécessaire, limites de débit.
- **EPO** (brevets) — API OPS, inscription obligatoire, limites de débit.
- **Eurostat** — API SDMX/JSON, gratuite, sans clé.

Chacune est appelée uniquement depuis les routes serveur du tableau, avec un cache pour les appels en direct.
