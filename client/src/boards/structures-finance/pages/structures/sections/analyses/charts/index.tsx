import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useFinanceEtablissementEvolution } from "../../../../../api";
import StructureColumnRangeChart from "./column-range";
import { useMetricLabel, useMetricThreshold } from "../../../../../utils/metrics";
import StackedEvolutionChart from "./stacked";
import SingleEvolutionChart from "./single";
import DualEvolutionChart from "./dual";
import Base100EvolutionChart from "./base100";
import SyntheseSanteFinanciere from "./synthese-sante-financiere";
import {
  METRICS_CONFIG,
  PREDEFINED_ANALYSES,
  METRIC_TO_PART,
  type MetricKey,
  type AnalysisKey,
} from "../../../../../config/metrics-config";
export type InstitutionSeries = { id: string; label: string; isCurrent: boolean; records: any[] };

function buildInstitutionSeries(rawData: any[], currentId: string): InstitutionSeries[] {
  const groups = new Map<string, InstitutionSeries>();
  for (const item of rawData) {
    const id = String(item.etablissement_id_paysage || "").trim();
    if (!id) continue;
    if (!groups.has(id))
      groups.set(id, { id, label: item.etablissement_lib || id, isCurrent: id === currentId, records: [] });
    groups.get(id)!.records.push(item);
  }
  for (const group of groups.values()) {
    const byYear = new Map<string, any>();
    for (const item of group.records)
      byYear.set(String(item.exercice ?? item.anuniv ?? ""), item);
    group.records = Array.from(byYear.values())
      .sort((a, b) => Number(a.exercice ?? a.anuniv) - Number(b.exercice ?? b.anuniv))
      .map(r => ({ ...r, exercice_fin: r.sanfin_source === "Budget" ? `${r.exercice} (budget)` : String(r.exercice) }));
  }
  const result = Array.from(groups.values())
    .sort((a, b) => Number(a.isCurrent) - Number(b.isCurrent) || a.label.localeCompare(b.label));
  const current = result.find(g => g.isCurrent);
  if (current) {
    const conflicts = result.filter(g => !g.isCurrent && g.label === current.label);
    if (conflicts.length > 0) {
      current.label += " (nouveau)";
      for (const g of conflicts) g.label += " (ancien)";
    }
  }
  return result;
}

interface EvolutionChartProps {
  etablissementId?: string;
  etablissementName?: string;
  selectedAnalysis?: AnalysisKey;
  periodText?: string;
}

export default function EvolutionChart({
  etablissementId = "",
  etablissementName,
  selectedAnalysis = "" as AnalysisKey,
  periodText = "",
}: EvolutionChartProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [displayMode, setDisplayMode] = useState<"values" | "percentage">(
    "values"
  );
  const [showIPC, setShowIPC] = useState(false);
  const [showPart, setShowPart] = useState(false);
  const [viewMode, setViewMode] = useState<"evolution" | "variation">(
    "evolution"
  );

  const activeEtablissementId =
    etablissementId || searchParams.get("structureId") || "";
  const activeSelectedAnalysis =
    selectedAnalysis || (searchParams.get("analysis") as AnalysisKey);

  const displayModeParam = searchParams.get("analysisDisplay");
  const priceModeParam = searchParams.get("analysisPrice");
  const valueModeParam = searchParams.get("analysisValue");

  const syncParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const handleDisplayModeChange = (mode: "values" | "percentage") => {
    setDisplayMode(mode);
    syncParam("analysisDisplay", mode);
  };

  const handleIPCChange = (show: boolean) => {
    setShowIPC(show);
    syncParam("analysisPrice", show ? "constant" : "current");
  };

  const handlePartChange = (show: boolean) => {
    setShowPart(show);
    syncParam("analysisValue", show ? "part" : "value");
  };

  useEffect(() => {
    setDisplayMode(displayModeParam === "percentage" ? "percentage" : "values");
    setShowIPC(priceModeParam === "constant");
    setShowPart(valueModeParam === "part");
  }, [displayModeParam, priceModeParam, valueModeParam]);

  const { data: rawData } = useFinanceEtablissementEvolution(
    activeEtablissementId
  );

  const institutionSeries = useMemo((): InstitutionSeries[] => {
    if (!rawData) return [];
    return buildInstitutionSeries(rawData, String(activeEtablissementId || "").trim());
  }, [rawData, activeEtablissementId]);

  const data = useMemo(() => {
    const current = institutionSeries.find(s => s.isCurrent) ?? institutionSeries[institutionSeries.length - 1];
    return current?.records ?? [];
  }, [institutionSeries]);

  const getMetricLabel = useMetricLabel();

  const etabName = etablissementName || data?.[0]?.etablissement_actuel_lib || data?.[0]?.etablissement_lib || "";
  const analysisConfig = PREDEFINED_ANALYSES[activeSelectedAnalysis];
  const baseMetrics = [...analysisConfig.metrics] as MetricKey[];
  const primaryMetric = baseMetrics.find((m) => !m.endsWith("_ipc"));
  const metricThreshold = useMetricThreshold(primaryMetric);
  const isStacked = (analysisConfig as any).chartType === "stacked";
  const isSynthese = (analysisConfig as any).chartType === "synthese";
  const isBase100 = analysisConfig.showBase100;
  const isFormationsCategory =
    analysisConfig.category === "Dîplomes et formations";
  const useAcademicYear = activeSelectedAnalysis === "scsp-etudiant";
  const xAxisField =
    useAcademicYear || isFormationsCategory ? "anuniv" : "exercice_fin";

  const selectedMetrics = useMemo(() => {
    const hasIPC = baseMetrics.some(m => m.endsWith("_ipc"));
    const metrics = (isBase100 || (hasIPC && !showIPC))
      ? baseMetrics.filter(m => !m.endsWith("_ipc"))
      : baseMetrics;

    if (showPart && metrics.length === 1) {
      const partKey = METRIC_TO_PART[metrics[0]];
      if (partKey && METRICS_CONFIG[partKey] && data?.some((item: any) => item[partKey] != null && item[partKey] !== 0))
        return [partKey];
    }
    return metrics;
  }, [baseMetrics, showIPC, showPart, data, isBase100]);

  const hasFusion = institutionSeries.some(s => !s.isCurrent);
  const hasNameClash = institutionSeries.some(s => s.label.endsWith(" (nouveau)"));
  const fusionNote = hasFusion
    ? hasNameClash
      ? <> Cet établissement est issu d'une fusion : <strong>(nouveau)</strong> désigne l'établissement actuel, <strong>(ancien)</strong> ses prédécesseurs.</>
      : <> Cet établissement est issu d'une fusion. Les données des établissements prédécesseurs sont représentées séparément.</>
    : null;

  const createChartConfig = (
    chartId: string,
    titleOverride?: string,
    commentOverride?: React.JSX.Element
  ) => ({
    id: chartId,
    integrationURL: `/integration?chart_id=${chartId}&structureId=${activeEtablissementId}&analysis=${activeSelectedAnalysis}`,
    title:
      titleOverride ||
      `${getMetricLabel(baseMetrics[0])}${etabName ? ` — ${etabName}` : ""}`,
    comment: (commentOverride || fusionNote) ? { fr: <>{commentOverride}{fusionNote}</> } : undefined,
  });

  if (institutionSeries.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  if (isSynthese) {
    return (
      <SyntheseSanteFinanciere
        etablissementId={activeEtablissementId}
        etablissementName={etabName}
      />
    );
  }

  if (isStacked) {
    return (
      <StackedEvolutionChart
        selectedMetrics={selectedMetrics}
        baseMetrics={baseMetrics}
        chartConfig={createChartConfig(
          "evolution-stacked",
          undefined,
          <>
            Évolution des effectifs par{" "}
            {analysisConfig.label.toLowerCase().replace("effectifs par ", "")}
          </>
        )}
        displayMode={displayMode}
        onDisplayModeChange={handleDisplayModeChange}
        xAxisField={xAxisField}
        seriesGroups={institutionSeries}
      />
    );
  }

  if (selectedMetrics.length === 1) {
    return (
      <>
        <SegmentedControl
          className="fr-segmented--sm fr-mb-3w"
          name="analysis-view-mode"
        >
          <SegmentedElement
            checked={viewMode === "evolution"}
            label="Évolution"
            onClick={() => setViewMode("evolution")}
            value="evolution"
          />
          <SegmentedElement
            checked={viewMode === "variation"}
            label="Variation"
            onClick={() => setViewMode("variation")}
            value="variation"
          />
        </SegmentedControl>
        {viewMode === "variation" ? (
          <StructureColumnRangeChart
            data={data}
            metricKey={selectedMetrics[0]}
            etablissementName={etabName}
          />
        ) : (
          <SingleEvolutionChart
            etablissementId={activeEtablissementId}
            selectedMetric={selectedMetrics[0]}
            baseMetrics={baseMetrics}
            chartConfig={createChartConfig(
              "evolution-single",
              undefined,
              periodText ? <>Évolution de {getMetricLabel(selectedMetrics[0]).toLowerCase()} sur la période {periodText}.</> : undefined
            )}
            metricThreshold={metricThreshold}
            selectedAnalysis={activeSelectedAnalysis}
            etablissementName={etabName}
            xAxisField={xAxisField}
            showIPC={showIPC}
            showPart={showPart}
            onIPCChange={handleIPCChange}
            onPartChange={handlePartChange}
            seriesGroups={institutionSeries}
          />
        )}
      </>
    );
  }

  if (selectedMetrics.length === 2 && !analysisConfig.showBase100) {
    return (
      <DualEvolutionChart
        metric1={selectedMetrics[0]}
        metric2={selectedMetrics[1]}
        baseMetrics={baseMetrics}
        chartConfig={createChartConfig(
          "evolution-dual",
          undefined,
          periodText ? <>Évolution de {getMetricLabel(selectedMetrics[0]).toLowerCase()} et {getMetricLabel(selectedMetrics[1]).toLowerCase()} sur la période {periodText}.</> : undefined
        )}
        xAxisField={xAxisField}
        showIPC={showIPC}
        onIPCChange={handleIPCChange}
        seriesGroups={institutionSeries}
      />
    );
  }

  if (selectedMetrics.length >= 2 && analysisConfig.showBase100) {
    return (
      <Base100EvolutionChart
        etablissementId={activeEtablissementId}
        selectedMetrics={selectedMetrics}
        baseMetrics={baseMetrics}
        comparisonConfig={createChartConfig(
          "evolution-comparison",
          undefined,
          periodText ? <>Comparaison en base 100 sur la période {periodText}.</> : undefined
        )}
        createChartConfig={createChartConfig}
        getMetricLabel={getMetricLabel}
        xAxisField={xAxisField}
        data={data}
      />
    );
  }

  return null;
}
