import { PositionningSectionWrapper } from "./components/section-wrapper";
import PositioningFilters from "./components/filters-container/filters";
import ChartTypeSelector from "./components/chart-type-selector";
import PositioningCharts from "./charts";
import { usePositioningData, usePositioningParams } from "./hooks";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "../styles.scss";
import { Text } from "@dataesr/dsfr-plus";

interface PositionnementSectionProps {
  data: any;
  selectedYear?: string | number;
}

export function PositionnementSection({
  data,
  selectedYear,
}: PositionnementSectionProps) {
  const {
    filters,
    setFilters,
    selectedAnalysis,
    setSelectedAnalysis,
    activeChart,
    setActiveChart,
  } = usePositioningParams();

  const { allItems, filteredItems, isLoading } = usePositioningData(
    selectedYear,
    data,
    filters
  );

  const structureName =
    data?.etablissement_actuel_lib ||
    data?.etablissement_lib ||
    "l'établissement";

  if (isLoading) {
    return (
      <PositionningSectionWrapper structureName={structureName}>
        <DefaultSkeleton />
      </PositionningSectionWrapper>
    );
  }

  if (allItems.length === 0) {
    return (
      <PositionningSectionWrapper structureName={structureName}>
        <div className="fr-alert fr-alert--warning" role="alert">
          <Text>
            Les données de comparaison ne sont pas disponibles pour l'année
            sélectionnée.
          </Text>
        </div>
      </PositionningSectionWrapper>
    );
  }

  return (
    <PositionningSectionWrapper structureName={structureName}>
      <PositioningFilters
        data={allItems}
        currentStructure={data}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ChartTypeSelector
        activeChart={activeChart}
        onChartChange={setActiveChart}
      />

      {filteredItems.length === 0 ? (
        <div className="fr-alert fr-alert--warning" role="alert">
          <Text>
            Aucun établissement ne correspond aux filtres sélectionnés.
          </Text>
        </div>
      ) : filteredItems.length === 1 ? (
        <div className="fr-alert fr-alert--warning" role="alert">
          <Text>
            Le graphique ne peut pas être affiché lorsqu'il n'y a qu'un seul
            point.
          </Text>
        </div>
      ) : (
        <PositioningCharts
          activeChart={activeChart}
          onChartChange={setActiveChart}
          data={filteredItems}
          allData={allItems}
          currentStructure={data}
          selectedYear={selectedYear}
          selectedAnalysis={selectedAnalysis}
          onSelectAnalysis={setSelectedAnalysis}
          activeFilters={filters}
        />
      )}
    </PositionningSectionWrapper>
  );
}
