import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAllData } from "./query";
import Options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { Row, Col, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useGetParams, renderDataTable } from "./utils";

const SCIENTIFIC_DOMAINS = [
  { code: "ALL", labelFr: "Tous les domaines", labelEn: "All domains" },
  { code: "LS", labelFr: "Sciences de la vie (LS)", labelEn: "Life Sciences (LS)" },
  { code: "PE", labelFr: "Sciences physiques et ingénierie (PE)", labelEn: "Physical Sciences & Engineering (PE)" },
  { code: "SH", labelFr: "Sciences sociales et humaines (SH)", labelEn: "Social Sciences & Humanities (SH)" },
];

export default function ErcDomainPanelEntities() {
  const { params: urlParams, currentLang } = useGetParams();
  const [selectedDomain, setSelectedDomain] = useState("ALL");
  const [selectedPanel, setSelectedPanel] = useState("ALL");
  const [displayLimit, setDisplayLimit] = useState(10);
  const color = useChartColor();

  // Récupération de la liste des panels depuis l'endpoint /erc/filters
  const { data: filtersData } = useQuery({
    queryKey: ["ercFilters"],
    queryFn: () => fetch(`${import.meta.env.VITE_APP_SERVER_URL}/european-projects/erc/filters`).then((r) => r.json()),
  });

  const allPanels: { id: string; name: string; domaine: string }[] = filtersData?.panels ?? [];
  const panelsForDomain = selectedDomain === "ALL" ? allPanels : allPanels.filter((p) => p.id?.toUpperCase().startsWith(selectedDomain));

  // Construit les query params selon les filtres sélectionnés
  const queryParams = (() => {
    const parts = urlParams ? [urlParams] : [];
    if (selectedPanel !== "ALL") {
      parts.push(`panel_id=${selectedPanel}`);
    } else if (selectedDomain !== "ALL") {
      parts.push(`domaine_scientifique=${selectedDomain}`);
    }
    return parts.join("&");
  })();

  const byDomain = selectedDomain !== "ALL" || selectedPanel !== "ALL";

  const { data: allData, isLoading } = useQuery({
    queryKey: ["ercDomainPanelEntities", queryParams, byDomain],
    queryFn: () => getAllData(queryParams, byDomain),
    enabled: !!queryParams,
  });

  const totalCount = allData?.list?.length ?? 0;
  const displayedList = allData?.list?.slice(0, displayLimit) ?? [];
  const data = allData ? { ...allData, list: displayedList } : undefined;

  const domainLabel = SCIENTIFIC_DOMAINS.find((d) => d.code === selectedDomain);
  const panelLabel = allPanels.find((p) => p.id === selectedPanel);
  const titleSuffixFr =
    selectedPanel !== "ALL" && panelLabel
      ? ` — ${panelLabel.id} (${panelLabel.name})`
      : selectedDomain !== "ALL" && domainLabel
        ? ` — ${domainLabel.labelFr}`
        : "";
  const titleSuffixEn =
    selectedPanel !== "ALL" && panelLabel
      ? ` — ${panelLabel.id} (${panelLabel.name})`
      : selectedDomain !== "ALL" && domainLabel
        ? ` — ${domainLabel.labelEn}`
        : "";

  const isShowingAll = displayLimit >= totalCount;
  const titleConfig = {
    fr: isShowingAll ? `Toutes les entités ERC par domaine scientifique${titleSuffixFr}` : `Top ${displayLimit} des entités ERC par domaine scientifique${titleSuffixFr}`,
    en: isShowingAll ? `All ERC entities by funding${titleSuffixEn}` : `Top ${displayLimit} ERC entities by funding${titleSuffixEn}`,
    className: "fr-mt-2w fr-ml-1w",
  };

  const config = {
    id: "ercDomainPanelEntities",
    comment: {
      fr: <>Entités ayant obtenu le plus de financements ERC pour le pays sélectionné, filtrables par domaine scientifique et par panel.</>,
      en: <>Entities that received the most ERC funding for the selected country, filterable by scientific domain and panel.</>,
    },
    integrationURL: "/european-projects/components/pages/erc/charts/domain-panel-entities",
  };

  return (
    <div className={`fr-mt-5w chart-container chart-container--${color}`}>
      <ChartWrapper.Title config={{ title: titleConfig, id: config.id }} />
      <Row gutters>
        <Col className="fr-ml-1w">
          <label className="fr-label" htmlFor="erc-dp-domain-select">
            {currentLang === "fr" ? "Domaine scientifique" : "Scientific domain"}
          </label>
          <select
            className="fr-select"
            id="erc-dp-domain-select"
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setSelectedPanel("ALL");
              setDisplayLimit(10);
            }}
          >
            {SCIENTIFIC_DOMAINS.map((d) => (
              <option key={d.code} value={d.code}>
                {currentLang === "fr" ? d.labelFr : d.labelEn}
              </option>
            ))}
          </select>
        </Col>
        {panelsForDomain.length > 0 && (
          <Col>
            <label className="fr-label" htmlFor="erc-dp-panel-select">
              {currentLang === "fr" ? "Panel" : "Panel"}
            </label>
            <select
              className="fr-select"
              id="erc-dp-panel-select"
              key={selectedDomain}
              value={selectedPanel}
              onChange={(e) => {
                setSelectedPanel(e.target.value);
                setDisplayLimit(10);
              }}
            >
              <option value="ALL">{currentLang === "fr" ? "Tous les panels" : "All panels"}</option>
              {panelsForDomain
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.name}
                  </option>
                ))}
            </select>
          </Col>
        )}
        <Col className="fr-pt-6w">
          <SegmentedControl className="fr-segmented--sm" name="erc-dp-entities-limit">
            <SegmentedElement checked={displayLimit === 10 && !isShowingAll} label="Top 10" onClick={() => setDisplayLimit(10)} value="10" />
            <SegmentedElement checked={displayLimit > 10 && !isShowingAll} label="+ 5" onClick={() => setDisplayLimit((prev) => Math.min(prev + 5, totalCount))} value="add5" />
            <SegmentedElement checked={isShowingAll} label={currentLang === "fr" ? `Tout voir (${totalCount})` : `Show all (${totalCount})`} onClick={() => setDisplayLimit(totalCount)} value="all" />
          </SegmentedControl>
        </Col>
      </Row>
      {isLoading || !data ? (
        <DefaultSkeleton />
      ) : !data?.list?.length ? (
        <p className="fr-text--sm fr-hint-text">{currentLang === "fr" ? "Aucune donnée disponible." : "No data available."}</p>
      ) : (
        <>
          <ChartWrapper config={config} options={Options(data, currentLang)} renderData={() => renderDataTable(data, currentLang)} />
        </>
      )}
    </div>
  );
}
