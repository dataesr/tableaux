import { Alert, Col, Container, Link, Row, Text, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import Breadcrumb from "../../components/breadcrumb";
import { years } from "../../utils";
import PatentsByClass from "./charts/patents-by-class";
import PatentsByYear from "./charts/patents-by-year";
import PatentsCoApplicants from "./charts/patents-co-applicants";
import PublicationsByLaboratory from "./charts/publications-by-laboratory";
import PublicationsByTopic from "./charts/publications-by-topic";
import PublicationsByYear from "./charts/publications-by-year";
import StartupsByCounty from "./charts/startups-by-county";
import StartupsByIncubator from "./charts/startups-by-incubator";
import StartupsByYear from "./charts/startups-by-year";
import StartupsData from "./charts/startups-data";

import "./styles.scss";

const { VITE_APP_ES_INDEX_ORGANIZATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function DisplayStructure() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section") ?? "startups";
  const structure = searchParams.get("structureId");
  const yearMax = searchParams.get("yearMax") ?? String(years[years.length - 2]);
  const yearMin = searchParams.get("yearMin") ?? String(years[years.length - 2]);
  const [isOpen, setIsOpen] = useState(false);
  const sections = [
    { id: "startups", label: "Start-ups" },
    { id: "brevets", label: "Brevets" },
    { id: "academiques", label: "Liens académiques" },
  ];

  const handleNavClick = (section: string) => {
    searchParams.set("section", section);
    setSearchParams(searchParams);
    setIsOpen(false);
  };

  const handleYearMaxChange = (year: string) => {
    searchParams.set("yearMax", year);
    setSearchParams(searchParams);
  };

  const handleYearMinChange = (year: string) => {
    searchParams.set("yearMin", year);
    setSearchParams(searchParams);
  };

  const { data } = useQuery({
    queryKey: ["valo-structure", structure],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`, {
        body: JSON.stringify({ size: 1, query: { bool: { filter: [ { term: { "id.keyword": structure } } ] } } }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });
  const structureInfo = data?.hits?.hits?.[0]?._source ?? {};
  const name = structureInfo?.label?.fr ?? "No French label";
  // const scanrUrl = `https://scanr.enseignementsup-recherche.gouv.fr/search/projects?filters=%257B%2522year%2522%253A%257B%2522values%2522%253A%255B%257B%2522value%2522%253A${yearMin}%257D%252C%257B%2522value%2522%253A${yearMax}%257D%255D%252C%2522type%2522%253A%2522range%2522%257D%252C%2522participants_id_search%2522%253A%257B%2522values%2522%253A%255B%257B%2522value%2522%253A%2522${structure}%2522%252C%2522label%2522%253A%2522${name}%2522%257D%255D%252C%2522type%2522%253A%2522terms%2522%252C%2522operator%2522%253A%2522or%2522%257D%252C%2522type%2522%253A%257B%2522values%2522%253A%255B%257B%2522value%2522%253A%2522Horizon%25202020%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522ANR%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522PIA%2520hors%2520ANR%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522Horizon%2520Europe%2522%252C%2522label%2522%253Anull%257D%252C%257B%2522value%2522%253A%2522PIA%2520ANR%2522%252C%2522label%2522%253Anull%257D%255D%252C%2522type%2522%253A%2522terms%2522%252C%2522operator%2522%253A%2522or%2522%257D%257D`;

  return (
    <>
      <Container fluid className="funding-gradient fr-mb-3w">
        <Container as="section">
          <Row gutters>
            <Col>
              <Breadcrumb items={[
                { href: "/valorisation-recherche-innovation/accueil", label: "Valorisation de la recherche - innovation" },
                { href: "/valorisation-recherche-innovation/etablissement", label: "Vue par établissement" },
                { label: name }
              ]} />
            </Col>
          </Row>
          <Row gutters>
            <Col xs="12" md="8">
              <Title as="h1" className="fr-mb-1w" look="h4">
                {name}
              </Title>
              <Text size="xs">
                {structureInfo?.typologie_2}
              </Text>
              <Text>
                <span aria-hidden="true" className="fr-icon-map-pin-2-fill fr-mr-1w"></span>
                {structureInfo?.address?.[0]?.region}
              </Text>
            </Col>
            <Col>
              <Row gutters className="fr-mb-2w">
                <Link href="/valorisation-recherche-innovation/etablissement">
                  <span aria-hidden="true" className="fr-icon-arrow-go-back-line fr-mr-1w" />
                  Changer d'établissement
                </Link>
              </Row>
              {/* <Row gutters className="fr-mb-4w">
                <Link href={scanrUrl} target="_blank">
                  Voir la liste de ces projets sur scanR
                </Link>
              </Row> */}
              <Row gutters>
                <Col md="1" style={{ display: "ruby" }}>
                  <select
                    className="fr-select"
                    onChange={(e) => handleYearMinChange(e.target.value)}
                    style={{ width: "fit-content" }}
                    value={yearMin}
                  >
                    {[...years].sort((a, b) => b - a).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <Text className="fr-mx-1w" style={{ margin: "auto" }}>
                      à
                    </Text>
                    <select
                      className="fr-select"
                      onChange={(e) => handleYearMaxChange(e.target.value)}
                      style={{ width: "fit-content" }}
                      value={yearMax}
                    >
                      {[...years].sort((a, b) => b - a).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                </Col>
              </Row>
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
              <Row horizontalAlign="right" style={{ float: "right" }}>

              </Row>
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
        {((Number(yearMax) >= 2024) || (Number(yearMin) >= 2024)) &&
          <div style={{ float: "right" }}>
            <div>
              <Alert description="Les sources disponibles ne fournissent que des données provisoires pour 2024 et 2025" size="sm" variant="warning" />
            </div>
          </div>
        }
        {
          (yearMax < yearMin) ?
          (<Alert description="Merci de choisir une année de fin supérieure ou égale à l'année de début" title="Erreur dans le choix des années" variant="error" />) :
          (
            <>
              {(section === "startups") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <StartupsByYear name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <StartupsByCounty name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <StartupsByIncubator name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <StartupsData />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "brevets") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <PatentsByYear name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <PatentsByClass name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <PatentsCoApplicants name={name} />
                    </Col>
                  </Row>
                </>
              )}
              {(section === "academiques") && (
                <>
                  <Row gutters style={{ clear: "both" }}>
                    <Col>
                      <PublicationsByTopic name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <PublicationsByYear name={name} />
                    </Col>
                  </Row>
                  <Row gutters>
                    <Col>
                      <PublicationsByLaboratory name={name} />
                    </Col>
                  </Row>
                </>
              )}
            </>
          )
        }
      </Container>
    </>
  );
}
