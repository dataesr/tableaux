# Spécifications des données

Posez ces questions avant toute conception ou tout code, une source à la fois. Utilisez le formulaire `ask_user` pour les réponses groupées. Ne devinez pas une réponse qui modifie le chemin des données.

## 1. Choix de la source

Posez cette question en premier, avant toute autre. La réponse est l'une des deux suivantes :

- **Source de données du dépôt :** `mongodb`, `elasticsearch`, `paysage`, `ods`, ou une source déjà listée dans le dépôt. Passez à la section 2.
- **Source de données définie par l'utilisateur :** l'utilisateur fournit la source (par exemple une API publique externe ou un fichier qu'il possède). Passez à la section 3.

Dans les deux cas, l'agent ne génère pas de données d'exemple.

## 2. Sources du dépôt (`mongodb`, `elasticsearch`, `paysage`, `ods`)

Ces sources sont en lecture seule, et leurs identifiants sont déjà configurés sur le serveur. Aucun jeton ni aucune clé n'est demandé à l'utilisateur, et l'agent ne lit jamais `.env` et n'affiche jamais un identifiant.

Chaque réponse est obligatoire avant que l'agent n'interroge la source :

- **Cible :** l'index exact (Elasticsearch), la collection (MongoDB) ou le jeu de données (ODS, Paysage).
- **Confirmation de la cible :** le développeur indique dans la session que la cible et la classification des données sont correctes.
- **Lectures autorisées :** les lectures de mapping ou de schéma (`GET _mapping`, listes de champs) sont autorisées après confirmation. Les documents d'exemple ne peuvent être lus qu'après confirmation, et uniquement pour inspecter les noms et types de champs. N'exportez ni ne stockez de documents dans le dépôt.
- **Champs :** l'agent peut lire le mapping Elasticsearch et poser des questions sur les champs, mais il ne doit pas écrire d'agrégations tant que les réponses ne sont pas obtenues :
  - Quels champs sont nécessaires ? Proposez quelques champs issus du mapping.
  - Quelle est la fenêtre temporelle et la cadence d'actualisation ? La métrique est-elle un instantané ou un cumul ?
  - Le tableau de bord doit-il dédupliquer les enregistrements, et selon quelle clé ?
  - Dans quelle langue les libellés doivent-ils être rédigés (français, anglais ou les deux) ?

## 3. Sources définies par l'utilisateur et sources externes

Une nouvelle source n'est pas encore configurée dans le dépôt. Posez ces questions avec le formulaire `ask_user` avant toute conception :

- **Origine :** l'URL, le fichier ou l'API publique (par exemple OpenAlex, EPO, Eurostat). Licence, date de récupération, et vérification des données personnelles (les données au niveau des auteurs peuvent relever du RGPD).
- **Accès :** la source nécessite-t-elle une clé ? Si oui, demandez le nom de la variable d'environnement du serveur (par exemple `OPENALEX_API_KEY`) et indiquez si elle est déjà définie. La valeur ne va que dans l'environnement du serveur, jamais dans le chat, le dépôt ou le code client.
- **Mode :** un appel en direct depuis le serveur du tableau, ou un instantané. Un appel en direct nécessite une mise en cache et une décision d'accès réseau de la plateforme. Voir [external.md](./external.md).
- **Périmètre de construction :** demandé en `build`, une fois l'emplacement du code décidé. Un **service commun** dans `server/src/services/`, réutilisable par d'autres tableaux, ou une construction **propre au tableau** dans `server/src/routes/boards/<board-id>/`. Par défaut, limitez-vous au tableau. Ne déplacez le code vers un dossier partagé que lorsqu'un second tableau en a besoin (`AGENTS.md` racine, « Garder le code dédié au tableau par défaut »).

## 4. Résultat des questions

Consignez les réponses dans le manifeste du tableau (`data_sources`) et résumez-les dans le rapport final. Ne créez pas de fichier de planification séparé.
