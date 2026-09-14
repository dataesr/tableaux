import { Row, Col, Title } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

export default function Id6Css() {
  return (
    <Row gutters>
      <Col>
        <div id="id6">
          <Title as="h2" look="h4">
            Gestion des CSS
          </Title>
          <Callout>
            Il existe un fichier général à tous les tableaux de bord pour gérer les styles CSS : <code>boards/styles.scss</code>.
            <br />
            Ce fichier contient les styles globaux utilisés par tous les tableaux de bord de Tableaux. Toutes les variables de couleurs y sont
            définies.
            <br />
            <br />
            Pour utiliser ces variables dans un fichier tsx, il est possible d'utiliser la syntaxe suivante :
            <pre>
              {`const rootStyles = getComputedStyle(document.documentElement);
const color = rootStyles.getPropertyValue("--primary-color");`}
            </pre>
            Les styles CSS spécifiques au tableau de bord peuvent être ajoutés dans le fichier <code>styles.scss</code> situé dans le dossier des
            racine du tableau de bord.
            <br />
          </Callout>
        </div>
      </Col>
    </Row>
  );
}
