import { Row, Col, Title } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

export default function Id5Server() {
  return (
    <Row gutters>
      <Col>
        <div id="id5">
          <Title as="h2" look="h4">
            Serveur
          </Title>
          <Callout>
            Le serveur de Tableaux est une application Node.js basée sur le framework Express. Il est responsable de la gestion des requêtes
            entrantes, de la communication avec la base de données, et de la fourniture des données nécessaires aux tableaux de bord.
            <br />
            <br />
            Chaque tableau de bord dispose de son propre ensemble d'API définies dans des fichiers situés dans le dossier
            "server/routes/[nom-du-tableau-de-bord]". Il y a un fichier par nom de page du client. Par exemple, pour le tableau de bord
            "projets-europeens", les routes sont définies dans les fichiers situés dans "server/routes/european-projects".
            <br />
            <br />
            Chaque fichier de route exporte une ou plusieurs fonctions qui définissent les endpoints API pour cette page. Ces API sont utilisées pour
            récupérer les données spécifiques à chaque tableau de bord en fonction des paramètres fournis dans les requêtes.
            <br />
            <br />
            Chaque route API dispose d'une route de création de son index. Le nommage de cette fonction doit suivre le format suivant&nbsp;:{" "}
            <code>[NomDeLaRoute]_indexes</code>. <br />
            Par exemple, pour une route nommée "get_beneficiaries", la fonction de création d'index sera nommée <code>get_beneficiaries_indexes</code>
            .
            <br />
            <br />
            Afin de pouvoir tester les routes API en dehors d'un appel FRONT, il est possible d'utiliser un script de test situé dans le dossier
            "server/routes/boards/[nom_du_tableau]/api-tests/[nom_de_la_page]".js. Ce script permet d'appeler directement les fonctions des routes API
            avec des paramètres de test et d'afficher les résultats dans l'IDE grâce à l'extension "REST API"
          </Callout>
        </div>
      </Col>
    </Row>
  );
}
