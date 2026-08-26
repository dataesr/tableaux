import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAllData } from "./query";
import Options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { rangeOfYearsToApiFormat } from "../../url-utils";
import { formatToMillions } from "../../../../../../utils/format";

const ERC_DESTINATIONS = [
  { code: "ALL", labelFr: "Tous types de financement", labelEn: "All funding types" },
  { code: "STG", labelFr: "Starting grants (STG)", labelEn: "Starting grants (STG)" },
  { code: "COG", labelFr: "Consolidator grants (COG)", labelEn: "Consolidator grants (COG)" },
  { code: "ADG", labelFr: "Advanced grants (ADG)", labelEn: "Advanced grants (ADG)" },
  { code: "POC", labelFr: "Proof of Concept (POC)", labelEn: "Proof of Concept (POC)" },
  { code: "SyG", labelFr: "Synergy grants (SyG)", labelEn: "Synergy grants (SyG)" },
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

function renderDataTable(data: { list: { acronym: string | null; name: string; total_fund_eur: number }[] }, currentLang: string) {
  if (!data?.list?.length) return null;
  const lang = currentLang as "fr" | "en";
  return (
    <table className="fr-table fr-table--sm">
      <caption>{lang === "fr" ? "Principales entités ERC" : "Main ERC entities"}</caption>
      <thead>
        <tr>
          <th scope="col">{lang === "fr" ? "Acronyme" : "Acronym"}</th>
          <th scope="col">{lang === "fr" ? "Nom" : "Name"}</th>
          <th scope="col">{lang === "fr" ? "Financement (€)" : "Funding (€)"}</th>
        </tr>
      </thead>
      <tbody>
        {data.list.map((item, i) => (
          <tr key={i}>
            <td>{item.acronym || "—"}</td>
            <td>{item.name}</td>
            <td>{formatToMillions(item.total_fund_eur)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ErcMainEntities() {
  const { params: urlParams, currentLang } = useGetParams();
  const [selectedDestination, setSelectedDestination] = useState("ALL");
  const [displayLimit, setDisplayLimit] = useState(10);
  const color = useChartColor();

  const queryParams = selectedDestination === "ALL" ? urlParams : `${urlParams}&destination_code=${selectedDestination}`;

  const { data: allData, isLoading } = useQuery({
    queryKey: ["ercMainEntities", queryParams],
    queryFn: () => getAllData(queryParams),
    enabled: !!queryParams,
  });

  const totalCount = allData?.list?.length ?? 0;
  const displayedList = allData?.list?.slice(0, displayLimit) ?? [];
  const data = allData ? { ...allData, list: displayedList } : undefined;

  const destLabel = ERC_DESTINATIONS.find((d) => d.code === selectedDestination);
  const titleSuffixFr = destLabel && selectedDestination !== "ALL" ? ` — ${destLabel.labelFr}` : "";
  const titleSuffixEn = destLabel && selectedDestination !== "ALL" ? ` — ${destLabel.labelEn}` : "";

  const isShowingAll = displayLimit >= totalCount;
  const titleConfig = {
    fr: isShowingAll ? `Toutes les entités ERC par financement${titleSuffixFr}` : `Top ${displayLimit} des entités ERC par financement${titleSuffixFr}`,
    en: isShowingAll ? `All ERC entities by funding${titleSuffixEn}` : `Top ${displayLimit} ERC entities by funding${titleSuffixEn}`,
    className: "fr-mt-2w fr-ml-1w",
  };

  const config = {
    id: "ercMainEntities",
    comment: {
      fr: <>Les 10 entités ayant obtenu le plus de financements ERC pour le pays sélectionné.</>,
      en: <>The 10 entities that received the most ERC funding for the selected country.</>,
    },
    integrationURL: "/european-projects/components/pages/erc/charts/main-entities",
  };

  return (
    <div className={`fr-mt-5w chart-container chart-container--${color}`}>
      {isLoading || !data ? (
        <DefaultSkeleton />
      ) : !data?.list?.length ? (
        <p className="fr-text--sm fr-hint-text">{currentLang === "fr" ? "Aucune donnée disponible." : "No data available."}</p>
      ) : (
        <>
          <ChartWrapper.Title config={{ title: titleConfig, id: config.id }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }} className="fr-m-1w">
            <div className="fr-select-group" style={{ flex: "0 0 auto", maxWidth: "320px", marginBottom: 0 }}>
              <label className="fr-label" htmlFor="erc-destination-select">
                {currentLang === "fr" ? "Type de financement" : "Funding type"}
              </label>
              <select
                className="fr-select"
                id="erc-destination-select"
                value={selectedDestination}
                onChange={(e) => {
                  setSelectedDestination(e.target.value);
                  setDisplayLimit(10);
                }}
              >
                {ERC_DESTINATIONS.map((dest) => (
                  <option key={dest.code} value={dest.code}>
                    {currentLang === "fr" ? dest.labelFr : dest.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <SegmentedControl className="fr-segmented--sm" name="erc-entities-limit">
              <SegmentedElement checked={displayLimit === 10 && !isShowingAll} label="Top 10" onClick={() => setDisplayLimit(10)} value="10" />
              <SegmentedElement checked={displayLimit > 10 && !isShowingAll} label="+ 5" onClick={() => setDisplayLimit((prev) => Math.min(prev + 5, totalCount))} value="add5" />
              <SegmentedElement checked={isShowingAll} label={currentLang === "fr" ? `Tout voir (${totalCount})` : `Show all (${totalCount})`} onClick={() => setDisplayLimit(totalCount)} value="all" />
            </SegmentedControl>
          </div>
          <ChartWrapper config={config} options={Options(data, currentLang)} renderData={() => renderDataTable(data, currentLang)} />
        </>
      )}
    </div>
  );
}
