import { Alert, Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import Breadcrumb from "../../components/breadcrumb"
import { years } from "../../utils"
import ClassificationsByComparison from "./charts/classifications-by-comparison"
import DispersionByComparison from "./charts/dispersion-by-comparison"
import ProjectsByComparison from "./charts/projects-by-comparison"
import StructuresSelector from "./components/structures-selector"

import "./styles.scss"


export default function Comparison() {
  const [searchParams, setSearchParams] = useSearchParams({})
  const section = searchParams.get("section")
  const structures = searchParams.getAll("structureId")
  const yearMax = searchParams.get("yearMax") ?? String(years[years.length - 2])
  const yearMin = searchParams.get("yearMin") ?? String(years[years.length - 2])
  const [isOpen, setIsOpen] = useState(false)
  const sections = [
    { id: "financements", label: "Volume et répartition des financements" },
    { id: "disciplines", label: "Disciplines" },
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

  useEffect(() => {
    if (!searchParams.get("section")) {
      searchParams.set("section", "financements")
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  return (
    <>
      <Container fluid className="funding-gradient">
        <Container as="section">
          <Row gutters>
            <Col xs="12">
              <Breadcrumb items={[
                { href: "/financements-par-aap/accueil", label: "Financements par AAP" },
                { label: "Comparaison entre établissements" },
              ]} />
            </Col>
          </Row>
          <Row gutters className="fr-grid-row--middle">
            <Col xs="12" md="9">
              <Title as="h1" look="h4" className="fr-mb-1v">
                Comparaison entre établissements
              </Title>
              <Text size="sm" className="fr-mb-0 fr-text-mention--grey">
                {structures.length < 2
                  ? "Sélectionnez au moins deux établissements ci-dessous pour comparer leurs financements via les appels à projets. Vous pouvez filtrer par région et par typologie."
                  : `${structures.length} établissements sélectionnés`}
              </Text>
            </Col>
            <Col xs="12" md="3" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
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
          <Row gutters className="fr-mt-2w fr-mb-2w">
            <Col xs="12">
              <StructuresSelector />
            </Col>
          </Row>
        </Container>
      </Container>
      <Container as="section" >
        {(structures && structures.length >= 2) ? (
          <>
            <Row gutters>
              <Col xs="12">
                <button
                  aria-controls="section-nav-list"
                  aria-expanded={isOpen}
                  aria-label="Onglets"
                  className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-menu-fill data-mobile-burger"
                  onClick={() => setIsOpen(!isOpen)}
                  type="button"
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
            {(yearMax < yearMin) ?
              (<Alert description="Merci de choisir une année de fin supérieure ou égale à l'année de début" title="Erreur dans le choix des années" variant="error" />) :
              (
                <>
                  <Title as="h2" className="fr-sr-only">
                    {sections.find((item) => section === item.id)?.label}
                  </Title>
                  {(section === "financements") && (
                    <>
                      <Row gutters>
                        <Col xs="12">
                          <ProjectsByComparison />
                        </Col>
                      </Row>
                      <Row gutters>
                        <Col xs="12">
                          <DispersionByComparison />
                        </Col>
                      </Row>
                    </>
                  )}
                  {(section === "disciplines") && (
                    <Row gutters>
                      <Col xs="12">
                        <ClassificationsByComparison />
                      </Col>
                    </Row>
                  )}
                </>
              )}
          </>
        ) : (
          <Alert
            description="Sélectionner plusieurs établissements dans la liste déroulante pour visualiser
              leurs financements via les appels à projets. Vous pouvez filtrer par région et par typologie."
            className="fr-mt-3w fr-mb-3w"
            role="status"
            title="Sélectionner plusieurs établissements"
            variant="info"
          />
        )}
      </Container>
    </>
  )
}
