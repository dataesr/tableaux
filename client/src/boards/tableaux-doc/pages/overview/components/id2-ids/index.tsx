import { Row, Col, Title } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

export default function Id2Ids() {
  return (
    <Row gutters>
      <Col>
        <div id="id2">
          <Title as="h2" look="h4">
            Liste des ids Tableaux
          </Title>
          <Callout>
            Les ids sont des paramètres d'URL utilisés dans les tableaux de bord Tableaux pour filtrer les données affichées. Ils permettent de
            personnaliser les vues en fonction des besoins spécifiques des utilisateurs. Ils permettent également de partager des liens directs vers
            des vues filtrées spécifiques et de passer d'un tableau de bord à un autre. Au ids ci-dessous s'ajoute le paramètre "language" pour
            l'internationalisation en fonction du site.
            <br /> <br />
            Voici la liste des ids disponibles&nbsp;:
            <br />
            <table className="fr-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Description</th>
                  <th>Tableau de bords</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>annee_universitaire</td>
                  <td>Année universitaire sur 7 caractères. ex : 2025-26</td>
                  <td>Altlas</td>
                </tr>
                <tr>
                  <td>country_code</td>
                  <td>Code ISO3 du pays</td>
                  <td>Projets européens, TEDS</td>
                </tr>
                <tr>
                  <td>destinationIds</td>
                  <td>Identifiant de ou des destinations. Liste séparée par "|"</td>
                  <td>Projets européens</td>
                </tr>
                <tr>
                  <td>geo_id</td>
                  <td>Identifiant géogaphique allant du pays France (PAYS_100) à la commune</td>
                  <td>Altlas</td>
                </tr>
                <tr>
                  <td>pilarId</td>
                  <td>Identifiant du pillier</td>
                  <td>Projets européens</td>
                </tr>
                <tr>
                  <td>programId</td>
                  <td>Identifiant du programme</td>
                  <td>Projets européens</td>
                </tr>
                <tr>
                  <td>thematicIds</td>
                  <td>Identifiant de ou des thématiques. Liste séparée par "|"</td>
                  <td>Projets européens</td>
                </tr>
              </tbody>
            </table>
          </Callout>
        </div>
      </Col>
    </Row>
  );
}
