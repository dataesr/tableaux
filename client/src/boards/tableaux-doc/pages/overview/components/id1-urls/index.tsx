import { Row, Col, Title } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

export default function Id1Urls() {
  return (
    <Row gutters>
      <Col>
        <div id="id1">
          <Title as="h2" look="h4">
            Gestion des URLs
          </Title>
          <Callout>
            Les URLs sont toujours construites à partir de la base suivante : <code>domaine/</code>
            <br />
            <br />
            Ensuite, on ajoute le nom du tableau de bord (ex : <code>atlas</code>, <code>projets-europeens</code>, etc.) suivi de la page du tableau
            de bord à afficher, suivi des paramètres d'URL.
            <br />
            <br />
            Par exemple, pour accéder à la page "générale" du tableau de bord Atlas avec l'année universitaire 2025-26 et le code géographique
            PAYS_100, l'URL sera :
            <br />
            <code>domaine/atlas/general?annee_universitaire=2025-26&amp;geo_id=PAYS_100</code>
            <br />
            <br />
            La page d'accueil du tableau de bord sera toujours <code>domaine/nom-du-tableau-de-bord/</code> sans paramètre.
          </Callout>
        </div>
      </Col>
    </Row>
  );
}
