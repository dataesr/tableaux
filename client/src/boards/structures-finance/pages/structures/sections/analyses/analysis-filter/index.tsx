import {
  ItemFilterPanel,
  type FilterItem,
} from "../../../../../../../components/item-filter";
import {
  PREDEFINED_ANALYSES,
  type AnalysisKey,
} from "../../../../../config/metrics-config";

interface AnalysisFilterProps {
  analysesWithData: Set<AnalysisKey>;
  selectedAnalysis: AnalysisKey | null;
  onSelectAnalysis: (analysis: AnalysisKey) => void;
}

export default function AnalysisFilter({
  analysesWithData,
  selectedAnalysis,
  onSelectAnalysis,
}: AnalysisFilterProps) {
  const items: FilterItem[] = Object.entries(PREDEFINED_ANALYSES).map(
    ([key, analysis]) => ({
      key,
      label: analysis.label,
      category: analysis.category,
    })
  );

  return (
    <ItemFilterPanel
      title="Analyses disponibles"
      items={items}
      availableKeys={analysesWithData as Set<string>}
      selectedKey={selectedAnalysis}
      onSelect={(key) => onSelectAnalysis(key as AnalysisKey)}
    />
  );
}
