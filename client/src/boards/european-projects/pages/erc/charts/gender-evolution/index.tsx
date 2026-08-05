import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Col, Row } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const ERC_DESTINATIONS = [
  { code: "ALL", labelFr: "Tous types de financement", labelEn: "All funding types" },
  { code: "STG", labelFr: "Starting grants (STG)", labelEn: "Starting grants (STG)" },
  { code: "COG", labelFr: "Consolidator grants (COG)", labelEn: "Consolidator grants (COG)" },
  { code: "ADG", labelFr: "Advanced grants (ADG)", labelEn: "Advanced grants (ADG)" },
  { code: "POC", labelFr: "Proof of Concept (POC)", labelEn: "Proof of Concept (POC)" },
  { code: "SyG", labelFr: "Synergy grants (SyG)", labelEn: "Synergy grants (SyG)" },
];

const SCIENTIFIC_DOMAINS = [
  { code: "ALL", labelFr: "Tous les domaines", labelEn: "All domains" },
  { code: "LS", labelFr: "Sciences de la vie (LS)", labelEn: "Life Sciences (LS)" },
  { code: "PE", labelFr: "Sciences physiques et ingénierie (PE)", labelEn: "Physical Sciences & Engineering (PE)" },
  { code: "SH", labelFr: "Sciences sociales et humaines (SH)", labelEn: "Social Sciences & Humanities (SH)" },
];

function useGetParams() {
  const [searchParams] = useSearchParams();
  const params: string[] = [];
  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);
  // Pas de filtre call_year ici : on affiche l'évolution sur toutes les années disponibles
  const currentLang = (searchParams.get("language") || "fr") as "fr" | "en";
  return { params: params.join("&"), currentLang };
}

export default function ErcGenderEvolution() {
  const { params: urlParams, currentLang } = useGetParams();
  const [selectedDestination, setSelectedDestination] = useState("ALL");
  const [selectedDomain, setSelectedDomain] = useState("ALL");

  const { data: filtersData } = useQuery({
    queryKey: ["ercFilters"],
    queryFn: () => fetch(`${import.meta.env.VITE_APP_SERVER_URL}/european-projects/erc/filters`).then((r) => r.json()),
  });

  const allPanels: { id: string; name: string; domaine: string }[] = filtersData?.panels ?? [];
  const panelsForDomain = selectedDomain === "ALL" ? [] : allPanels.filter((p) => p.id?.toUpperCase().startsWith(selectedDomain));
  const [selectedPanel, setSelectedPanel] = useState("ALL");

  const queryParams = (() => {
    const parts = [urlParams];
    if (selectedDestination !== "ALL") parts.push(`destination_code=${selectedDestination}`);
    if (selectedPanel !== "ALL") {
      parts.push(`panel_id=${selectedPanel}`);
    } else if (selectedDomain !== "ALL") {
      parts.push(`domaine_scientifique=${selectedDomain}`);
    }
    return parts.join("&");
  })();

  const { data, isLoading } = useQuery({
    queryKey: ["ercGenderEvolution", queryParams],
    queryFn: () => getData(queryParams),
    enabled: !!queryParams,
  });

  const config = {
    id: "ercGenderEvolution",
    comment: {
      fr: (
        <>
          Évolution annuelle de la répartition par genre des candidats ERC. Chaque point représente la part (en %) d'un genre pour une année d'appel
          donnée, calculée sur les effectifs cumulés de cette année. Le filtre par période n'est pas appliqué ici afin de montrer l'ensemble de
          l'évolution disponible ; seuls les filtres par type de financement et par domaine/panel sont actifs.
        </>
      ),
      en: (
        <>
          Annual evolution of the gender distribution among ERC applicants. Each point shows the share (%) of a given gender for a call year,
          calculated on the cumulative headcount for that year. The year-range filter is not applied here so that the full evolution is visible; only
          the funding type and domain/panel filters are active.
        </>
      ),
    },
    integrationURL: "/european-projects/components/pages/erc/charts/gender-evolution",
  };

  const destLabel = ERC_DESTINATIONS.find((d) => d.code === selectedDestination);
  const domainLabel = SCIENTIFIC_DOMAINS.find((d) => d.code === selectedDomain);
  const panelLabel = allPanels.find((p) => p.id === selectedPanel);

  const suffix =
    selectedPanel !== "ALL" && panelLabel
      ? ` — ${panelLabel.id}`
      : selectedDomain !== "ALL" && domainLabel
        ? ` — ${domainLabel[currentLang === "fr" ? "labelFr" : "labelEn"]}`
        : "";
  const destSuffix = selectedDestination !== "ALL" && destLabel ? ` · ${destLabel[currentLang === "fr" ? "labelFr" : "labelEn"]}` : "";

  const titleConfig = {
    fr: `Évolution de la part des cadidats par genre à l'ERC${suffix}${destSuffix}`,
    en: `Evolution of the share of ERC applicants by gender${suffix}${destSuffix}`,
  };

  return (
    <div className="fr-my-5w chart-container--default">
      <ChartWrapper.Title config={{ title: titleConfig, id: config.id }} />
      <Row gutters>
        <Col md={4}>
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="gender-evo-dest-select">
              {currentLang === "fr" ? "Type de financement" : "Funding type"}
            </label>
            <select className="fr-select" id="gender-evo-dest-select" value={selectedDestination} onChange={(e) => setSelectedDestination(e.target.value)}>
              {ERC_DESTINATIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {currentLang === "fr" ? d.labelFr : d.labelEn}
                </option>
              ))}
            </select>
          </div>
        </Col>
        <Col md={4}>
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="gender-evo-domain-select">
              {currentLang === "fr" ? "Domaine scientifique" : "Scientific domain"}
            </label>
            <select
              className="fr-select"
              id="gender-evo-domain-select"
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setSelectedPanel("ALL");
              }}
            >
              {SCIENTIFIC_DOMAINS.map((d) => (
                <option key={d.code} value={d.code}>
                  {currentLang === "fr" ? d.labelFr : d.labelEn}
                </option>
              ))}
            </select>
          </div>
        </Col>
        {panelsForDomain.length > 0 && (
          <Col md={4}>
            <div className="fr-select-group">
              <label className="fr-label" htmlFor="gender-evo-panel-select">
                {currentLang === "fr" ? "Panel ERC" : "ERC Panel"}
              </label>
              <select className="fr-select" id="gender-evo-panel-select" value={selectedPanel} onChange={(e) => setSelectedPanel(e.target.value)}>
                <option value="ALL">{currentLang === "fr" ? "Tous les panels" : "All panels"}</option>
                {panelsForDomain.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </Col>
        )}
      </Row>
      {isLoading || !data ? (
        <DefaultSkeleton />
      ) : !data?.years?.length ? (
        <p className="fr-text--sm fr-hint-text">{currentLang === "fr" ? "Aucune donnée disponible." : "No data available."}</p>
      ) : (
        <div className="chart-container chart-container--default">
          <ChartWrapper config={config} options={Options(data, currentLang)} renderData={() => null} />
        </div>
      )}
    </div>
  );
}
