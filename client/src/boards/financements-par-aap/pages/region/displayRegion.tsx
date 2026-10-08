import { Alert, Button, Col, Container, Row, Title } from "@dataesr/dsfr-plus"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import Classifications from "../../charts/classifications"
import Classifications2 from "../../charts/classifications2"
import FrenchPartners from "../../charts/french-partners"
import Institutions from "../../charts/institutions"
import InstrumentsForAnr from "../../charts/instruments-for-anr"
import InstrumentsForEurope from "../../charts/instruments-for-europe"
import InstrumentsOverTimeForAnr from "../../charts/instruments-over-time-for-anr"
import InstrumentsOverTimeForEurope from "../../charts/instruments-over-time-for-europe"
import InternationalPartners from "../../charts/international-partners"
import Laboratories from "../../charts/laboratories"
import Overview from "../../charts/overview"
import ProjectsByFunder from "../../charts/projects-by-funder"
import ProjectsOverTime from "../../charts/projects-over-time"
import Breadcrumb from "../../components/breadcrumb"
import Cards from "../../components/cards"
import { years } from "../../utils"
import ProjectsData from "./components/projects-data"

import "./styles.scss"


export default function DisplayRegion() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const section = searchParams.get("section")
  const region = searchParams.get("region") ?? ''
  const yearMax = searchParams.get("yearMax") ?? String(years[years.length - 2])
  const yearMin = searchParams.get("yearMin") ?? String(years[years.length - 2])
  const [isOpen, setIsOpen] = useState(false)
  const sections = [
    { id: "apercu", label: "Aperçu" },
    { id: "financements", label: "Volume et répartition des financements" },
    { id: "evolution", label: "Evolution temporelle" },
    { id: "institutions", label: "Institutions" },
    { id: "laboratoires", label: "Laboratoires" },
    { id: "disciplines", label: "Disciplines" },
    { id: "instruments", label: "Instruments" },
    { id: "donnees", label: "Données" },
  ]

  const handleNavClick = (section: string) => {
    searchParams.set("section", section)
    setSearchParams(searchParams)
    setIsOpen(false)
  }

  const handleYearMaxChange = (year: string) => {
    searchParams.set("yearMax", year)
    setSearchParams(searchParams)
  }

  const handleYearMinChange = (year: string) => {
    searchParams.set("yearMin", year)
    setSearchParams(searchParams)
  }

  return (
    <main>
      <Container fluid className="funding-gradient fr-mb-3w">
        <Container as="section">
          <Row gutters>
            <Col>
              <Breadcrumb items={[
                { href: "/financements-par-aap/accueil", label: "Financements par AAP" },
                { href: "/financements-par-aap/region", label: "Vue par région" },
                { label: region }
              ]} />
            </Col>
          </Row>
          <Row gutters className="fr-grid-row--middle fr-mb-2w">
            <Col xs="12" md="6">
              <Title as="h1" className="fr-mb-1v" look="h4">
                {region}
              </Title>
            </Col>
            <Col xs="12" md="6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
              <Button
                icon="arrow-go-back-line"
                iconPosition="left"
                onClick={() => navigate("/financements-par-aap/region")}
                size="sm"
                variant="tertiary"
              >
                Changer de région
              </Button>
              <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
                <fieldset className="fr-fieldset" aria-label="Années">
                  <legend className="fr-fieldset__legend--regular fr-fieldset__legend">Années</legend>
                  <div className="fr-fieldset__element" style={{ maxWidth: "48%" }}>
                    <div className="fr-select-group fr-mb-0">
                      <label className="fr-label" htmlFor="select-year-min">Début</label>
                      <select
                        aria-label={`Année de début: ${yearMin}`}
                        className="fr-select"
                        id="select-year-min"
                        name="select-year-min"
                        title="Année de début"
                      >
                        {[...years].sort((a, b) => b - a).map((year) => (
                          <option
                            key={year}
                            onClick={() => handleYearMinChange(String(year))}
                            selected={yearMin === String(year)}
                            value={String(year)}
                          >
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="fr-fieldset__element" style={{ maxWidth: "48%" }}>
                    <div className="fr-select-group">
                      <label className="fr-label" htmlFor="select-year-max">Fin</label>
                      <select
                        aria-label={`Année de fin: ${yearMax}`}
                        className="fr-select"
                        id="select-year-max"
                        name="select-year-max"
                        title="Année de fin"
                      >
                        {[...years].sort((a, b) => b - a).map((year) => (
                          <option
                            key={year}
                            onClick={() => handleYearMaxChange(String(year))}
                            selected={yearMax === String(year)}
                            value={String(year)}
                          >
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </fieldset>
              </div>
            </Col>
          </Row>
        </Container>
      </Container>
      <Container className="fr-mb-3w">
        <Row gutters>
          <Col xs={12}>
            <button
              aria-controls="section-nav-list"
              aria-expanded={isOpen}
              aria-label="Onglets"
              className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-menu-fill data-mobile-burger"
              onClick={() => setIsOpen(!isOpen)}
            >
              Menu
            </button>
            <div className="fr-tabs">
              <ul className="fr-tabs__list" id="section-nav-list" role="tablist" aria-label="Menu secondaire">
                {sections.map((item) => (
                  <li key={item.id} role="presentation">
                    <button
                      aria-label={item.label}
                      aria-selected={section === item.id}
                      className="fr-tabs__tab"
                      onClick={() => handleNavClick(item.id)}
                      role="tab"
                      tabIndex={section === item.id ? 0 : -1}
                      type="button"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
        </Row>
        {((Number(yearMax) >= 2024) || (Number(yearMin) >= 2024)) && (
          <Alert
            className="fr-mb-4w fr-mt-4w"
            description="Les sources disponibles ne fournissent que des données provisoires pour 2024 et 2025."
            size="sm"
            variant="warning"
          />
        )}
        {(yearMax < yearMin) ?
          (<Alert description="Merci de choisir une année de fin supérieure ou égale à l'année de début" title="Erreur dans le choix des années" variant="error" />) :
          (
            <>
              <Title as="h2" className="fr-sr-only">
                {sections.find((item) => section === item.id)?.label}
              </Title>
              {(section === "apercu") && (
                <Cards />
              )}
              {(section === "financements") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <ProjectsByFunder name={region} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <Overview name={region} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "evolution") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col>
                    <ProjectsOverTime name={region} />
                  </Col>
                </Row>
              )}
              {(section === "partenaires") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <FrenchPartners name={region} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InternationalPartners name={region} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "institutions") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col>
                    <Institutions name={region} />
                  </Col>
                </Row>
              )}
              {(section === "laboratoires") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col>
                    <Laboratories name={region} />
                  </Col>
                </Row>
              )}
              {(section === "disciplines") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <Classifications name={region} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <Classifications2 name={region} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "instruments") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <InstrumentsForAnr name={region} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InstrumentsForEurope name={region} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InstrumentsOverTimeForAnr name={region} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InstrumentsOverTimeForEurope name={region} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "donnees") && (
                <ProjectsData />
              )}
            </>
          )}
      </Container>
    </main>
  )
}
