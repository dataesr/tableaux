import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { getErcSynthesisByDestination, ErcDestinationData } from "../../../api/erc";
import { ErcStatCard, ErcStatCardSkeleton, ViewMode } from "./stat-card";
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
  const [viewMode, setViewMode] = useState<ViewMode>("projects");

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
        <h3>Par type de financement</h3>
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
        <h3>Par type de financement</h3>
        <SegmentedControl className="fr-segmented--sm" name="destination-view-mode">
          <SegmentedElement checked={viewMode === "projects"} label="Projets" onClick={() => setViewMode("projects")} value="projects" />
          <SegmentedElement checked={viewMode === "funding"} label="Financements" onClick={() => setViewMode("funding")} value="funding" />
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
                piCount: destination.successful?.total_pi || 0,
              }}
              viewMode={viewMode}
            />
          );
        })}
      </div>
    </div>
  );
}
