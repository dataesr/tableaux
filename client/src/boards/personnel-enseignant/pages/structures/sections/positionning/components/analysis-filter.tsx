import { Text } from "@dataesr/dsfr-plus";
import { ItemFilterPanel, type FilterItem } from "../../../../../../../components/item-filter";
import { FM_ANALYSES, getAvailablePositioningFilters } from "../config";
import { useFacultyCnuList, useFacultyAssimilationList } from "../../../api";
import type { FmPositioningFilters } from "../hooks/usePositioningParams";
import type { ViewType } from "../../../api";

interface Props {
    selectedMetric: string;
    onSelectMetric: (m: string, label?: string) => void;
    year: string;
    viewType: ViewType;
    currentItem: any;
    filters: FmPositioningFilters;
    onFiltersChange: (f: FmPositioningFilters) => void;
}

export default function AnalysisFilter({ selectedMetric, onSelectMetric, year, viewType, currentItem, filters, onFiltersChange }: Props) {
    const { data: cnuData } = useFacultyCnuList(year);
    const { data: assimilData } = useFacultyAssimilationList(year);

    const staticItems: FilterItem[] = Object.entries(FM_ANALYSES).map(([key, analysis]) => ({
        key,
        label: analysis.label,
        category: analysis.category,
    }));

    const cnuGroupItems: FilterItem[] = cnuData?.groupes?.map((g) => ({
        key: `groupe_cnu:${g.code}`,
        label: g.label || `Groupe ${g.code}`,
        category: "Groupes CNU",
    })) ?? [];

    const cnuSectionItems: FilterItem[] = cnuData?.sections?.map((s) => ({
        key: `section_cnu:${s.code}`,
        label: s.label || `Section ${s.code}`,
        category: "Sections CNU",
    })) ?? [];

    const assimilItems: FilterItem[] = assimilData?.categories?.map((c) => ({
        key: `assimil:${c.code}`,
        label: c.label || `Catégorie ${c.code}`,
        category: "Catégories",
    })) ?? [];

    const items: FilterItem[] = [...staticItems, ...cnuGroupItems, ...cnuSectionItems, ...assimilItems];
    const allKeys = new Set(items.map((i) => i.key));

    const toggle = (key: keyof FmPositioningFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: filters[key] === value ? "" : value });
    };

    const available = getAvailablePositioningFilters(viewType, currentItem);
    const hasFilters = available.type || available.academie || available.region;

    const footer = hasFilters ? (
        <>
            <Text className="fr-text--sm fr-text--bold fr-mb-1w fr-text-mention--grey">
                Filtrer la comparaison
            </Text>
            {available.type && (
                <button
                    type="button"
                    aria-pressed={filters.type === "same-type"}
                    className={`fr-btn fr-btn--sm ${filters.type === "same-type" ? "" : "fr-btn--secondary"}`}
                    onClick={() => toggle("type", "same-type")}
                >
                    Même type ({currentItem.etablissement_type})
                </button>
            )}
            {available.region && (
                <button
                    type="button"
                    aria-pressed={filters.region === "same-region"}
                    className={`fr-btn fr-btn--sm ${filters.region === "same-region" ? "" : "fr-btn--secondary"}`}
                    onClick={() => toggle("region", "same-region")}
                >
                    Même région ({currentItem.etablissement_region})
                </button>
            )}
            {available.academie && (
                <button
                    type="button"
                    aria-pressed={filters.academie === "same-academie"}
                    className={`fr-btn fr-btn--sm ${filters.academie === "same-academie" ? "" : "fr-btn--secondary"}`}
                    onClick={() => toggle("academie", "same-academie")}
                >
                    Même académie ({currentItem.etablissement_academie})
                </button>
            )}
        </>
    ) : undefined;

    return (
        <ItemFilterPanel
            title="Analyses disponibles"
            items={items}
            availableKeys={allKeys}
            selectedKey={selectedMetric}
            onSelect={(key) => {
                const found = items.find((i) => i.key === key);
                onSelectMetric(key, found?.label);
            }}
            footer={footer}
        />
    );
}
