import {
  Row,
  Col,
  SegmentedControl,
  SegmentedElement,
} from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import MetricDefinitionsTable from "../../../../../../components/metric-definitions/metric-definitions-table";
import { BudgetWarning } from "../../../../../../components/budget-warning";
import { RenderDataComparison } from "../render-data";
import { createDualChartOptions } from "./options";
import { METRICS_CONFIG } from "../../../../../../config/metrics-config";
import type { MetricKey } from "../../../../../../config/metrics-config";
import { InstitutionSeries } from "..";

interface DualEvolutionChartProps {
  metric1: MetricKey;
  metric2: MetricKey;
  baseMetrics: MetricKey[];
  chartConfig: any;
  xAxisField: "exercice" | "exercice_fin" | "anuniv";
  showIPC: boolean;
  onIPCChange: (show: boolean) => void;
  seriesGroups: InstitutionSeries[];
}

export default function DualEvolutionChart({
  metric1,
  metric2,
  baseMetrics,
  chartConfig,
  xAxisField,
  showIPC,
  onIPCChange,
  seriesGroups,
}: DualEvolutionChartProps) {
  const data = seriesGroups.flatMap(g => g.records);
  const hasIPCMetrics = baseMetrics.some((m) => m.endsWith("_ipc"));

  const chartOptions = createDualChartOptions(
    seriesGroups,
    metric1,
    metric2,
    METRICS_CONFIG,
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
      {hasIPCMetrics && (
        <Row gutters className="fr-mb-2w">
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
        </Row>
      )}
      <ChartWrapper
        config={chartConfig}
        options={chartOptions}
        renderData={() => (
          <RenderDataComparison
            data={data}
            metric1Key={metric1}
            metric1Config={METRICS_CONFIG[metric1]}
            metric2Key={metric2}
            metric2Config={METRICS_CONFIG[metric2]}
          />
        )}
      />
      <BudgetWarning data={data} metrics={baseMetrics} />
      <MetricDefinitionsTable metricKeys={[metric1, metric2]} />
    </>
  );
}
