import { useMemo, useState } from "react";
import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import {
  Text,
  Row,
  Col,
  SegmentedControl,
  SegmentedElement,
} from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../components/chart-wrapper/index.tsx";
import { createComparisonBarOptions } from "./options.tsx";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import MetricDefinitionsTable from "../../../../../components/metric-definitions/metric-definitions-table.tsx";
import { useMetricLabel, useMetricThreshold } from "../../../../../utils/metrics";
import ColumnRangeChart from "./column-range/index.tsx";
import {
  PREDEFINED_ANALYSES,
  METRICS_CONFIG,
  METRIC_TO_PART,
  type AnalysisKey,
  type MetricKey,
} from "../../../../../config/metrics-config.ts";
import { RenderData } from "./render-data.tsx";
import { ThresholdLegend } from "../../../../../components/threshold/threshold-legend.tsx";
import { BudgetWarning } from "../../../../../components/budget-warning";
import { SanteFinanciereTable } from "./national-synthese-sante-financiere";

interface NationalChartProps {
  data: any[];
  allYearsData: any[];
  selectedAnalysis: AnalysisKey;
  selectedYear: string;
  availableYears: number[];
  onYearChange: (year: string) => void;
  isLoading: boolean;
}

export default function NationalChart({
  data,
  allYearsData,
  selectedAnalysis,
  selectedYear,
  availableYears,
  onYearChange,
  isLoading,
}: NationalChartProps) {
  const [topN, setTopN] = useState<number | null>(20);
  const [selectedMetricIndex, setSelectedMetricIndex] = useState(0);
  const [showPart, setShowPart] = useState(false);
  const [viewMode, setViewMode] = useState<"bar" | "columnrange">("bar");

  const getMetricLabel = useMetricLabel();

  const analysisConfig = PREDEFINED_ANALYSES[selectedAnalysis];
  const isStacked = (analysisConfig as any)?.chartType === "stacked";
  const isSanteFinanciere = analysisConfig?.category === "Santé financière";

  const activeMetricKey = useMemo(() => {
    if (!analysisConfig) return null;

    let baseMetric: MetricKey;

    if (isStacked) {
      const metrics = analysisConfig.metrics.filter(
        (metric) =>
          !metric.includes("_ipc") && metric !== "effectif_sans_cpge_veto"
      );
      baseMetric = (metrics[selectedMetricIndex] || metrics[0]) as MetricKey;
    } else {
      const nonIpcMetric = analysisConfig.metrics.find(
        (metric) => !metric.includes("_ipc")
      );
      baseMetric = nonIpcMetric as MetricKey;
    }

    if (showPart && baseMetric) {
      const partMetric = METRIC_TO_PART[baseMetric];
      if (partMetric && METRICS_CONFIG[partMetric]) {
        const hasPartData = data?.some((item: any) => {
          const value = item[partMetric];
          return value != null && value !== 0;
        });
        if (hasPartData) {
          return partMetric;
        }
      }
    }

    return baseMetric;
  }, [
    selectedAnalysis,
    analysisConfig,
    isStacked,
    selectedMetricIndex,
    showPart,
    data,
  ]);

  const metricThreshold = useMetricThreshold(activeMetricKey);

  const metricConfig = activeMetricKey
    ? METRICS_CONFIG[activeMetricKey as MetricKey]
    : null;

  const hasPartVersion = (() => {
    if (!analysisConfig || !data || data.length === 0) return false;

    let baseMetric: MetricKey;
    if (isStacked) {
      const metrics = analysisConfig.metrics.filter(
        (metric) =>
          !metric.includes("_ipc") && metric !== "effectif_sans_cpge_veto"
      );
      baseMetric = (metrics[selectedMetricIndex] || metrics[0]) as MetricKey;
    } else {
      const nonIpcMetric = analysisConfig.metrics.find(
        (metric) => !metric.includes("_ipc")
      );
      baseMetric = nonIpcMetric as MetricKey;
    }

    const partMetric = METRIC_TO_PART[baseMetric];

    if (!partMetric || !METRICS_CONFIG[partMetric]) return false;

    return data.some((item: any) => {
      const value = item[partMetric];
      return value != null && value !== 0;
    });
  })();

  const chartOptions: Highcharts.Options | null = useMemo(() => {
    if (!data || !data.length || !activeMetricKey || !metricConfig) return null;

    return createComparisonBarOptions(
      {
        metric: activeMetricKey,
        metricLabel: getMetricLabel(activeMetricKey),
        metricConfig,
        topN: topN ?? data.length,
        threshold: metricThreshold,
      },
      data
    );
  }, [
    data,
    activeMetricKey,
    metricConfig,
    topN,
    metricThreshold,
    getMetricLabel,
  ]);

  const TOP_N_OPTIONS: (number | null)[] = [10, 20, 30, 50, 100, null];

  const getTopNLabel = (n: number | null) =>
    n === null ? "Tous les établissements" : `${n} établissements`;

  const config = {
    id: "national-comparison",
    title: `${activeMetricKey ? getMetricLabel(activeMetricKey) : analysisConfig.label} (${selectedYear})`,
  };

  return (
    <div>
      <Row gutters className="fr-mb-3w">
        <Col xs="12">
          <Text className="fr-text--sm fr-text--bold fr-mb-1w">
            Mode de représentation
          </Text>
          <SegmentedControl className="fr-segmented--sm" name="view-mode">
            <SegmentedElement
              checked={viewMode === "bar"}
              label="Classement"
              onClick={() => setViewMode("bar")}
              value="bar"
            />
            <SegmentedElement
              checked={viewMode === "columnrange"}
              label="Variation entre deux années"
              onClick={() => setViewMode("columnrange")}
              value="columnrange"
            />
          </SegmentedControl>
        </Col>
      </Row>
      {viewMode === "columnrange" && activeMetricKey && (
        <ColumnRangeChart
          allYearsData={allYearsData}
          metricKey={activeMetricKey}
          availableYears={availableYears}
          isLoading={isLoading}
        />
      )}
      {viewMode === "bar" && (
        <>
          <Row gutters className="fr-mb-3w">
            <Col xs="12" md="4">
              <div className="fr-select-group fr-mb-0">
                <label className="fr-label" htmlFor="national-year">
                  Année
                </label>
                <select
                  className="fr-select"
                  id="national-year"
                  name="national-year"
                  value={selectedYear}
                  onChange={(e) => onYearChange(e.target.value)}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {hasPartVersion && (
                <Row gutters className="fr-mt-2w">
                  <Col xs="12" md="6">
                    <Text className="fr-text--sm fr-text--bold fr-mb-1w">
                      Affichage
                    </Text>
                    <SegmentedControl
                      className="fr-segmented--sm"
                      name="national-part-mode"
                    >
                      <SegmentedElement
                        checked={!showPart}
                        label="Valeur"
                        onClick={() => setShowPart(false)}
                        value="value"
                      />
                      <SegmentedElement
                        checked={showPart}
                        label="%"
                        onClick={() => setShowPart(true)}
                        value="part"
                      />
                    </SegmentedControl>
                  </Col>
                </Row>
              )}
            </Col>

            <Col xs="12" md="4" offsetMd="4">
              <div className="fr-select-group fr-mb-0">
                <label className="fr-label" htmlFor="national-top-n">
                  Nombre d'établissements
                </label>
                <select
                  className="fr-select"
                  id="national-top-n"
                  name="national-top-n"
                  value={String(topN)}
                  onChange={(e) =>
                    setTopN(e.target.value === "null" ? null : Number(e.target.value))
                  }
                >
                  {TOP_N_OPTIONS.map((n) => (
                    <option key={String(n)} value={String(n)}>
                      {getTopNLabel(n)}
                    </option>
                  ))}
                </select>
              </div>
            </Col>
          </Row>

          {isStacked && analysisConfig && (
            <Row gutters className="fr-mb-3w">
              <Col xs="12" md="6">
                <div className="fr-select-group fr-mb-0">
                  <label className="fr-label" htmlFor="national-metric">
                    Métrique
                  </label>
                  <select
                    className="fr-select"
                    id="national-metric"
                    name="national-metric"
                    value={selectedMetricIndex}
                    onChange={(e) => setSelectedMetricIndex(Number(e.target.value))}
                  >
                    {analysisConfig.metrics
                      .filter(
                        (metric) =>
                          !metric.includes("_ipc") &&
                          metric !== "effectif_sans_cpge_veto"
                      )
                      .map((metric, index) => (
                        <option key={metric} value={index}>
                          {METRICS_CONFIG[metric as MetricKey]?.label || metric}
                        </option>
                      ))}
                  </select>
                </div>
              </Col>
            </Row>
          )}

          {isLoading ? (
            <div className="fr-text--center fr-py-5w">
              <DefaultSkeleton />
            </div>
          ) : !chartOptions || !data || data.length === 0 ? (
            <div className="fr-alert fr-alert--warning">
              <p className="fr-alert__title">Aucune donnée disponible</p>
              <p>
                Aucun établissement ne dispose de données pour cette métrique
                avec les filtres sélectionnés.
              </p>
            </div>
          ) : (
            <>
              <ChartWrapper
                config={config}
                options={chartOptions}
                legend={<ThresholdLegend threshold={metricThreshold} />}
                renderData={() => (
                  <RenderData
                    data={data}
                    metric={activeMetricKey!}
                    metricLabel={
                      activeMetricKey ? getMetricLabel(activeMetricKey) : ""
                    }
                    metricConfig={metricConfig!}
                    topN={topN ?? data.length}
                  />
                )}
              />

              {isSanteFinanciere && activeMetricKey && (
                <div className="fr-mt-3w">
                  <SanteFinanciereTable
                    allYearsData={allYearsData}
                    indicatorKey={activeMetricKey}
                    indicatorLabel={
                      activeMetricKey ? getMetricLabel(activeMetricKey) : ""
                    }
                    availableYears={availableYears}
                    selectedYear={selectedYear}
                    formatter={
                      metricConfig?.format === "euro"
                        ? (v?: number) =>
                          v != null
                            ? (v / 1000000).toFixed(1) + " M\u20AC"
                            : "\u2014"
                        : metricConfig?.format === "percent"
                          ? (v?: number) =>
                            v != null ? v.toFixed(1) + " %" : "\u2014"
                          : metricConfig?.format === "decimal"
                            ? (v?: number) =>
                              v != null ? v.toFixed(2) : "\u2014"
                            : undefined
                    }
                  />
                </div>
              )}

              <BudgetWarning
                data={data}
                metrics={activeMetricKey ? [activeMetricKey] : []}
              />
              <MetricDefinitionsTable
                metricKeys={activeMetricKey ? [activeMetricKey] : []}
              />
            </>
          )}
        </>
      )}{" "}
    </div>
  );
}
