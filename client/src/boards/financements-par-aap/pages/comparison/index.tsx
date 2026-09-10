import { Alert, Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import Breadcrumb from "../../components/breadcrumb"
import Select from "../../../../components/select"
import { years } from "../../utils"
import ClassificationsByComparison from "./charts/classifications-by-comparison"
import DispersionByComparison from "./charts/dispersion-by-comparison"
import ProjectsByComparison from "./charts/projects-by-comparison"
import StructuresSelector from "./components/structures-selector"

import "./styles.scss"


export default function Comparison() {
  const [searchParams, setSearchParams] = useSearchParams({})
  const section = searchParams.get("section")
  const structures = searchParams.getAll("structure")
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
            <Col>
              <Breadcrumb items={[
                { href: "/financements-par-aap/accueil", label: "Financements par AAP" },
                { label: "Comparaison entre établissements" },
              ]} />
            </Col>
          </Row>
          <Row gutters className="fr-grid-row--middle">
            <Col md="9">
              <Title as="h1" look="h4" className="fr-mb-1v">
                Comparaison entre établissements
              </Title>
              <Text size="sm" className="fr-mb-0 fr-text-mention--grey">
                {structures.length < 2
                  ? "Sélectionnez au moins deux établissements ci-dessous pour comparer leurs financements via les appels à projets. Vous pouvez filtrer par région et par typologie."
                  : `${structures.length} établissements sélectionnés`}
              </Text>
            </Col>
            <Col md="3" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
              <Select
                label={yearMin}
                icon="calendar-line"
                outline={false}
                size="sm"
                aria-label="Année de début"
              >
                {[...years].sort((a, b) => b - a).map((year) => (
                  <Select.Option
                    key={year}
                    value={String(year)}
                    selected={yearMin === String(year)}
                    onClick={() => handleYearMinChange(String(year))}
                  >
                    {year}
                  </Select.Option>
                ))}
              </Select>
              <Text className="fr-mb-0">à</Text>
              <Select
                label={yearMax}
                icon="calendar-line"
                outline={false}
                size="sm"
                aria-label="Année de fin"
              >
                {[...years].sort((a, b) => b - a).map((year) => (
                  <Select.Option
                    key={year}
                    value={String(year)}
                    selected={yearMax === String(year)}
                    onClick={() => handleYearMaxChange(String(year))}
                  >
                    {year}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
          <Row gutters className="fr-mt-2w fr-mb-2w">
            <Col>
              <StructuresSelector />
            </Col>
          </Row>
        </Container>
      </Container>
      <Container as="section" >
        {(structures && structures.length >= 2) ? (
          <>
            <Row gutters>
              <Col>
                <nav
                  aria-label="Navigation secondaire"
                  className="fr-nav fr-mb-1w"
                  role="navigation"
                >
                  <button
                    aria-controls="section-nav-list"
                    aria-expanded={isOpen}
                    className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-menu-fill data-mobile-burger"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    Menu
                  </button>
                  <ul className={`fr-nav__list ${isOpen ? 'fr-nav__list-open' : ''}`}>
                    {sections.map((item) => (
                      <li key={item.id} className="fr-nav__item">
                        <button
                          aria-current={section === item.id ? "page" : undefined}
                          className="fr-nav__link"
                          onClick={() => handleNavClick(item.id)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </Col>
            </Row>
            {(yearMax < yearMin) ?
              (<Alert description="Merci de choisir une année de fin supérieure ou égale à l'année de début" title="Erreur dans le choix des années" variant="error" />) :
              (
                <>
                  {(section === "financements") && (
                    <>
                      <Row gutters>
                        <Col>
                          <ProjectsByComparison />
                        </Col>
                      </Row>
                      <Row gutters>
                        <Col>
                          <DispersionByComparison />
                        </Col>
                      </Row>
                    </>
                  )}
                  {(section === "disciplines") && (
                    <Row gutters>
                      <Col>
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
            title="Sélectionner plusieurs établissements"
            variant="info"
          />
        )}
      </Container>
    </>
  )
}
