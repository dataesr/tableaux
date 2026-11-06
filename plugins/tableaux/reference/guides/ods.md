# Opendatasoft (ODS)

L'API Opendatasoft, configurée via `ODS_API_URL` / `ODS_API_KEY`, utilisée par `structures-finance`. Les identifiants sont déjà configurés. **Confirmation de la cible requise** : le développeur confirme le jeu de données avant toute lecture ; l'accès doit être en lecture seule. Voir [`data-specs.md`](./data-specs.md).

## Contraintes

- Appelez-la depuis les routes serveur du tableau, jamais depuis le navigateur. `structures-finance` procède ainsi et ajoute un cache en mémoire (environ 5 minutes) ; suivez ce modèle pour un appel externe en direct.
- Mettez en cache les appels en direct : les API externes ont des limites de débit, et chaque réponse doit résister à un incident en amont.

## Sans confirmation

Ne substituez pas de données d'exemple. Si le développeur n'a pas confirmé l'accès, arrêtez-vous et posez la question sur la source de données (voir [`data-specs.md`](./data-specs.md)).
