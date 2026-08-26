import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";

import Footer from "../components/footer";
import HeaderTableaux from "../layout/header.tsx";
import { isInProduction } from "../utils.tsx";

import boardMediaPlaceholder from "../assets/board-media-placeholder.svg";
import mediaAtlas from "../assets/boards/atlas.svg";
import mediaDevenirEtudiants from "../assets/boards/devenir-etudiants.svg";
import mediaEuropeanProjects from "../assets/boards/european-projects.svg";
import mediaFacultyMembers from "../assets/boards/faculty-members.svg";
import mediaFinancementsParAap from "../assets/boards/financements-par-aap.svg";
import mediaGraduates from "../assets/boards/graduates.svg";
import mediaOpenAlex from "../assets/boards/open-alex.svg";
import mediaStructuresFinance from "../assets/boards/structures-finance.svg";
import mediaTeds from "../assets/boards/teds.svg";
import mediaValorisation from "../assets/boards/valorisation-recherche-innovation.svg";

import "./home-styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BOARD_MEDIA: Record<string, string> = {
  atlas: mediaAtlas,
  teds: mediaTeds,
  "structures-finance": mediaStructuresFinance,
  "open-alex": mediaOpenAlex,
  "financements-par-aap": mediaFinancementsParAap,
  graduates: mediaGraduates,
  "european-projects": mediaEuropeanProjects,
  "valorisation-recherche-innovation": mediaValorisation,
  "faculty-members-v2": mediaFacultyMembers,
  "devenir-etudiants": mediaDevenirEtudiants,
};

function getBoardMedia(dashboard: { id?: string }): string {
  return BOARD_MEDIA[dashboard.id ?? ""] ?? boardMediaPlaceholder;
}

export default function HomePage() {

  const { isLoading, data } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  });

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  const filteredData = data
    .filter((dashboard) => dashboard.homePageVisible)
    .filter((dashboard) => {
      if (!isInProduction()) return true;
      const url = dashboard.url || "";
      return (
        url.startsWith("/devenir-etudiants")
        || url.startsWith("/structures-finance") || url.startsWith("/financements-par-aap")
      );
    });

  return (
    <>
      <HeaderTableaux />
      <div className="home-page">
        <section className="home-hero">
          <Container>
            <Row gutters className="home-hero__row">
              <Col xs="12" md="7">
                <p className="home-hero__label">ENSEIGNEMENT SUPÉRIEUR, RECHERCHE ET ESPACE</p>
                <h1 className="home-hero__title">Explorez les données ...</h1>
                <p className="home-hero__description">
                  DataESR est la plateforme de visualisation des données de l'enseignement supérieur, de la recherche et de l'espace. Accédez à des tableaux de bord interactifs, cartes et graphiques sur les effectifs étudiants, les formations, la
                  recherche, les finances et plus encore.
                </p>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="home-section">
          <Container>
            <Row>
              <Col xs="12">
                <h2 className="home-section__title">Tableaux de bord disponibles</h2>
                <p className="home-section__description">Découvrez nos différents tableaux de bord thématiques</p>
              </Col>
            </Row>
            <Row gutters className="fr-grid-row--gutters">
              {filteredData.map((dashboard) => {
                const media = getBoardMedia(dashboard);
                return (
                  <Col key={dashboard.url} xs="12" md="6" className="fr-mb-3w ">
                    <div className="fr-tile fr-tile--horizontal fr-enlarge-link home-tile">
                      <div className="fr-tile__body">
                        <div className="fr-tile__content">
                          <h3 className="fr-tile__title">
                            <RouterLink to={dashboard.url}>{dashboard.name_fr}</RouterLink>
                          </h3>
                          <p className="fr-tile__desc">{dashboard.description_fr}</p>
                          {dashboard.isMultilingual && (
                            <p className="fr-tile__detail">Disponible en français et en anglais</p>
                          )}
                        </div>
                      </div>
                      <div className="fr-tile__header">
                        <div className="fr-tile__img">
                          <img className="fr-responsive-img" src={media} alt="" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Container>
        </section>
      </div>
      <Footer />
    </>
  );
}
