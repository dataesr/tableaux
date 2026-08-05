import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Col, Row } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { rangeOfYearsToApiFormat } from "../../url-utils";

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
  const rangeOfYears = searchParams.get("range_of_years");
  const callYear = rangeOfYearsToApiFormat(rangeOfYears);
  if (callYear) params.push(`call_year=${callYear}`);
  const currentLang = (searchParams.get("language") || "fr") as "fr" | "en";
  return { params: params.join("&"), currentLang };
}

export default function ErcGenderByDomain() {
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
    queryKey: ["ercGenderByDomain", queryParams],
    queryFn: () => getData(queryParams),
    enabled: !!queryParams,
  });

  const config = {
    id: "ercGenderByDomain",
    comment: {
      fr: (
        <>
          Répartition par genre des candidats ERC selon le domaine scientifique (ou le panel ERC si sélectionné). Les valeurs affichées sont des
          effectifs cumulés sur la période sélectionnée (non des moyennes). Les pourcentages sont calculés par domaine/panel sur les candidats dont le
          genre est identifié (femme, homme, non binaire).
        </>
      ),
      en: (
        <>
          Gender breakdown of ERC applicants by scientific domain (or ERC panel if selected). Figures shown are cumulative counts over the selected
          period (not averages). Percentages are calculated per domain/panel on applicants with an identified gender (female, male, non binary).
        </>
      ),
    },
    integrationURL: "/european-projects/components/pages/erc/charts/gender-by-domain",
  };

  const destLabel = ERC_DESTINATIONS.find((d) => d.code === selectedDestination);
  const domainLabel = SCIENTIFIC_DOMAINS.find((d) => d.code === selectedDomain);
  const panelLabel = allPanels.find((p) => p.id === selectedPanel);

  const detailSuffix =
    selectedPanel !== "ALL" && panelLabel
      ? ` — ${panelLabel.id}`
      : selectedDomain !== "ALL" && domainLabel
        ? ` — ${domainLabel[currentLang === "fr" ? "labelFr" : "labelEn"]}`
        : "";
  const destSuffix = selectedDestination !== "ALL" && destLabel ? ` · ${destLabel[currentLang === "fr" ? "labelFr" : "labelEn"]}` : "";

  const titleConfig = {
    fr: `Répartition par genre selon le domaine scientifique ERC${detailSuffix}${destSuffix}`,
    en: `Gender distribution by ERC scientific domain${detailSuffix}${destSuffix}`,
  };

  return (
    <div className="fr-my-5w chart-container--default">
      <ChartWrapper.Title config={{ title: titleConfig, id: config.id }} />
      <Row gutters>
        <Col md={4}>
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="gender-domain-dest-select">
              {currentLang === "fr" ? "Type de financement" : "Funding type"}
            </label>
            <select className="fr-select" id="gender-domain-dest-select" value={selectedDestination} onChange={(e) => setSelectedDestination(e.target.value)}>
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
            <label className="fr-label" htmlFor="gender-domain-domain-select">
              {currentLang === "fr" ? "Domaine scientifique" : "Scientific domain"}
            </label>
            <select
              className="fr-select"
              id="gender-domain-domain-select"
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
              <label className="fr-label" htmlFor="gender-domain-panel-select">
                {currentLang === "fr" ? "Panel ERC" : "ERC Panel"}
              </label>
              <select className="fr-select" id="gender-domain-panel-select" value={selectedPanel} onChange={(e) => setSelectedPanel(e.target.value)}>
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
      ) : !data?.byGroup?.length ? (
        <p className="fr-text--sm fr-hint-text">{currentLang === "fr" ? "Aucune donnée disponible." : "No data available."}</p>
      ) : (
        <div className="chart-container chart-container--default">
          <ChartWrapper config={config} options={Options(data, currentLang, Object.fromEntries(allPanels.map((p) => [p.id, p.name])))} renderData={() => null} />
        </div>
      )}
    </div>
  );
}
