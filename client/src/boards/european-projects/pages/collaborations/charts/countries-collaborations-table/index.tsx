import { Button, Col, Container, Modal, ModalContent, Row, Tag, TagGroup, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getNeighbouringCountriesFromIso3 } from "../../../../../../utils";
import i18nGlobal from "../../../../i18n-global.json";
import { getFlagEmoji } from "../../../../utils";
import i18nLocal from "./i18n.json";
import { getCollaborations, getCollaborationsByCountry } from "./query";
import { useGetParams } from "./utils";

type CollaborationDetail = {
  project_id: string;
  call_year: string;
  country_code: string;
  country_code_collab: string;
  participates_as: string;
  participates_as_collab: string;
  total_cost: number;
  proposal_budget: number;
  participation_nuts: string;
  participation_nuts_collab: string;
  flag_coordination: string;
};

export default function CountriesCollaborationsTable() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const navigate = useNavigate();
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortColumn, setSortColumn] = useState("collaborations");
  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedParticipationType, setSelectedParticipationType] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(20);

  type YearData = {
    year: string;
    count: number;
  };

  type CollaborationCountry = {
    country_code: string;
    country_name_fr: string;
    country_name_en: string;
    total_collaborations: number;
    total_amount: number;
    by_year: YearData[];
  };

  const [collabCountry, setCollabCountry] = useState<CollaborationCountry | null>(null);
  const currentLang = searchParams.get("language") || "fr";
  const country_code = searchParams.get("country_code") || "FRA";

  const configChart = {
    id: "CountriesCollaborationsTable",
    queryId: "CountriesCollaborations",
    title: {
      fr: `Liste des pays collaborateurs`,
      en: "List of collaborating countries",
    },
    subtitle: "",
    description: null,
    integrationURL: "/european-projects/components/pages/analysis/positioning/charts/top-10-participating-organizations",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["CountriesCollaborationsTable", params],
    queryFn: () => getCollaborations(params),
  });

  const { data: collaborationDetails, isLoading: isLoadingDetails } = useQuery<CollaborationDetail[]>({
    queryKey: ["getCollaborationsByCountry", params, collabCountry?.country_code],
    queryFn: () => getCollaborationsByCountry(params, collabCountry?.country_code),
    enabled: !!collabCountry,
  });

  const { data: dataCountries } = useQuery({
    queryKey: ["getNeighbouringCountriesFromIso3", country_code],
    queryFn: () => getNeighbouringCountriesFromIso3(country_code),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const i18n = { ...i18nGlobal, ...i18nLocal };
  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      if (sortColumn === "country") {
        return sortDirection === "asc" ? a.country_name_fr.localeCompare(b.country_name_fr) : b.country_name_fr.localeCompare(a.country_name_fr);
      }
      if (sortColumn === "amount") {
        return sortDirection === "asc" ? (a.total_amount || 0) - (b.total_amount || 0) : (b.total_amount || 0) - (a.total_amount || 0);
      }
      return sortDirection === "asc" ? a.total_collaborations - b.total_collaborations : b.total_collaborations - a.total_collaborations;
    });
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = sortData(data);
  const displayedData = showAll ? sortedData : sortedData.slice(0, 10);

  const total_collaborations = sortedData.reduce((acc, item) => acc + item.total_collaborations, 0);

  const handleCountryClick = (countryCode) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("country_code", countryCode);
    navigate(`?${newSearchParams.toString()}`);
  };

  // Fonctions utilitaires pour le traitement des données
  type CollaborationStats = {
    total: number;
    totalBudget: number;
    asCoordinator: number;
  };

  type ProcessedCollaborationDetails = {
    years: string[];
    byYear: Record<string, CollaborationDetail[]>;
    stats: CollaborationStats;
  };

  const processCollaborationDetails = (data: CollaborationDetail[] | undefined): ProcessedCollaborationDetails => {
    if (!data) return { years: [], byYear: {}, stats: { total: 0, totalBudget: 0, asCoordinator: 0 } };

    const byYear = data.reduce((acc, item) => {
      if (!acc[item.call_year]) acc[item.call_year] = [];
      acc[item.call_year].push(item);
      return acc;
    }, {} as Record<string, CollaborationDetail[]>);

    const years = Object.keys(byYear).sort((a, b) => parseInt(b) - parseInt(a));
    const minYear = Math.min(...years.map(Number));
    const maxYear = Math.max(...years.map(Number));
    const yearRanges = [`${minYear}-${maxYear}`, ...years];

    const stats = {
      total: data.length,
      totalBudget: data.reduce((sum, item) => sum + (item.total_cost || 0), 0),
      asCoordinator: data.filter((item) => item.flag_coordination === "True").length,
    };

    return { years: yearRanges, byYear, stats };
  };

  const filterData = (data: CollaborationDetail[] | undefined, withLimit = true) => {
    if (!data) return [];
    let filtered = [...data];

    if (selectedYear !== "all") {
      const yearStart = parseInt(selectedYear.split("-")[0]);
      const yearEnd = parseInt(selectedYear.split("-")[1]) || yearStart;
      filtered = filtered.filter((item) => {
        const itemYear = parseInt(item.call_year);
        return itemYear >= yearStart && itemYear <= yearEnd;
      });
    }

    if (selectedParticipationType !== "all") {
      filtered = filtered.filter((item) => item.participates_as === selectedParticipationType);
    }

    return withLimit ? filtered.slice(0, displayLimit) : filtered;
  };

  return (
    <Container fluid className="fr-mt-5w">
      <Row>
        <Title as="h2" look="h4" className="fr-mb-3w">
          {configChart.title[currentLang]}
        </Title>
      </Row>
      <Row>
        <Col>
          <div className="fr-table fr-table--sm">
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          <button className="fr-btn fr-btn--tertiary-no-outline" onClick={() => handleSort("country")}>
                            {getI18nLabel("country")} {sortColumn === "country" && (sortDirection === "asc" ? "↑" : "↓")}
                          </button>
                        </th>
                        <th>
                          <button className="fr-btn fr-btn--tertiary-no-outline" onClick={() => handleSort("collaborations")}>
                            {getI18nLabel("collaborations-count")} {sortColumn === "collaborations" && (sortDirection === "asc" ? "↑" : "↓")}
                          </button>
                        </th>
                        <th style={{ minWidth: "120px" }}>{currentLang === "fr" ? "Évolution 2021-2025" : "Trend 2021-2025"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedData.map((collab) => {
                        // Préparer les données sparkline pour 2021-2025
                        const years = ["2021", "2022", "2023", "2024", "2025"];
                        const yearCounts = years.map((year) => {
                          const found = collab.by_year?.find((y) => y.year === year);
                          return found?.count || 0;
                        });
                        const maxCount = Math.max(...yearCounts, 1);

                        return (
                          <tr key={collab.country_code}>
                            <td className="fr-py-0">
                              <button className="fr-btn fr-btn--tertiary-no-outline fr-p-0" onClick={() => handleCountryClick(collab.country_code)}>
                                {getFlagEmoji(collab.country_code)}
                                <span className="fr-ml-1w">{collab[`country_name_${currentLang}`]}</span>
                                {
                                  // ajoute un badge si le pays est un pays frontalier
                                  dataCountries && dataCountries.includes(collab.country_code) && (
                                    <span
                                      className="fr-mx-1w"
                                      style={{
                                        display: "inline-block",
                                        width: "5px",
                                        height: "5px",
                                        backgroundColor: "#000091",
                                        borderRadius: "50%",
                                      }}
                                    />
                                  )
                                }
                              </button>
                            </td>
                            <td className="fr-py-0" style={{ textAlign: "center" }}>
                              {collab.total_collaborations}
                              <Button
                                icon="eye-line"
                                className="fr-ml-1w"
                                size="sm"
                                variant="text"
                                onClick={() => {
                                  setCollabCountry(collab);
                                  setIsModalOpen(true);
                                }}
                              />
                            </td>
                            <td className="fr-py-0">
                              <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "24px", position: "relative" }}>
                                {yearCounts.map((count, idx) => {
                                  // Dégradé violet de clair à foncé selon l'année
                                  const purpleGradient = ["#c8b6ff", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9"];
                                  return (
                                    <div
                                      key={years[idx]}
                                      className="sparkline-bar"
                                      data-tooltip={`${years[idx]}: ${count} projet${count > 1 ? "s" : ""}`}
                                      style={{
                                        width: "16px",
                                        height: `${Math.max((count / maxCount) * 24, 2)}px`,
                                        backgroundColor: count > 0 ? purpleGradient[idx] : "#e0e0e0",
                                        borderRadius: "2px",
                                        cursor: "pointer",
                                        position: "relative",
                                      }}
                                    />
                                  );
                                })}
                              </div>
                              <style>{`
                                .sparkline-bar {
                                  position: relative;
                                }
                                .sparkline-bar::after {
                                  content: attr(data-tooltip);
                                  position: absolute;
                                  bottom: 100%;
                                  left: 50%;
                                  transform: translateX(-50%);
                                  background: #333;
                                  color: white;
                                  padding: 4px 8px;
                                  border-radius: 4px;
                                  font-size: 12px;
                                  white-space: nowrap;
                                  opacity: 0;
                                  pointer-events: none;
                                  transition: opacity 0.2s;
                                  z-index: 100;
                                }
                                .sparkline-bar:hover::after {
                                  opacity: 1;
                                }
                              `}</style>
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={4} className="fr-text--sm">
                          {getI18nLabel("total-collaborations")}
                          {total_collaborations.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          {sortedData.length > 10 && (
            <Button className="fr-mr-1w" onClick={() => setShowAll(!showAll)} size="sm" variant="secondary">
              {showAll ? getI18nLabel("show-less") : getI18nLabel("show-more")}
            </Button>
          )}
          <Button
            onClick={() => {
              const header = "country_code,country_name,total_collaborations,total_amount,2021,2022,2023,2024,2025";
              const rows = data.map((e) => {
                const years = ["2021", "2022", "2023", "2024", "2025"];
                const yearCounts = years.map((year) => {
                  const found = e.by_year?.find((y) => y.year === year);
                  return found?.count || 0;
                });
                return `${e.country_code},${e.country_name_fr},${e.total_collaborations},${e.total_amount || 0},${yearCounts.join(",")}`;
              });
              const csvContent = "data:text/csv;charset=utf-8," + header + "\n" + rows.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `countries_collaborations_${country_code}.csv`);
              document.body.appendChild(link); // Required for FF
              link.click(); // This will download the data file
              document.body.removeChild(link); // Clean up
            }}
            size="sm"
            variant="secondary"
          >
            {getI18nLabel("download_data")}
          </Button>
        </Col>
      </Row>
      <Modal isOpen={isModalOpen} hide={() => setIsModalOpen(false)} size="xl">
        <ModalContent>
          {isLoadingDetails ? (
            <p>Chargement des détails...</p>
          ) : (
            <>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12">
                  <h4>{collabCountry && `${getFlagEmoji(collabCountry.country_code)} ${collabCountry[`country_name_${currentLang}`]}`}</h4>
                </div>
              </div>

              {collaborationDetails && (
                <>
                  {/* Statistiques globales */}
                  <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
                    <div className="fr-col-12">
                      <TagGroup>
                        <Tag color="green-bourgeon">{processCollaborationDetails(collaborationDetails).stats.total} projets</Tag>
                        <Tag color="yellow-tournesol">
                          {processCollaborationDetails(collaborationDetails).stats.asCoordinator} en tant que coordinateur
                        </Tag>
                      </TagGroup>
                    </div>
                  </div>

                  {/* Filtres */}
                  <Row gutters className="fr-mt-2w">
                    <Col>
                      <label className="fr-label">Années</label>
                      <select className="fr-select" onChange={(e) => setSelectedYear(e.target.value)} value={selectedYear}>
                        {processCollaborationDetails(collaborationDetails).years.map((year) => (
                          <option key={year} value={year}>
                            {year.includes("-") ? `${year} (Toutes)` : year}
                          </option>
                        ))}
                      </select>
                    </Col>
                    <Col>
                      <label className="fr-label">Type de participation du pays</label>
                      <select className="fr-select" onChange={(e) => setSelectedParticipationType(e.target.value)} value={selectedParticipationType}>
                        <option value="all">Tous</option>
                        <option value="beneficiary">Bénéficiaire</option>
                        <option value="thirdparty">Partenaire tiers</option>
                        <option value="associated partner">Associé</option>
                      </select>
                    </Col>
                  </Row>

                  <Row>
                    {/* Récapitulatif en tags */}
                    <Col className="fr-pt-2w" md={7}>
                      <Row>
                        <Col>
                          <TagGroup>
                            <Tag>
                              <span className="fr-icon-calendar-line fr-mr-1w" aria-hidden="true" />
                              {selectedYear === "all" ? "Toutes les années" : selectedYear.includes("-") ? `${selectedYear} (Toutes)` : selectedYear}
                            </Tag>
                            <Tag>
                              <span className="fr-icon-folder-2-line fr-mr-1w" aria-hidden="true" />
                              {filterData(collaborationDetails, false).length} projets
                            </Tag>
                          </TagGroup>
                        </Col>
                      </Row>
                    </Col>

                    {/* Bouton de téléchargement */}
                    <Col className="text-center fr-pt-2w">
                      <Button
                        icon="download-line"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const dataToExport = filterData(collaborationDetails, false);
                          const headers =
                            currentLang === "fr"
                              ? ["Année", "ID Projet", "Rôle pays", "Rôle collab."]
                              : ["Year", "Project ID", "Country role", "Collab. role"];
                          const csvContent =
                            "data:text/csv;charset=utf-8," +
                            headers.join(",") +
                            "\n" +
                            dataToExport
                              .map((item) =>
                                [
                                  item.call_year,
                                  item.project_id,
                                  item.country_code,
                                  item.country_code_collab,
                                ].join(","),
                              )
                              .join("\n");
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `collaborations_${country_code}_${collabCountry?.country_code}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        {getI18nLabel("download_data")}
                      </Button>
                    </Col>
                  </Row>

                  {/* Liste des projets */}
                  <div className="fr-table fr-table--sm">
                    <div className="fr-table__wrapper">
                      <div className="fr-table__container">
                        <div className="fr-table__content">
                          <table>
                            <thead>
                              <tr>
                                <th>Année</th>
                                <th>ID Projet</th>
                                <th>Rôle pays</th>
                                <th>Rôle collab.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filterData(collaborationDetails).map((item, index) => (
                                <tr key={`${item.project_id}-${index}`}>
                                  <td className="fr-py-0">{item.call_year}</td>
                                  <td className="fr-py-0">{item.project_id}</td> {/* TODO: lien vers commission ? */}
                                  <td className="fr-py-0">{item.country_code}</td>
                                  <td className="fr-py-0">{item.country_code_collab}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {collaborationDetails.length > displayLimit && (
                    <div className="fr-mt-2w">
                      <Button onClick={() => setDisplayLimit((prev) => prev + 50)} size="sm" variant="secondary">
                        Voir plus de résultats
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </Container>
  );
}
