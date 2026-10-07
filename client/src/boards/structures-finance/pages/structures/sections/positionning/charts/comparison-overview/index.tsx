import { useMemo } from "react";
import {
  Row,
  Col,
  SegmentedControl,
  SegmentedElement,
} from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import {
  METRICS_CONFIG,
  METRIC_TO_PART,
  type MetricKey,
} from "../../../../../../config/metrics-config";
import { useMetricLabel, useMetricThreshold, useMetricSens } from "../../../../../../utils/metrics";
import {
  createComparisonOverviewOptions,
  type ComparisonOverviewConfig,
  type OverviewDataset,
} from "./options";
import { ThresholdLegend } from "../../../../../../components/threshold/threshold-legend";
import { sortByMetricSens } from "../../../../../../components/metric-sort";

interface ComparisonOverviewChartProps {
  config: ComparisonOverviewConfig;
  allData: any[];
  filterDataByCriteria: (criterion: "type" | "typologie" | "region") => any[];
  currentStructure?: any;
  currentStructureId?: string;
  showAll: boolean;
  showRegion: boolean;
  showType: boolean;
  showTypologie: boolean;
  showPart: boolean;
  onShowPartChange: (value: boolean) => void;
}

export default function ComparisonOverviewChart({
  config,
  allData,
  filterDataByCriteria,
  currentStructure,
  currentStructureId,
  showAll,
  showRegion,
  showType,
  showTypologie,
  showPart,
  onShowPartChange,
}: ComparisonOverviewChartProps) {
  const getMetricLabel = useMetricLabel();

  const partMetric = METRIC_TO_PART[config.metric as MetricKey];
  const hasPartVersion = (() => {
    if (!partMetric || !METRICS_CONFIG[partMetric] || !allData?.length)
      return false;
    return allData.some((item: any) => {
      const value = item[partMetric];
      return value != null && value !== 0;
    });
  })();

  const activeMetric: MetricKey =
    showPart && hasPartVersion && partMetric
      ? partMetric
      : (config.metric as MetricKey);
  const activeMetricConfig =
    METRICS_CONFIG[activeMetric] || METRICS_CONFIG["effectif_sans_cpge"];
  const activeMetricLabel = getMetricLabel(activeMetric);
  const activeMetricThreshold = useMetricThreshold(activeMetric);
  const activeMetricSens = useMetricSens(activeMetric);

  const metricThreshold = useMetricThreshold(activeMetric);

  const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);

  const getPositionText = (pct: number): string => {
    if (pct === 0) return "avec la valeur la plus basse";
    if (pct === 100) return "avec la valeur la plus haute";
    if (pct < 5) return "parmi les valeurs les plus basses";
    if (pct < 23) return "dans le 1er quartile";
    if (pct < 27) return "autour du 1er quartile";
    if (pct < 48) return "entre le 1er quartile et la médiane";
    if (pct < 52) return "autour de la médiane";
    if (pct < 73) return "entre la médiane et le 3ème quartile";
    if (pct < 77) return "autour du 3ème quartile";
    if (pct < 95) return "au-dessus du 3ème quartile";
    return "parmi les valeurs les plus hautes";
  };

  const activeConfig: ComparisonOverviewConfig = useMemo(
    () => ({
      ...config,
      metric: activeMetric,
      metricLabel: activeMetricLabel,
      format: activeMetricConfig.format,
      threshold: activeMetricThreshold,
      sens: activeMetricSens,
    }),
    [
      config,
      activeMetric,
      activeMetricLabel,
      activeMetricConfig,
      activeMetricThreshold,
      activeMetricSens,
    ]
  );
  const datasets = useMemo(() => {
    const ds: OverviewDataset[] = [];

    if (showAll) {
      ds.push({ data: allData, label: "Tous les établissements" });
    }
    if (showRegion) {
      const regionLabel =
        currentStructure?.etablissement_actuel_region ||
        currentStructure?.region ||
        "";
      ds.push({
        data: filterDataByCriteria("region"),
        label: `Même région (${regionLabel})`,
      });
    }
    if (showType) {
      const typeLabel =
        currentStructure?.etablissement_actuel_type ||
        currentStructure?.type ||
        "";
      ds.push({
        data: filterDataByCriteria("type"),
        label: `Même type (${typeLabel})`,
      });
    }
    if (showTypologie) {
      const typoLabel =
        currentStructure?.etablissement_actuel_typologie ||
        currentStructure?.typologie ||
        "";
      ds.push({
        data: filterDataByCriteria("typologie"),
        label: `Même typologie (${typoLabel})`,
      });
    }

    return ds;
  }, [
    allData,
    filterDataByCriteria,
    currentStructure,
    showAll,
    showRegion,
    showType,
    showTypologie,
  ]);

  const positionInfo = useMemo(() => {
    if (!datasets.length || !currentStructureId) return null;

    const seen = new Set<string>();
    const unique: { value: number; id: string }[] = [];

    datasets.forEach((dataset) => {
      dataset.data.forEach((item: any) => {
        const id = item.etablissement_id_paysage_actuel;
        const value = item[activeMetric];
        if (!id || seen.has(id) || value == null || isNaN(value)) return;
        seen.add(id);
        unique.push({ value, id });
      });
    });

    if (!unique.length) return null;

    const sorted = sortByMetricSens(unique, activeMetricSens ?? null);
    const rankIdx = sorted.findIndex((d) => d.id === currentStructureId);
    if (rankIdx === -1) return null;

    const rank = rankIdx + 1;
    const total = sorted.length;
    const isDecroissant = activeMetricSens !== "augmentation";
    const rawPct = total > 1 ? (rank - 1) / (total - 1) : 0.5;
    const pct = (isDecroissant ? 1 - rawPct : rawPct) * 100;

    return { rank, total, pct, isDecroissant };
  }, [datasets, currentStructureId, activeMetric, activeMetricSens]);

  const hasData = (() => {
    if (!datasets.length || !currentStructureId) return false;
    return datasets.some((ds) =>
      ds.data.some(
        (item) =>
          item.etablissement_id_paysage_actuel === currentStructureId &&
          item[activeMetric] != null &&
          item[activeMetric] !== 0
      )
    );
  })();

  const currentStructureName =
    currentStructure?.etablissement_actuel_lib ||
    currentStructure?.etablissement_lib ||
    undefined;

  const chartOptions = useMemo(
    () =>
      createComparisonOverviewOptions(
        activeConfig,
        datasets,
        currentStructureId,
        currentStructureName
      ),
    [activeConfig, datasets, currentStructureId, currentStructureName]
  );

  if (!hasData) return null;

  return (
    <div>
      {hasPartVersion && (
        <Row gutters className="fr-mb-3w">
          <Col xs="12" md="6">
            <SegmentedControl
              className="fr-segmented--sm"
              label="Affichage"
              name={`overview-part-mode-${config.metric}`}
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
      <ChartWrapper
        config={{
          id: `comparison-overview-${activeMetric}`,
          title: `${activeMetricLabel} - Positionnement de ${currentStructureName || "l'établissement"} pour l'année ${activeConfig.metricConfig.year}`,
          comment: {
            fr: (
              <p
                className="fr-text--xs fr-mb-0"
                style={{ color: "var(--text-mention-grey)" }}
              >
                La médiane est la valeur centrale qui partage une série de
                données en deux parties égales : 50 % des établissements ont des
                valeurs inférieures ou égales à cette valeur, et 50 % des
                valeurs supérieures ou égales. Le premier quartile correspond à
                la valeur en dessous de laquelle se situent 25 % des
                établissements, tandis que le dernier quartile est la valeur
                au-dessus de laquelle se trouvent les 25 % d'établissements
                ayant les valeurs les plus élevées. Ces trois indicateurs
                permettent de résumer la distribution des données en quatre
                groupes égaux.
              </p>
            ),
          },
          readingKey: positionInfo
            ? {
              fr: (
                <p
                  className="fr-text--xs fr-mb-0"
                  style={{ color: "var(--text-mention-grey)" }}
                >
                  Le losange vert indique la position de{" "}
                  <strong>{currentStructureName || "l'établissement"}</strong>{" "}
                  en <strong>{activeConfig.metricConfig.year}</strong> sur le
                  périmètre actuellement affiché (selon les filtres
                  sélectionnés). Pour l'indicateur{" "}
                  <strong>{activeMetricLabel}</strong>, cet établissement se
                  positionne au{" "}
                  <strong>{ordinal(positionInfo.rank)} rang</strong> sur{" "}
                  {positionInfo.total} (par ordre{" "}
                  {positionInfo.isDecroissant ? "décroissant" : "croissant"}),{" "}
                  <strong>{getPositionText(positionInfo.pct)}</strong>.
                </p>
              ),
            }
            : undefined,
        }}
        legend={<ThresholdLegend threshold={metricThreshold} />}
        options={chartOptions}
      />
    </div>
  );
}
