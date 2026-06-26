import { Badge, Col, Container, Link, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";

import Footer from "../components/footer";
import HeaderTableaux from "../layout/header.tsx";
import { isInProduction } from "../utils.tsx";

import "./home-styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;


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
            <Row>
              <Col xs="12" lg="8" offsetLg="2">
                <div className="home-hero__content">
                  <p className="home-hero__label">ENSEIGNEMENT SUPÉRIEUR, RECHERCHE ET ESPACE</p>
                  <h1 className="home-hero__title">Explorez les données ...</h1>
                  <p className="home-hero__description">
                    DataESR est la plateforme de visualisation des données de l'enseignement supérieur, de la recherche et de l'espace. Accédez à des tableaux de bord interactifs, cartes et graphiques sur les effectifs étudiants, les formations, la
                    recherche, les finances et plus encore.
                  </p>
                </div>
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
            <Row gutters className="fr-mt-3w">
              <ul>
                {filteredData.map((dashboard) => (
                  <li key={dashboard.url}>
                    <Col xs="12" md="6" lg="4" className="fr-p-1w">
                      <Link href={dashboard.url}>
                        <div className="home-dashboard-card">
                          <div className="home-dashboard-card__icon">
                            <span className={`fr-icon-${dashboard.icon}`} aria-hidden="true" />
                          </div>
                          <h3 className="home-dashboard-card__title">{dashboard.name_fr}</h3>
                          <p className="home-dashboard-card__description">{dashboard.description_fr}</p>
                          {dashboard.isMultilingual && (
                            <Badge color="brown-opera" title="Disponible en plusieurs langues">
                              FR/EN
                            </Badge>
                          )}
                          <div className="home-dashboard-card__footer">
                            <span className="home-dashboard-card__link">
                              Accéder
                              <span className="fr-icon-arrow-right-line fr-ml-1w" aria-hidden="true" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </Col>
                  </li>
                ))}
              </ul>
            </Row>
          </Container>
        </section>
      </div>
      <Footer />
    </>
  );
}
