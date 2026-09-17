import { Col, Container, Row } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link as RouterLink } from "react-router-dom"

import boardMediaPlaceholder from "../assets/board-media-placeholder.svg"
import Footer from "../components/footer"
import HeaderTableaux from "../layout/header.tsx"

import "./home-styles.scss"

const { VITE_APP_SERVER_URL } = import.meta.env

export default function HomePage() {
  const [dashboards, setDashboards] = useState<any[]>()

  const { data, isLoading } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  })

  useEffect(() => {
    async function getData() {
      let visibleDashboards = (data ?? []).filter((dashboard) => dashboard.homePageVisible)
      // Asynchronously load each media to display on the dashboard tile on the home page
      const allResponses = await Promise.all(visibleDashboards.map((dashboard) => import(`../assets/boards/${dashboard.id}.svg`).catch(() => { })))
      visibleDashboards = visibleDashboards.map((dashboard, index) => {
        const media = allResponses[index]?.default ?? boardMediaPlaceholder
        return { ...dashboard, media }
      })
      setDashboards(visibleDashboards)
    }
    getData()
  }, [data])

  if (isLoading || !data || !dashboards) {
    return <div>Loading...</div>
  }

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
              {dashboards.map((dashboard) => {
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
                          <img className="fr-responsive-img" src={dashboard.media} alt="" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </Col>
                )
              })}
            </Row>
          </Container>
        </section>
      </div>
      <Footer />
    </>
  )
}
