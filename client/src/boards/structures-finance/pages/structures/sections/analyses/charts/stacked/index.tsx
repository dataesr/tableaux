import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import MetricDefinitionsTable from "../../../../../../components/metric-definitions/metric-definitions-table";
import { BudgetWarning } from "../../../../../../components/budget-warning";
import { RenderDataStacked } from "../render-data";
import { createStackedChartOptions } from "./options";
import { METRICS_CONFIG } from "../../../../../../config/metrics-config";
import type { MetricKey } from "../../../../../../config/metrics-config";

import type { InstitutionSeries } from "..";

interface StackedEvolutionChartProps {
  selectedMetrics: MetricKey[];
  baseMetrics: MetricKey[];
  chartConfig: any;
  displayMode: "values" | "percentage";
  onDisplayModeChange: (mode: "values" | "percentage") => void;
  xAxisField: "exercice" | "exercice_fin" | "anuniv";
  seriesGroups: InstitutionSeries[];
}

export default function StackedEvolutionChart({
  selectedMetrics,
  baseMetrics,
  chartConfig,
  displayMode,
  onDisplayModeChange,
  xAxisField,
  seriesGroups,
}: StackedEvolutionChartProps) {
  const data = seriesGroups.flatMap(g => g.records);
  const chartOptions = createStackedChartOptions(
    seriesGroups,
    selectedMetrics,
    METRICS_CONFIG,
    displayMode === "percentage",
    xAxisField
  );

  if (data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info" role="status">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <>
      <div className="fr-mb-2w">
        <SegmentedControl
          className="fr-segmented--sm fr-segmented--no-legend"
          label="Affichage"
          name="evolution-stacked-mode"
        >
          <SegmentedElement
            checked={displayMode === "values"}
            label="Valeurs"
            onClick={() => onDisplayModeChange("values")}
            value="values"
          />
          <SegmentedElement
            checked={displayMode === "percentage"}
            label="Part %"
            onClick={() => onDisplayModeChange("percentage")}
            value="percentage"
          />
        </SegmentedControl>
      </div>

      <ChartWrapper
        config={chartConfig}
        options={chartOptions}
        renderData={() => (
          <RenderDataStacked
            data={data}
            metrics={selectedMetrics}
            metricsConfig={METRICS_CONFIG}
          />
        )}
      />
      <BudgetWarning data={data} metrics={baseMetrics} />
      <MetricDefinitionsTable metricKeys={selectedMetrics} />
    </>
  );
}
