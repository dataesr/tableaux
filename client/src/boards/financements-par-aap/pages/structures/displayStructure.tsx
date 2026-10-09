import { Alert, Button, Col, Container, Link, Row, Text, Title, Toggle } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

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
  if (withComponents) name += " et ses établissements composantes"
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
            <Col xs="12">
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
              {structureInfo?.typologie_2 && (
                <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                  {structureInfo?.typologie_2}
                </Text>
              )}
              {!!participantIsSuperOrganization && withComponents && (
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
              {!!participantIsSuperOrganization && (
                <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
                  <Toggle
                    checked={withComponents}
                    label="Vision consolidée avec ses établissements composantes"
                    onChange={handleDisplayComponentsChange}
                  />
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </Container>
      <Container className="fr-mb-3w">
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
        {((Number(yearMax) >= 2024) || (Number(yearMin) >= 2024)) && (
          <Alert
            className="fr-mb-4w fr-mt-4w"
            description="Les sources disponibles ne fournissent que des données provisoires pour 2024 et 2025."
            role="status"
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
                <Cards participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
              )}
              {(section === "financements") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col xs="12">
                      <ProjectsByFunder name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col xs="12">
                      <Overview name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "evolution") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col xs="12">
                    <ProjectsOverTimeByStructure name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                  </Col>
                </Row>
              )}
              {(section === "partenaires") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col xs="12">
                      <FrenchPartners name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col xs="12">
                      <InternationalPartners name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "laboratoires") && (
                <Row gutters style={{ clear: "both" }}>
                  <Col xs="12">
                    <Laboratories name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                  </Col>
                </Row>
              )}
              {(section === "disciplines") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col xs="12">
                      <Classifications name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col xs="12">
                      <Classifications2 name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "instruments") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col xs="12">
                      <InstrumentsForAnr name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col xs="12">
                      <InstrumentsForEurope name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col xs="12">
                      <InstrumentsOverTimeForAnr name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col xs="12">
                      <InstrumentsOverTimeForEurope name={name} participantSuperOrganizationChildrenIds={withComponents ? participantSuperOrganizationChildrenIds : []} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "regions") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col xs="12">
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
