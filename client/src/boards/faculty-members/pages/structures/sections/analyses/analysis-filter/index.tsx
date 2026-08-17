import { useState } from "react";
import ItemFilter, { type FilterItem } from "../../../../../../../components/item-filter";
import type { FmAnalysisConfig } from "../../../../../config/analyses-config";

interface FmAnalysisFilterProps {
    allAnalyses: Record<string, FmAnalysisConfig>;
    analysesWithData: Set<string>;
    selectedAnalysis: string | null;
    onSelectAnalysis: (key: string) => void;
}

export default function FmAnalysisFilter({
    allAnalyses,
    analysesWithData,
    selectedAnalysis,
    onSelectAnalysis,
}: FmAnalysisFilterProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("Vue d'ensemble");

    const items: FilterItem[] = Object.entries(allAnalyses).map(([key, analysis]) => ({
        key,
        label: analysis.label,
        category: analysis.category,
    }));

    return (
        <ItemFilter
            title="Analyses disponibles"
            items={items}
            availableKeys={analysesWithData}
            selectedKey={selectedAnalysis}
            selectedCategory={selectedCategory}
            onSelectItem={onSelectAnalysis}
            onSelectCategory={setSelectedCategory}
        />
    );
}
