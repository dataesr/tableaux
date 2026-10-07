import { Row, Col } from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import MetricDefinitionsTable from "../../../../../../components/metric-definitions/metric-definitions-table";
import { BudgetWarning } from "../../../../../../components/budget-warning";
import { createBase100ChartOptions } from "./options";
import { METRICS_CONFIG } from "../../../../../../config/metrics-config";
import type { MetricKey } from "../../../../../../config/metrics-config";

interface Base100EvolutionChartProps {
  etablissementId: string;
  selectedMetrics: MetricKey[];
  baseMetrics: MetricKey[];
  comparisonConfig: any;
  createChartConfig: (chartId: string, titleOverride?: string) => any;
  getMetricLabel: (metricKey: MetricKey) => string;
  xAxisField: "exercice" | "exercice_fin" | "anuniv";
  data: any[];
}

// Helper pour nettoyer les labels des mentions de prix courant/constant
// En gros on a jamais de _ipc en base 100, donc on peut retirer ces mentions
const cleanPriceLabel = (label: string): string => {
  return label
    .replace(/\s*\(à\sprix\scourants?\)/gi, "")
    .replace(/\s*\(à\sprix\sconstants?\)/gi, "")
    .replace(/\s*à\sprix\scourants?/gi, "")
    .replace(/\s*à\sprix\sconstants?/gi, "")
    .trim();
};

export default function Base100EvolutionChart({
  selectedMetrics,
  baseMetrics,
  comparisonConfig,
  createChartConfig,
  getMetricLabel,
  xAxisField,
  data,
}: Base100EvolutionChartProps) {
  const chartOptionsBase100 = createBase100ChartOptions(
    data || [],
    selectedMetrics,
    METRICS_CONFIG,
    xAxisField
  );

  return (
    <>
      {chartOptionsBase100 && (
        <ChartWrapper
          config={comparisonConfig}
          options={chartOptionsBase100}
        />
      )}

      <div className="fr-mt-3w">
        {selectedMetrics.length === 3 ? (
          <>
            <Row gutters>
              {selectedMetrics.slice(0, 2).map((metricKey, index) => (
                <Col key={metricKey} md="6" xs="12">
                  <ChartWrapper
                    config={createChartConfig(
                      `evolution-metric${index + 1}`,
                      cleanPriceLabel(getMetricLabel(metricKey))
                    )}
                    options={createBase100ChartOptions(
                      data,
                      [metricKey],
                      METRICS_CONFIG,
                      xAxisField
                    )}
                  />
                </Col>
              ))}
            </Row>
            <Row gutters className="fr-mt-3w">
              <Col md="6" xs="12">
                <ChartWrapper
                  config={createChartConfig(
                    `evolution-metric3`,
                    cleanPriceLabel(getMetricLabel(selectedMetrics[2]))
                  )}
                  options={createBase100ChartOptions(
                    data,
                    [selectedMetrics[2]],
                    METRICS_CONFIG,
                    xAxisField
                  )}
                />
              </Col>
            </Row>
          </>
        ) : (
          <Row gutters>
            {selectedMetrics.map((metricKey, index) => (
              <Col key={metricKey} md="6" xs="12">
                <ChartWrapper
                  config={createChartConfig(
                    `evolution-metric${index + 1}`,
                    cleanPriceLabel(getMetricLabel(metricKey))
                  )}
                  options={createBase100ChartOptions(
                    data,
                    [metricKey],
                    METRICS_CONFIG,
                    xAxisField
                  )}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
      <BudgetWarning data={data} metrics={baseMetrics} />
      <MetricDefinitionsTable metricKeys={selectedMetrics} />
    </>
  );
}
