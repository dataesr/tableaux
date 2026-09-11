import { Alert, Button, Col, Container, Link, Row, Text, Title } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import Select from "../../../../components/select"
import { isInProduction } from "../../../../utils"
import Classifications from "../../charts/classifications"
import Classifications2 from "../../charts/classifications2"
import FrenchPartners from "../../charts/french-partners"
import InstrumentsForAnr from "../../charts/instruments-for-anr"
import InstrumentsForEurope from "../../charts/instruments-for-europe"
import InstrumentsOverTimeForAnr from "../../charts/instruments-over-time-for-anr"
import InstrumentsOverTimeForEurope from "../../charts/instruments-over-time-for-europe"
import InternationalPartners from "../../charts/international-partners"
import Laboratories from "../../charts/laboratories"
import Overview from "../../charts/overview"
import ProjectsByFunder from "../../charts/projects-by-funder"
import ProjectsOverTimeByStructure from "../../charts/projects-over-time"
import Regions from "../../charts/regions"
import Breadcrumb from "../../components/breadcrumb"
import Cards from "../../components/cards"
import { getEsQuery, years } from "../../utils"
import ProjectsData from "./components/projects-data"

import "./styles.scss"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env

export default function DisplayStructure() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const section = searchParams.get("section")
  const structure = searchParams.get("structureId")
  const withComponents: boolean = searchParams.has("withComponents")
  const yearMax = searchParams.get("yearMax") ?? String(years[years.length - 2])
  const yearMin = searchParams.get("yearMin") ?? String(years[years.length - 2])
  const [isOpen, setIsOpen] = useState(false)
  const sections = [
    { id: "apercu", label: "Aperçu" },
    { id: "financements", label: "Volume et répartition des financements" },
    { id: "evolution", label: "Evolution temporelle" },
    { id: "partenaires", label: "Institutions partenaires" },
    { id: "laboratoires", label: "Laboratoires" },
    { id: "disciplines", label: "Disciplines" },
    { id: "instruments", label: "Instruments" },
    { id: "regions", label: "Régions" },
    { id: "donnees", label: "Données" },
  ]

  const handleDisplayComponentsChange = () => {
    if (searchParams.has("withComponents")) {
      searchParams.delete("withComponents")
    } else {
      searchParams.set("withComponents", "")
    }
    setSearchParams(searchParams)
    setIsOpen(false)
  }

  const handleNavClick = (section: string) => {
    searchParams.set("section", section)
    setSearchParams(searchParams)
    setIsOpen(false)
  }

  const handleYearMaxChange = (year: string) => {
    searchParams.set("yearMax", year)
    setSearchParams(searchParams)
    setIsOpen(false)
  }

  const handleYearMinChange = (year: string) => {
    searchParams.set("yearMin", year)
    setSearchParams(searchParams)
    setIsOpen(false)
  }

  const body = {
    ...getEsQuery({ structures: [structure] }),
    size: 1,
  }
  const { data } = useQuery({
    queryKey: ["fundings-structure", structure],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((response) => response.json()),
  })
  const participantSuperOrganizationChildren = (data?.hits?.hits?.[0]?._source?.participant_super_organization_children ?? [])
  const participantSuperOrganizationChildrenIds = participantSuperOrganizationChildren.map((org) => org?.id).filter((id) => !!id)
  const structureInfo = Object.fromEntries(new URLSearchParams(data?.hits?.hits?.[0]?._source?.participant_encoded_key ?? ""))
  let name = structureInfo?.label ?? ""
  if (withComponents) name += " et ses composantes"
  let scanrUrl = `https://scanr.enseignementsup-recherche.gouv.fr/search/projects?filters=%257B%2522year%2522%253A%257B%2522values%2522%253A%255B%257B%2522value%2522%253A${yearMin}%257D%252C%257B%2522value%2522%253A${yearMax}%257D%255D%252C%2522type%2522%253A%2522range%2522%257D%252C%2522participants_id_search%2522%253A%257B%2522values%2522%253A%255B`;
  participantSuperOrganizationChildren.forEach((child, index) => {
    if (index !== 0) scanrUrl += '%252C'
    scanrUrl += `%257B%2522value%2522%253A%2522${child?.id ?? ""}%2522%252C%2522label%2522%253A%2522${child?.displayName ?? ""}%2522%257D`
  })
  scanrUrl += `%255D%252C%2522type%2522%253A%2522terms%2522%252C%2522operator%2522%253A%2522or%2522%257D%252C%2522type%2522%253A%257B%2522values%2522%253A%255B%257B%2522value%2522%253A%2522Horizon%25202020%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522ANR%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522PIA%2520hors%2520ANR%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522Horizon%2520Europe%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522PIA%2520ANR%2522%252C%2522label%2522%253Anull%257D%255D%252C%2522type%2522%253A%2522terms%2522%252C%2522operator%2522%253A%2522or%2522%257D%257D`
  const participantIsSuperOrganization = data?.hits?.hits?.[0]?._source?.participant_is_super_organization ?? 0

  return (
    <main>
      <Container fluid className="funding-gradient fr-mb-3w">
        <Container as="section">
          <Row gutters>
            <Col>
              <Breadcrumb items={[
                { href: "/financements-par-aap/accueil", label: "Financements par AAP" },
                { href: "/financements-par-aap/etablissement", label: "Vue par établissement" },
                { label: name }
              ]} />
            </Col>
          </Row>
          <Row gutters className="fr-grid-row--middle fr-mb-2w">
            <Col xs="12" md="6">
              <Title as="h1" className="fr-mb-1v" look="h4">
                {name}
              </Title>
              <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                {structureInfo?.typologie_2}
              </Text>
              {participantIsSuperOrganization && withComponents && (
                <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                  Composantes:
                  {' '}
                  {participantSuperOrganizationChildren.map((child) => child.displayName).join(' - ')}
                </Text>
              )}
              {structureInfo?.region && (
                <Text size="sm" className="fr-mb-0 fr-text-mention--grey">
                  <span aria-hidden="true" className="fr-icon-map-pin-2-fill fr-mr-1w" />
                  {structureInfo.region}
                </Text>
              )}
              <Text size="sm" className="fr-mb-0 fr-text-mention--grey">
                <Link href={scanrUrl} target="_blank" size="sm" className="fr-mt-1w fr-text-mention--grey">
                  <span aria-hidden="true" />
                  Voir sur scanR
                </Link>
              </Text>
            </Col>
            <Col xs="12" md="6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
              <Button
                icon="arrow-go-back-line"
                iconPosition="left"
                onClick={() => navigate("/financements-par-aap/etablissement")}
                size="sm"
                variant="tertiary"
              >
                Changer d'établissement
              </Button>
              <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
                <Select
                  aria-label="Année de début"
                  icon="calendar-line"
                  label={yearMin}
                  outline={false}
                  size="sm"
                >
                  {[...years].sort((a, b) => b - a).map((year) => (
                    <Select.Option
                      key={year}
                      onClick={() => handleYearMinChange(String(year))}
                      selected={yearMin === String(year)}
                      value={String(year)}
                    >
                      {year}
                    </Select.Option>
                  ))}
                </Select>
                <Text className="fr-mb-0">à</Text>
                <Select
                  aria-label="Année de fin"
                  icon="calendar-line"
                  label={yearMax}
                  outline={false}
                  size="sm"
                >
                  {[...years].sort((a, b) => b - a).map((year) => (
                    <Select.Option
                      key={year}
                      onClick={() => handleYearMaxChange(String(year))}
                      selected={yearMax === String(year)}
                      value={String(year)}
                    >
                      {year}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              {!isInProduction() && participantIsSuperOrganization && (
                <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
                  <div className="fr-toggle">
                    <input checked={withComponents} className="fr-toggle__input" onChange={handleDisplayComponentsChange} type="checkbox" />
                    <label className="fr-toggle__label">Vision consolidée avec ses composantes</label>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </Container>
      <Container className="fr-mb-3w">
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
              {(section === "apercu") && (
                <Cards participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
              )}
              {(section === "financements") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <ProjectsByFunder name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <Overview name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "evolution") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col>
                    <ProjectsOverTimeByStructure name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                  </Col>
                </Row>
              )}
              {(section === "partenaires") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <FrenchPartners name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InternationalPartners name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "laboratoires") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col>
                    <Laboratories name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                  </Col>
                </Row>
              )}
              {(section === "disciplines") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <Classifications name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <Classifications2 name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "instruments") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <InstrumentsForAnr name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InstrumentsForEurope name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InstrumentsOverTimeForAnr name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <InstrumentsOverTimeForEurope name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "regions") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <Regions name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "donnees") && (
                <ProjectsData participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
              )}
            </>
          )}
      </Container>
    </main>
  )
}
