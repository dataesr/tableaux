# MongoDB (tableaux)

Connexion côté serveur dans `server/src/services/mongo.js` (et `mongo-accessibility.js`). Les identifiants sont déjà configurés. **Confirmation de la cible requise** : le développeur confirme la collection exacte et la classification des données avant toute lecture ; l'accès doit être en lecture seule. Voir [`data-specs.md`](./data-specs.md).

## Contraintes

- Ne lisez ces données que depuis les routes serveur du tableau, jamais depuis le navigateur.
- Le serveur se connecte à MongoDB au démarrage et s'arrête en cas d'échec ; l'exécution locale de l'application nécessite donc la MongoDB que les développeurs du dépôt utilisent déjà.
- Aucun des tableaux actuels ne partage une collection ; les noms de collection sont propres à chaque tableau ou résolus à partir de l'enregistrement `boards`.

## Sans confirmation

Ne substituez pas de données d'exemple. Si le développeur n'a pas confirmé l'accès, arrêtez-vous et posez la question sur la source de données (voir [`data-specs.md`](./data-specs.md)).
