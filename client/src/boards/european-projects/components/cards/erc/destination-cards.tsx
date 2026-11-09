import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Title } from "@dataesr/dsfr-plus";
import { getErcSynthesisByDestination, ErcDestinationData } from "../../../api/erc";
import { ErcStatCard, ErcStatCardSkeleton, ViewMode } from "./stat-card";
import i18nGlobal from "../../../i18n-global.json";
import { getI18nLabel } from "../../../../../utils";

import "./styles.scss";

// Mapping des codes de destination vers des noms lisibles
const DESTINATION_NAMES: Record<string, string> = {
  STG: "Starting Grants",
  COG: "Consolidator Grants",
  ADG: "Advanced Grants",
  SYG: "Synergy Grants",
  POC: "Proof of Concept",
};

interface ErcDestinationCardsProps {
  countryCode?: string;
  callYear?: string;
}

export default function ErcDestinationCards({ countryCode, callYear }: ErcDestinationCardsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pi");
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery<ErcDestinationData[]>({
    queryKey: ["erc-synthesis-by-destination", countryCode, callYear],
    queryFn: () =>
      getErcSynthesisByDestination({
        country_code: countryCode,
        call_year: callYear,
      }),
  });

  if (isLoading) {
    return (
      <div className="erc-destination-section">
        <Title as="h3">Par type de financement</Title>
        <div className="erc-stat-cards">
          {[1, 2, 3, 4, 5].map((i) => (
            <ErcStatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="erc-destination-section">
      <div className="section-header">
        <Title as="h3">Par type de financement</Title>
        <SegmentedControl className="fr-segmented--sm" name="destination-view-mode">
          <SegmentedElement checked={viewMode === "pi"} label={getI18nLabel(i18nGlobal, "pi", currentLang)} onClick={() => setViewMode("pi")} value="pi" />
          <SegmentedElement checked={viewMode === "funding"} label={getI18nLabel(i18nGlobal, "total-fund-eur", currentLang)} onClick={() => setViewMode("funding")} value="funding" />
          <SegmentedElement checked={viewMode === "projects"} label={getI18nLabel(i18nGlobal, "projects", currentLang)} onClick={() => setViewMode("projects")} value="projects" />
        </SegmentedControl>
      </div>
      <div className="erc-stat-cards">
        {data.map((destination) => {
          const displayName = DESTINATION_NAMES[destination.destination_code] || destination.destination_name_en || destination.destination_code;
          return (
            <ErcStatCard
              key={destination.destination_code}
              data={{
                title: displayName,
                code: destination.destination_code,
                evaluatedCount: destination.evaluated?.total_projects || 0,
                successfulCount: destination.successful?.total_projects || 0,
                fundingAmount: destination.successful?.total_funding_entity || 0,
                piCountSuccessful: destination.successful?.total_pi || 0,
                piCountEvaluated: destination.evaluated?.total_pi || 0,
              }}
              viewMode={viewMode}
            />
          );
        })}
      </div>
    </div>
  );
}
