import { useMemo, useState } from "react";
import {
  Row,
  Col,
  SegmentedControl,
  SegmentedElement,
} from "@dataesr/dsfr-plus";
import { createPositioningComparisonBarOptions } from "./options";
import { RenderData } from "./render-data";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { useMetricThreshold, useMetricSens, useMetricLabel } from "../../../../../../utils/metrics";
import {
  METRICS_CONFIG,
  METRIC_TO_PART,
  type MetricKey,
} from "../../../../../../config/metrics-config";
import { ThresholdLegend } from "../../../../../../components/threshold/threshold-legend";
import MetricDefinitionsTable from "../../../../../../components/metric-definitions/metric-definitions-table";
import { BUDGET_SENSITIVE_METRICS } from "../../../../../../components/budget-warning";

interface ComparisonBarChartProps {
  data?: any[];
  currentStructureId?: string;
  currentStructureName?: string;
  selectedYear?: string;
  selectedMetric?: MetricKey;
  showPart?: boolean;
  onShowPartChange?: (value: boolean) => void;
}

export default function ComparisonBarChart({
  data = [],
  currentStructureId,
  currentStructureName = "",
  selectedYear = "",
  selectedMetric: baseMetric = "effectif_sans_cpge" as MetricKey,
  showPart: externalShowPart,
  onShowPartChange: externalOnShowPartChange,
}: ComparisonBarChartProps) {
  const [localShowPart, setLocalShowPart] = useState(false);

  const showPart =
    externalShowPart !== undefined ? externalShowPart : localShowPart;
  const onShowPartChange = externalOnShowPartChange || setLocalShowPart;
  const getMetricLabel = useMetricLabel();

  const partMetric = METRIC_TO_PART[baseMetric];
  const hasPartVersion = (() => {
    if (!partMetric || !METRICS_CONFIG[partMetric] || !data?.length)
      return false;
    return data.some((item: any) => {
      const value = item[partMetric];
      return value != null && value !== 0;
    });
  })();

  const selectedMetric: MetricKey =
    showPart && hasPartVersion && partMetric ? partMetric : baseMetric;

  const metricSens = useMetricSens(selectedMetric);
  const metricThreshold = useMetricThreshold(selectedMetric);
  const metricLabel = getMetricLabel(selectedMetric);
  const selectedMetricConfig =
    METRICS_CONFIG[selectedMetric] || METRICS_CONFIG["effectif_sans_cpge"];

  const currentStructureHasData = (() => {
    if (!data?.length || !currentStructureId) return false;
    const currentStructureData = data.find(
      (item) => item.etablissement_id_paysage_actuel === currentStructureId
    );
    if (!currentStructureData) return false;
    const value = currentStructureData[selectedMetric];
    return value != null && value !== 0;
  })();

  const filteredData = useMemo(() => {
    if (!data?.length) return data;
    return data.filter((item) => {
      const value = item[selectedMetric];
      return value != null && !isNaN(value) && value !== 0;
    });
  }, [data, selectedMetric]);

  const chartOptions = useMemo(() => {
    if (!filteredData?.length) return null;

    return createPositioningComparisonBarOptions(
      {
        metric: selectedMetric,
        metricLabel,
        metricConfig: selectedMetricConfig,
        threshold: metricThreshold,
        sens: metricSens,
      },
      filteredData,
      currentStructureId,
      currentStructureName
    );
  }, [
    filteredData,
    selectedMetric,
    metricLabel,
    selectedMetricConfig,
    metricThreshold,
    metricSens,
    currentStructureId,
    currentStructureName,
  ]);

  const chartKey = (() => {
    if (!filteredData || !Array.isArray(filteredData))
      return `comparison-${currentStructureId}`;
    const dataIds = filteredData
      .map((d) => d?.etablissement_id_paysage_actuel)
      .sort()
      .join(",");
    return `comparison-${currentStructureId}-${dataIds}`;
  })();

  const isBudgetYear = (() => {
    if (!BUDGET_SENSITIVE_METRICS.has(selectedMetric)) return false;
    if (!data?.length || !currentStructureId) return false;
    const currentItem = data.find(
      (item) => item.etablissement_id_paysage_actuel === currentStructureId
    );
    return currentItem?.sanfin_source === "Budget";
  })();

  const formattedYear =
    selectedYear && isBudgetYear ? `${selectedYear} (Budget)` : selectedYear;

  const chartConfig = {
    id: "positioning-comparison-bar",
    title: `${metricLabel}${formattedYear ? ` — Exercice ${formattedYear}` : ""}${currentStructureName ? ` — ${currentStructureName}` : ""}`,
  };

  return (
    <div>
      {currentStructureHasData && hasPartVersion && (
        <Row gutters className="fr-mb-3w">
          <Col xs="12" md="6">
            <SegmentedControl
              className="fr-segmented--sm"
              label="Affichage"
              name="positioning-part-mode"
            >
              <SegmentedElement
                checked={!showPart}
                label="Valeur"
                onClick={() => onShowPartChange(false)}
                value="value"
              />
              <SegmentedElement
                checked={showPart}
                label="%"
                onClick={() => onShowPartChange(true)}
                value="part"
              />
            </SegmentedControl>
          </Col>
        </Row>
      )}

      {!chartOptions || !filteredData?.length || !currentStructureHasData ? (
        <div className="fr-alert fr-alert--warning" role="alert">
          <p className="fr-alert__title">Aucune donnée disponible</p>
          <p>
            Aucune donnée disponible pour{" "}
            {currentStructureName || "l'établissement"}
            {selectedYear ? ` en ${selectedYear}` : ""}.
          </p>
        </div>
      ) : (
        <>
          <ChartWrapper
            key={chartKey}
            config={chartConfig}
            options={chartOptions}
            legend={<ThresholdLegend threshold={metricThreshold} />}
            renderData={() => (
              <RenderData
                data={filteredData}
                metric={selectedMetric}
                metricLabel={metricLabel}
                metricConfig={selectedMetricConfig}
                metricSens={metricSens}
                currentStructureId={currentStructureId}
                currentStructureName={currentStructureName}
              />
            )}
          />
        </>
      )}

      <MetricDefinitionsTable metricKeys={[baseMetric]} />
    </div>
  );
}
