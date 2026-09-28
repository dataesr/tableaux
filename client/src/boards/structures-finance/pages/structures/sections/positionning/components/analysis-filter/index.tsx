import { useMemo } from "react";
import {
  ItemFilterPanel,
  type FilterItem,
} from "../../../../../../../../components/item-filter";
import {
  PREDEFINED_ANALYSES,
  type AnalysisKey,
} from "../../../../../../config/metrics-config";

interface AnalysisFilterProps {
  data: any[];
  currentStructure?: any;
  selectedAnalysis: AnalysisKey | null;
  onSelectAnalysis: (analysis: AnalysisKey) => void;
}

export default function AnalysisFilter({
  data,
  currentStructure,
  selectedAnalysis,
  onSelectAnalysis,
}: AnalysisFilterProps) {
  const items: FilterItem[] = Object.entries(PREDEFINED_ANALYSES)
    .filter(([, analysis]) => !analysis.showBase100)
    .map(([key, analysis]) => ({
      key,
      label: analysis.label,
      category: analysis.category,
    }));

  const availableKeys = useMemo(() => {
    const source = currentStructure ? [currentStructure] : data;
    if (!source || source.length === 0) return new Set<string>();

    const available = Object.keys(PREDEFINED_ANALYSES).filter((key) => {
      const analysis = PREDEFINED_ANALYSES[key as AnalysisKey];
      return analysis.metrics.some((metricKey) => {
        return source.some((item) => {
          const value = item[metricKey];
          return value != null && !isNaN(value) && value > 0;
        });
      });
    });

    return new Set(available);
  }, [data, currentStructure]);

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
