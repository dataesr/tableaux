# Mode : init

Clarifiez la demande et la source de données. Ce mode n'écrit aucun fichier et n'exécute aucune requête.

## Étapes

1. Lisez le `AGENTS.md` racine, `client/src/boards/AGENTS.md`, `server/src/routes/boards/AGENTS.md` et `plugins/tableaux/reference/README.md`.
2. Demandez l'objectif, le public et la question à laquelle le tableau de bord répond, s'ils ne sont pas fournis.
3. Demandez la **source de données**, et ne poursuivez pas tant que l'utilisateur n'a pas répondu :
   - une **source de données du dépôt** (MongoDB, Elasticsearch, Paysage ou ODS, déjà utilisée par un tableau de ce dépôt), ou
   - une **source de données définie par l'utilisateur** (une source publique comme OpenAlex, EPO ou Eurostat, ou une nouvelle source fournie par l'utilisateur).
   Ne créez jamais de jeux de test ni de données d'exemple à la place de la réponse. Si la réponse manque, redemandez-la.
4. Pour une source du dépôt, suivez les sections 1 et 2 de [data-specs.md](../../../reference/guides/data-specs.md) : index ou collection exacte. Attendez la confirmation manuelle dans la session avant toute lecture. Ne vous appuyez pas sur une supposition.
5. Pour une source définie par l'utilisateur, suivez la section 3 du même guide : URL, licence, date de récupération, et choix entre un appel en direct et un téléchargement ponctuel (voir [external.md](../../../reference/guides/external.md)). Vérifiez que la source couvre la question (une comparaison France-pays nécessite une couverture internationale), et signalez les risques de rapprochement d'entités (SIREN, ROR).
6. Une fois la source confirmée, interrogez sur les champs dont le tableau a besoin. Lisez le mapping ou un document d'exemple avant d'écrire une requête, et n'écrivez aucune requête avant d'avoir les réponses.
7. Résumez le cahier des charges : objectif, public, source de données, champs confirmés, questions ouvertes. Arrêtez-vous ensuite et suggérez `build` comme étape suivante.
