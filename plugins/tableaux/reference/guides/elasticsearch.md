# Elasticsearch

Accès côté serveur aux clusters Elasticsearch configurés (identifiants `ES_TOKEN_*`) via le proxy Express `/elasticsearch`. Les identifiants sont déjà configurés. **Confirmation de la cible requise** : le développeur confirme l'index exact et la classification des données avant toute lecture, et l'accès doit être en lecture seule. Voir [`data-specs.md`](./data-specs.md).

## Contraintes

- Le navigateur n'appelle jamais le proxy. Les routes serveur du tableau l'appellent ; le client appelle les routes du tableau.
- Plusieurs tableaux existants appellent `/elasticsearch` depuis le navigateur (`template`, `tableaux-doc`, `valorisation-recherche-innovation`, `financements-par-aap`, `teds`). C'est un schéma hérité ; ne le reproduisez pas.
- Il n'existe aucune liste d'index approuvés à l'échelle du dépôt. Consignez tout index approuvé dans le manifeste du tableau et faites-le relire.
- Les noms de champs et la structure des documents diffèrent selon l'index ; inspectez un document d'exemple avant d'écrire des agrégations.

## Sans confirmation

Ne substituez pas de données d'exemple. Si le développeur n'a pas confirmé l'accès, arrêtez-vous et posez la question sur la source de données (voir [`data-specs.md`](./data-specs.md)).
