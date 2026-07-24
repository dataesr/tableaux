import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { FM_METRICS_CONFIG, type FmMetricKey } from "../../config";
import { createFmComparisonBarOptions } from "./options";
import { formatNumber, formatToPercent } from "../../../../../../../../utils/format";

interface Props {
    data: any[];
    currentId?: string;
    currentName?: string;
    selectedMetric: string;
    selectedYear: string;
    labelOverride?: string;
}

function getRank(data: any[], currentId: string | undefined, dataKey: FmMetricKey): string {
    if (!currentId) return "";
    const sorted = [...data]
        .filter((item) => item[dataKey] != null)
        .sort((a, b) => (b[dataKey] as number) - (a[dataKey] as number));
    const rank = sorted.findIndex((item) => item.etablissement_id_paysage_actuel === currentId) + 1;
    if (!rank) return "";
    return `${rank}e / ${sorted.length}`;
}

export default function ComparisonBarChart({ data, currentId, currentName, selectedMetric, selectedYear, labelOverride }: Props) {
    const isDynamic = selectedMetric.startsWith("groupe_cnu:") || selectedMetric.startsWith("section_cnu:") || selectedMetric.startsWith("assimil:");
    const dataKey = (isDynamic ? "total_effectif" : selectedMetric) as FmMetricKey;
    const config = FM_METRICS_CONFIG[dataKey] ?? FM_METRICS_CONFIG["total_effectif"];
    const displayLabel = labelOverride || config.label;

    console.log(data)
    const options = useMemo(
        () => createFmComparisonBarOptions(data, selectedMetric, currentId, currentName, labelOverride),
        [data, selectedMetric, currentId, currentName, labelOverride]
    );

    const currentValue = useMemo(
        () => data.find((item) => item.etablissement_id_paysage_actuel === currentId)?.[dataKey],
        [data, currentId, dataKey]
    );

    const rank = useMemo(() => getRank(data, currentId, dataKey), [data, currentId, dataKey]);

    const formattedValue = currentValue != null
        ? config.format === "percent"
            ? formatToPercent(currentValue)
            : formatNumber(currentValue)
        : null;

    const readingKey = currentName && formattedValue && rank
        ? { fr: (<><strong>{currentName}</strong> : {formattedValue} — rang <strong>{rank}</strong></>) }
        : null;

    return (
        <ChartWrapper
            config={{
                id: `fm-comparison-bar-${selectedMetric}`,
                title: { fr: `${displayLabel} ${currentName ? `: ${currentName}` : ""} (${selectedYear})`, look: "h5" as const },
                readingKey: readingKey || undefined,
                sources: [{ label: { fr: <>MESR-SIES, SISE</> }, url: { fr: "https://data.enseignementsup-recherche.gouv.fr" } }],
            }}
            options={options}
        />
    );
}
