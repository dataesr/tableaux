import { useMemo } from "react";
import {
  ItemFilterPanel,
  type FilterItem,
} from "../../../../../../../components/item-filter";
import {
  PREDEFINED_ANALYSES,
  type AnalysisKey,
} from "../../../../../config/metrics-config";

interface AnalysisFilterProps {
  data: any[];
  selectedAnalysis: AnalysisKey | null;
  onSelectAnalysis: (analysis: AnalysisKey) => void;
}

export default function AnalysisFilter({
  data,
  selectedAnalysis,
  onSelectAnalysis,
}: AnalysisFilterProps) {
  const items: FilterItem[] = Object.entries(PREDEFINED_ANALYSES)
    .filter(([_, analysis]) => {
      if (analysis.showBase100) return false;

      const hasNonIpcMetric = analysis.metrics.some(
        (metric) => !metric.includes("_ipc")
      );
      return hasNonIpcMetric;
    })
    .map(([key, analysis]) => ({
      key,
      label: analysis.label,
      category: analysis.category,
    }));

  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const item of items) {
      const analysis = PREDEFINED_ANALYSES[item.key as AnalysisKey];
      const hasData = analysis.metrics.some((metric) =>
        data.some((d) => d[metric] != null && d[metric] !== 0)
      );
      if (hasData) keys.add(item.key);
    }
    return keys;
  }, [items, data]);

  return (
    <ItemFilterPanel
      title="Analyses disponibles"
      items={items}
      availableKeys={availableKeys}
      selectedKey={selectedAnalysis}
      onSelect={(key) => onSelectAnalysis(key as AnalysisKey)}
    />
  );
}
