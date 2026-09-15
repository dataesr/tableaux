import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const AGE_ORDER = [
    { key: "35 ans et moins", label: "≤ 35 ans", color: "fm-age-35-et-moins-ec" },
    { key: "36 à 55 ans", label: "36 – 55 ans", color: "fm-age-36-55-ec" },
    { key: "56 ans et plus", label: "≥ 56 ans", color: "fm-age-56-et-plus-ec" },
];

export function createAgeCategoryHeatmapOptions(
    categoryDistribution: any[]
): Highcharts.Options | null {
    if (!categoryDistribution?.length) return null;

    const cats = [...categoryDistribution].sort(
        (a, b) => (b.totalCount || 0) - (a.totalCount || 0)
    );
    const categories = cats.map((c) => c.categoryName || c.categoryCode);

    const series: Highcharts.SeriesOptionsType[] = AGE_ORDER.map((a) => ({
        type: "bar" as const,
        name: a.label,
        color: getCssColor(a.color),
        data: cats.map(
            (c) => c.ageDistribution?.find((d: any) => d.ageClass === a.key)?.count || 0
        ),
    }));

    return createChartOptions("bar", {
        chart: { height: Math.max(240, 70 + categories.length * 42) },
        xAxis: { categories, title: { text: null } },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: "Répartition (%)" },
            labels: { format: "{value} %" },
        },
        plotOptions: {
            bar: { stacking: "percent", borderWidth: 0, borderRadius: 2 },
        },
        tooltip: {
            shared: true,
            headerFormat: "<b>{point.key}</b><br/>",
            pointFormat:
                '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:,.0f}</b> ({point.percentage:.1f} %)<br/>',
        },
        legend: {
            enabled: true,
            itemStyle: { fontSize: "11px", fontWeight: "normal" },
        },
        series,
    });
}
