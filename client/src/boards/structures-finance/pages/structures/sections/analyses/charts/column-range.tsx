import { useState, useMemo } from "react";
import { Row, Col } from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import {
  createColumnRangeOptions,
  type ColumnRangePoint,
} from "../../../../../pages/national/sections/analyse/charts/column-range/options";
import { RenderDataVariation } from "../../../../../pages/national/sections/analyse/charts/column-range/render-data";
import {
  METRICS_CONFIG,
  type MetricKey,
} from "../../../../../config/metrics-config";
import { useMetricLabel } from "../../../../../utils/metrics";

interface Props {
  data: any[];
  metricKey: MetricKey;
  etablissementName: string;
}

export default function StructureColumnRangeChart({
  data,
  metricKey,
  etablissementName,
}: Props) {
  const getMetricLabel = useMetricLabel();
  const metricLabel = getMetricLabel(metricKey);
  const metricConfig = METRICS_CONFIG[metricKey];

  const sortedYears = useMemo(
    () =>
      [
        ...new Set<string>(
          data
            .map((d: any) => (d.exercice != null ? String(d.exercice) : null))
            .filter(Boolean) as string[]
        ),
      ].sort((a, b) => Number(a) - Number(b)),
    [data]
  );

  const [yearFrom, setYearFrom] = useState(() =>
    sortedYears.length >= 2 ? String(sortedYears[0]) : ""
  );
  const [yearTo, setYearTo] = useState(() =>
    sortedYears.length >= 1 ? String(sortedYears[sortedYears.length - 1]) : ""
  );

  const points = useMemo<ColumnRangePoint[]>(() => {
    const fromIdx = sortedYears.indexOf(yearFrom);
    const toIdx = sortedYears.indexOf(yearTo);
    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return [];

    const result: ColumnRangePoint[] = [];
    for (let i = fromIdx; i < toIdx; i++) {
      const y1 = sortedYears[i];
      const y2 = sortedYears[i + 1];
      const item1 = data.find((d: any) => String(d.exercice) === y1);
      const item2 = data.find((d: any) => String(d.exercice) === y2);
      if (!item1 || !item2) continue;
      const v1 = item1[metricKey];
      const v2 = item2[metricKey];
      if (v1 == null || v2 == null) continue;
      const variation = v2 - v1;
      const variationPct = v1 !== 0 ? (variation / Math.abs(v1)) * 100 : 0;
      const label1 = item1.sanfin_source === "Budget" ? `${y1} (budget)` : y1;
      const label2 = item2.sanfin_source === "Budget" ? `${y2} (budget)` : y2;
      result.push({
        name: `${label1} → ${label2}`,
        low: Math.min(v1, v2),
        high: Math.max(v1, v2),
        valueFrom: v1,
        valueTo: v2,
        variation,
        variationPct,
        fromLabel: label1,
        toLabel: label2,
      });
    }
    return result;
  }, [data, metricKey, yearFrom, yearTo, sortedYears]);

  const chartOptions = useMemo(() => {
    if (!points.length || !metricConfig) return null;
    return createColumnRangeOptions(
      {
        metric: metricKey,
        metricLabel,
        metricConfig,
        yearFrom,
        yearTo,
        topN: points.length,
      },
      points
    );
  }, [points, metricKey, metricLabel, metricConfig, yearFrom, yearTo]);

  const vFromTotal = data.find((d: any) => String(d.exercice) === yearFrom)?.[
    metricKey
  ];
  const vToTotal = data.find((d: any) => String(d.exercice) === yearTo)?.[
    metricKey
  ];
  const totalVariation =
    vFromTotal != null && vToTotal != null ? vToTotal - vFromTotal : null;
  const totalVariationPct =
    totalVariation != null && vFromTotal
      ? (totalVariation / Math.abs(vFromTotal)) * 100
      : null;

  const config = {
    id: "structure-variation",
    title: `${metricLabel} — Variation annuelle${etablissementName ? ` — ${etablissementName}` : ""}`,
    readingKey:
      points.length > 0
        ? {
          fr: (
            <>
              Ce graphique représente la variation annuelle de{" "}
              <strong>{metricLabel}</strong> entre {yearFrom} et {yearTo}
              {etablissementName ? ` pour ${etablissementName}` : ""}. Chaque
              barre horizontale indique l'augmentation ou la baisse
              {"suffix" in metricConfig && metricConfig.suffix
                ? ` (en ${metricConfig.suffix})`
                : ""}{" "}
              pour une année donnée. Plus la barre est longue, plus la
              variation est importante.
              {totalVariation != null && totalVariationPct != null && (
                <>
                  {" "}
                  Sur l'ensemble de la période, la variation totale est de{" "}
                  <strong
                    style={{
                      color:
                        totalVariation >= 0
                          ? "var(--text-default-success)"
                          : "var(--text-default-error)",
                    }}
                  >
                    {totalVariation >= 0 ? "+" : ""}
                    {totalVariation.toLocaleString("fr-FR", {
                      maximumFractionDigits: 0,
                    })}
                    {"suffix" in metricConfig && metricConfig.suffix
                      ? ` ${metricConfig.suffix}`
                      : ""}{" "}
                    ({totalVariation >= 0 ? "+" : ""}
                    {totalVariationPct.toFixed(1)} %)
                  </strong>
                  .
                </>
              )}
            </>
          ),
        }
        : undefined,
  };

  if (!sortedYears.length) return null;

  return (
    <div>
      <Row gutters className="fr-mb-3w">
        <Col xs="12" md="6">
          <div className="fr-select-group fr-mb-0">
            <label className="fr-label" htmlFor="analyses-year-from">
              Année de départ
            </label>
            <select
              className="fr-select"
              id="analyses-year-from"
              name="analyses-year-from"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
            >
              {sortedYears.map((year) => (
                <option key={String(year)} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </Col>
        <Col xs="12" md="6">
          <div className="fr-select-group fr-mb-0">
            <label className="fr-label" htmlFor="analyses-year-to">
              Année d'arrivée
            </label>
            <select
              className="fr-select"
              id="analyses-year-to"
              name="analyses-year-to"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
            >
              {sortedYears.map((year) => (
                <option key={String(year)} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </Col>
      </Row>

      <Row gutters className="fr-mb-2w">
        <Col xs="12">
          <div style={{ display: "flex", gap: "16px", fontSize: "0.875rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "var(--background-flat-success)",
                  borderRadius: 2,
                  display: "inline-block",
                }}
              />
              Hausse
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "var(--background-flat-error)",
                  borderRadius: 2,
                  display: "inline-block",
                }}
              />
              Baisse
            </span>
          </div>
        </Col>
      </Row>

      {chartOptions && points.length > 0 ? (
        <ChartWrapper
          config={config}
          options={chartOptions}
          renderData={() => (
            <RenderDataVariation
              points={points}
              metricLabel={metricLabel}
              metricConfig={metricConfig!}
              yearFrom={yearFrom}
              yearTo={yearTo}
            />
          )}
        />
      ) : (
        <div className="fr-alert fr-alert--warning">
          <p>Aucune donnée disponible pour la période sélectionnée.</p>
        </div>
      )}
    </div>
  );
}
