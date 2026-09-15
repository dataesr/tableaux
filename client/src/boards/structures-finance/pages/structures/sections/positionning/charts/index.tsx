import { useState } from "react";
import {
  Row,
  Col,
  SegmentedControl,
  SegmentedElement,
} from "@dataesr/dsfr-plus";
import ComparisonBarChart from "./comparison-bar";
import ComparisonOverviewChart from "./comparison-overview";
import ScatterChart from "./scatter";
import AnalysisFilter from "../components/analysis-filter";
import {
  PREDEFINED_ANALYSES,
  METRICS_CONFIG,
  type AnalysisKey,
  type MetricKey,
} from "../../../../../config/metrics-config";
import { useComparisonFilters } from "../hooks";
import { useMetricLabel, useMetricThreshold, useMetricSens } from "../../../../../utils/metrics";
import { BudgetWarning } from "../../../../../components/budget-warning";
import PositioningColumnRange from "./column-range";

export type ChartView =
  | "comparison"
  | "column-range"
  | "scatter-1"
  | "scatter-2"
  | "scatter-3";

const filterDisplayMetrics = (metrics: readonly string[]) =>
  metrics.filter(
    (m) => !m.includes("_ipc") && m !== "effectif_sans_cpge_veto"
  ) as MetricKey[];

interface PositioningChartsProps {
  activeChart: ChartView;
  onChartChange?: (chart: ChartView) => void;
  data: any[];
  allData?: any[];
  currentStructure?: any;
  selectedYear?: string | number;
  selectedAnalysis: AnalysisKey | null;
  onSelectAnalysis?: (analysis: string | null) => void;
  activeFilters?: {
    type?: string;
    typologie?: string;
    region?: string;
    rce?: string;
    devimmo?: string;
  };
}

export default function PositioningCharts({
  activeChart,
  onChartChange,
  data,
  allData = [],
  currentStructure,
  selectedYear,
  selectedAnalysis,
  onSelectAnalysis,
  activeFilters = {},
}: PositioningChartsProps) {
  const [selectedMetricIndex, setSelectedMetricIndex] = useState(0);
  const [showPart, setShowPart] = useState(false);

  const structureName =
    currentStructure?.etablissement_actuel_lib ||
    currentStructure?.etablissement_lib ||
    "l'établissement";

  const structureId = currentStructure?.etablissement_id_paysage_actuel;

  const getMetricLabel = useMetricLabel();

  const { baseData, filterByCriteria, visibleCards } = useComparisonFilters(
    allData,
    currentStructure,
    structureId,
    activeFilters
  );

  const analysisConfig = selectedAnalysis
    ? PREDEFINED_ANALYSES[selectedAnalysis]
    : null;
  const isStacked = (analysisConfig as any)?.chartType === "stacked";

  const displayMetrics = analysisConfig
    ? filterDisplayMetrics(analysisConfig.metrics)
    : [];

  const selectedMetric = (() => {
    if (!analysisConfig) return "effectif_sans_cpge" as MetricKey;
    if (isStacked) {
      return (displayMetrics[selectedMetricIndex] ||
        displayMetrics[0]) as MetricKey;
    }
    return analysisConfig.metrics[0] as MetricKey;
  })();

  const selectedMetricConfig =
    METRICS_CONFIG[selectedMetric] || METRICS_CONFIG["effectif_sans_cpge"];
  const selectedMetricLabel = getMetricLabel(selectedMetric);
  const metricThreshold = useMetricThreshold(selectedMetric);
  const metricSens = useMetricSens(selectedMetric);

  const comparisonSegmentedControl = onChartChange ? (
    <SegmentedControl
      className="fr-segmented--sm fr-mb-3w"
      name="positioning-view-mode"
    >
      <SegmentedElement
        value="comparison"
        label="Comparaison"
        checked={activeChart === "comparison"}
        onClick={() => onChartChange("comparison")}
      />
      <SegmentedElement
        value="column-range"
        label="Variation entre deux années"
        checked={activeChart === "column-range"}
        onClick={() => onChartChange("column-range")}
      />
    </SegmentedControl>
  ) : null;

  if (activeChart === "column-range") {
    return (
      <div>
        {comparisonSegmentedControl}
        <Row gutters>
          <Col xs="12" md="4">
            <AnalysisFilter
              data={data}
              currentStructure={currentStructure}
              selectedAnalysis={selectedAnalysis || "ressources-total"}
              onSelectAnalysis={onSelectAnalysis || (() => { })}
            />
          </Col>
          <Col xs="12" md="8">
            <PositioningColumnRange
              metricKey={selectedMetric}
              currentStructureId={structureId}
              currentStructure={currentStructure}
              activeFilters={activeFilters}
            />
          </Col>
        </Row>
      </div>
    );
  }

  if (activeChart === "comparison") {
    return (
      <div>
        {comparisonSegmentedControl}
        <Row gutters>
          <Col xs="12" md="4">
            <AnalysisFilter
              data={data}
              currentStructure={currentStructure}
              selectedAnalysis={selectedAnalysis || "ressources-total"}
              onSelectAnalysis={onSelectAnalysis || (() => { })}
            />
          </Col>
          <Col xs="12" md="8">
            <BudgetWarning data={data} metrics={[selectedMetric]} />
            {isStacked && displayMetrics.length > 1 && (
              <Row gutters className="fr-mb-3w">
                <Col xs="12" md="6">
                  <div className="fr-select-group fr-mb-0">
                    <label className="fr-label" htmlFor="positionnement-metric">
                      Métrique
                    </label>
                    <select
                      className="fr-select"
                      id="positionnement-metric"
                      name="metric"
                      value={selectedMetricIndex}
                      onChange={(e) => setSelectedMetricIndex(Number(e.target.value))}
                    >
                      {displayMetrics.map((metric, index) => (
                        <option key={metric} value={index}>
                          {METRICS_CONFIG[metric as MetricKey]?.label || metric}
                        </option>
                      ))}
                    </select>
                  </div>
                </Col>
              </Row>
            )}
            <ComparisonOverviewChart
              config={{
                metric: selectedMetric,
                metricLabel: selectedMetricLabel,
                format: selectedMetricConfig.format,
                threshold: metricThreshold,
                sens: metricSens,
                metricConfig: { year: String(selectedYear) },
              }}
              allData={baseData}
              filterDataByCriteria={filterByCriteria}
              currentStructure={currentStructure}
              currentStructureId={structureId}
              showAll={visibleCards.all}
              showRegion={visibleCards.region}
              showType={visibleCards.type}
              showTypologie={visibleCards.typologie}
              showPart={showPart}
              onShowPartChange={setShowPart}
            />
            <ComparisonBarChart
              data={data}
              currentStructureId={structureId}
              currentStructureName={structureName}
              selectedYear={String(selectedYear)}
              selectedMetric={selectedMetric}
              showPart={showPart}
              onShowPartChange={setShowPart}
            />
          </Col>
        </Row>
      </div>
    );
  }

  if (activeChart.startsWith("scatter-")) {
    return (
      <ScatterChart
        chartType={activeChart as "scatter-1" | "scatter-2" | "scatter-3"}
        data={data}
        currentStructureId={structureId}
        currentStructureName={structureName}
        selectedYear={selectedYear}
      />
    );
  }

  return null;
}
