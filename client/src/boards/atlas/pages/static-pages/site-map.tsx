import {
  Breadcrumb,
  Container,
  Col,
  Row,
  Link,
} from "@dataesr/dsfr-plus";

import { DEFAULT_CURRENT_YEAR, DEFAULT_GEO_ID } from "../../../../constants.tsx";

export default function SiteMap() {
    
  return (
    <Container as="main" id="main">
      <Row className="fr-mb-5w">
        <Col>
          <Breadcrumb className="fr-m-0 fr-mt-1w">
            <Link href="/atlas">Accueil</Link>
            <Link>
              <strong>Plan du site : Atlas des effectifs étudiants</strong>
            </Link>
          </Breadcrumb>
        </Col>
      </Row>
      <Row>
        <h1>Plan du site - Atlas des effectifs étudiants de la France</h1>
      </Row>
      <Col>
        <ul className="fr-my-1" style={{ listStyleType: "disc", paddingLeft: "1em" }}>
          <li>
            <Link href="/atlas">Accueil</Link>
          </li>
          <ul className="fr-my-1" style={{ listStyleType: "disc", paddingLeft: "1em" }}>
            <li>
              <Link href={`/atlas/general?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>En un coup d'oeil</Link>
            </li>
            <li>
              <Link href={`/atlas/effectifs-par-filiere?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs par filière</Link>
            </li>
            <ul className="fr-my-1" style={{ listStyleType: "disc", paddingLeft: "1em" }}>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/CPGE?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des classes préparatoires aux grandes écoles</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/STS?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des sections de techniciens supérieurs et assimilés</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/UNIV?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des universités</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/GE?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des grands établissements MESRE</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/UT?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des universités de technologie</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/INP?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des instituts nationaux polytechniques</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/ENS?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des écoles normales supérieures</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/EPEU?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des établissements d'enseignement universitaire privés</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/ING_autres?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des autres formations d'ingénieurs</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/EC_COM?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des écoles de commerce, gestion et comptabilité</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/EC_JUR?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des écoles juridiques et administratives</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/EC_ART?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des écoles supérieures art et culture</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/EC_PARAM?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des écoles paramédicales et sociales</Link>
              </li>
              <li>
                <Link href={`/atlas/effectifs-par-filiere/EC_autres?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs des autres écoles de spécialités diverses</Link>
              </li>
            </ul>
            <li>
              <Link href={`/atlas/effectifs-par-secteurs?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs par secteurs</Link>
            </li>
            <li>
              <Link href={`/atlas/effectifs-par-genre?geo_id=${DEFAULT_GEO_ID}&annee_universitaire=${DEFAULT_CURRENT_YEAR}`}>Effectifs par genre</Link>
            </li>
          </ul>
          <li>
            <Link href="/atlas/accessibilite">Accessibilité</Link>
          </li>
          <li>
            <Link href="/atlas/mentions-legales">Mentions légales</Link>
          </li>
          <li>
            <Link href="/atlas/gestion-des-cookies">Gestions des cookies</Link>
          </li>
          <li>
            <Link href="/atlas/contacts">Contacts</Link>
          </li>
        </ul>
      </Col>
    </Container>
  );
}