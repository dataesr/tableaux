import {
  Button,
  Col,
  Container,
  FastAccess,
  Header,
  Logo,
  Row,
  Service,
  Title,
} from "@dataesr/dsfr-plus";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import Footer from "./footer";
import SwitchTheme from "./switch-theme";


export default function NotFoundPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("language")) {
      searchParams.set("language", "FR"); // default value
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <Header>
        <Logo text={import.meta.env.VITE_MINISTER_NAME} />
        <Service name="Tableaux" />
        <FastAccess>
          <Button as="a" href="/" icon="github-fill" size="sm" variant="text">
            {searchParams.get("language") === "EN"
              ? "Explore dashboards"
              : "Explorer d'autres tableaux de bord"}
          </Button>
          <Button
            as="a"
            href="https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits/table/?disjunctive.rgp_formations_ou_etablissements&sort=-rentree"
            icon="code-s-slash-line"
            rel="noreferer noopener"
            size="sm"
            target="_blank"
            variant="text"
          >
            {searchParams.get("language") === "EN"
              ? "Datasets"
              : "Jeux de données"}
          </Button>
          <Button
            aria-controls="fr-theme-modal"
            className="fr-btn fr-icon-theme-fill"
            data-fr-opened="false"
          >
            {searchParams.get("language") === "EN"
              ? "Themes"
              : "Changer de thème"}
          </Button>
        </FastAccess>
      </Header>
      <Container style={{ minHeight: "calc(60vh - 200px)" }}>
        <Row>
          <Col className="fr-my-12w text-center">
            <Title as="h1">404 - Page Not Found</Title>
          </Col>
        </Row>
      </Container>
      <Footer />
      <SwitchTheme />
    </>
  );
}
