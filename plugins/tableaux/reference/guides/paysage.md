# API Paysage

API de référentiel externe sur les structures de l'enseignement supérieur et de la recherche français, configurée via `PAYSAGE_API_URL` / `PAYSAGE_API_KEY`. Les identifiants sont déjà configurés. **Confirmation de la cible requise** : le développeur confirme le jeu de données avant toute lecture ; l'accès doit être en lecture seule. Voir [`data-specs.md`](./data-specs.md).

## Contraintes

- Appelez-la depuis les routes serveur du tableau, jamais depuis le navigateur.
- `atlas` et `european-projects` contiennent chacun un client Paysage dupliqué. N'en ajoutez pas une troisième copie : si votre tableau a besoin de Paysage, réutilisez un client partagé ou proposez son extraction dans `server/src/services` (listez-le dans `common_candidates`).

## Sans confirmation

Ne substituez pas de données d'exemple. Si le développeur n'a pas confirmé l'accès, arrêtez-vous et posez la question sur la source de données (voir [`data-specs.md`](./data-specs.md)).
