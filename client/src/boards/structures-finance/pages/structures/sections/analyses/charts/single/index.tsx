import {
  Row,
  Col,
  SegmentedControl,
  SegmentedElement,
} from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import MetricDefinitionsTable from "../../../../../../components/metric-definitions/metric-definitions-table";
import { BudgetWarning } from "../../../../../../components/budget-warning";
import RessourcesPropresEvolutionChart from "../../../resources/charts/ressources-propres-evolution";
import RessourcesPropresDecompositionChart from "../../../resources/charts/ressources-propres-decomposition";
import RessourcesFormationDecompositionChart from "../../../resources/charts/ressources-formation-decomposition";
import RessourcesRechercheDecompositionChart from "../../../resources/charts/ressources-recherche-decomposition";
import RessourcesAutresDecompositionChart from "../../../resources/charts/ressources-autres-decomposition";
import {
  ThresholdLegend,
  type ThresholdConfig,
} from "../../../../../../components/threshold/threshold-legend";
import { createSingleChartOptions } from "./options";
import {
  METRICS_CONFIG,
  METRIC_TO_PART,
} from "../../../../../../config/metrics-config";
import type {
  MetricKey,
  AnalysisKey,
} from "../../../../../../config/metrics-config";
import type { InstitutionSeries } from "..";

interface SingleEvolutionChartProps {
  etablissementId: string;
  selectedMetric: MetricKey;
  baseMetrics: MetricKey[];
  chartConfig: any;
  metricThreshold: ThresholdConfig | null;
  selectedAnalysis: AnalysisKey;
  etablissementName: string;
  xAxisField: "exercice" | "exercice_fin" | "anuniv";
  showIPC: boolean;
  showPart: boolean;
  onIPCChange: (show: boolean) => void;
  onPartChange: (show: boolean) => void;
  seriesGroups: InstitutionSeries[];
}

export default function SingleEvolutionChart({
  etablissementId,
  selectedMetric,
  baseMetrics,
  chartConfig,
  metricThreshold,
  selectedAnalysis,
  etablissementName,
  xAxisField,
  showIPC,
  showPart,
  onIPCChange,
  onPartChange,
  seriesGroups,
}: SingleEvolutionChartProps) {
  const data = seriesGroups.find(s => s.isCurrent)?.records ?? seriesGroups[0]?.records ?? [];
  const hasIPCMetrics = baseMetrics.some((m) => m.endsWith("_ipc"));

  const partMetricKey = (() => {
    if (baseMetrics.length !== 1) return null;
    const partKey = METRIC_TO_PART[baseMetrics[0]];
    if (!partKey) return null;
    return data?.some(
      (item: any) => item[partKey] != null && item[partKey] !== 0
    )
      ? partKey
      : null;
  })();

  const chartOptions = createSingleChartOptions(
    seriesGroups,
    selectedMetric,
    METRICS_CONFIG,
    metricThreshold,
    xAxisField
  );

  if (!data || data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info" role="status">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <>
      {(hasIPCMetrics || partMetricKey) && (
        <Row gutters className="fr-mb-2w">
          {hasIPCMetrics && (
            <Col xs="12" md="6">
              <SegmentedControl
                className="fr-segmented--sm fr-segmented--no-legend"
                label="Type de prix"
                name="evolution-ipc-mode"
              >
                <SegmentedElement
                  checked={!showIPC}
                  label="À prix courant"
                  onClick={() => onIPCChange(false)}
                  value="nominal"
                />
                <SegmentedElement
                  checked={showIPC}
                  label="À prix constant"
                  onClick={() => onIPCChange(true)}
                  value="constant"
                />
              </SegmentedControl>
            </Col>
          )}
          {partMetricKey && (
            <Col xs="12" md="6">
              <SegmentedControl
                className="fr-segmented--sm fr-segmented--no-legend"
                label="Affichage"
                name="evolution-part-mode"
              >
                <SegmentedElement
                  checked={!showPart}
                  label="Valeur"
                  onClick={() => onPartChange(false)}
                  value="value"
                />
                <SegmentedElement
                  checked={showPart}
                  label="%"
                  onClick={() => onPartChange(true)}
                  value="part"
                />
              </SegmentedControl>
            </Col>
          )}
        </Row>
      )}
      <ChartWrapper
        config={chartConfig}
        options={chartOptions}
        legend={<ThresholdLegend threshold={metricThreshold} />}
      />

      {selectedAnalysis === "ressources-propres" && (
        <div className="fr-mt-3w">
          <RessourcesPropresDecompositionChart
            etablissementId={etablissementId}
            etablissementName={etablissementName}
          />
        </div>
      )}
      {selectedAnalysis === "ressources-propres" && (
        <div className="fr-mt-3w">
          <RessourcesPropresEvolutionChart
            etablissementId={etablissementId}
            etablissementName={etablissementName}
          />
        </div>
      )}

      {selectedAnalysis === "ressources-formation" && (
        <div className="fr-mt-3w">
          <RessourcesFormationDecompositionChart
            etablissementId={etablissementId}
            etablissementName={etablissementName}
          />
        </div>
      )}

      {selectedAnalysis === "ressources-recherche" && (
        <div className="fr-mt-3w">
          <RessourcesRechercheDecompositionChart
            etablissementId={etablissementId}
            etablissementName={etablissementName}
          />
        </div>
      )}

      {selectedAnalysis === "ressources-autres-recettes" && (
        <div className="fr-mt-3w">
          <RessourcesAutresDecompositionChart
            etablissementId={etablissementId}
            etablissementName={etablissementName}
          />
        </div>
      )}

      <BudgetWarning data={data} metrics={baseMetrics} />
      <MetricDefinitionsTable metricKeys={[selectedMetric]} />
    </>
  );
}
