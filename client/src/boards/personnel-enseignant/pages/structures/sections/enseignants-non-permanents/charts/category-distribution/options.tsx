import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export interface CategoryData {
    categoryCode: string;
    categoryName: string;
    maleCount: number;
    femaleCount: number;
    totalCount: number;
}

export function createCategoryDistributionOptions(
    categoryData: CategoryData[],
    title: string
): Highcharts.Options | null {
    if (!categoryData || categoryData.length === 0) return null;

    const sortedData = [...categoryData].sort(
        (a, b) => b.totalCount - a.totalCount
    );

    const categories = sortedData.map((item) => item.categoryName);
    const womenData = sortedData.map((item) => item.femaleCount);
    const menData = sortedData.map((item) => -item.maleCount);

    const maxAbs =
        Math.max(
            0,
            ...womenData.map((v) => Math.abs(v)),
            ...menData.map((v) => Math.abs(v))
        ) || 1;

    return createChartOptions("bar", {
        chart: {
            height: Math.max(250, 80 + categories.length * 40),
        },
        title: { text: title, style: { display: "none" } },
        accessibility: {
            description:
                "Pyramide : effectifs de femmes et d'hommes enseignants non permanents par catégorie.",
        },
        xAxis: {
            categories,
            title: { text: null },
        },
        yAxis: {
            min: -maxAbs,
            max: maxAbs,
            title: { text: "Nombre d'enseignants" },
            labels: {
                formatter() {
                    return Highcharts.numberFormat(Math.abs(this.value as number), 0, ",", " ");
                },
            },
        },
        tooltip: {
            formatter() {
                const point: any = this;
                return `<b>${point.key ?? point.x}</b><br/><span style="color:${point.color}">●</span> ${point.series.name}: <b>${Highcharts.numberFormat(Math.abs(point.y), 0, ",", " ")}</b>`;
            },
        },
        plotOptions: {
            bar: {
                stacking: "normal",
                dataLabels: { enabled: false },
            },
        },
        legend: {
            enabled: true,
            reversed: true,
            itemStyle: { fontSize: "11px" },
        },
        series: [
            {
                name: "Hommes",
                data: menData,
                type: "bar",
                color: getCssColor("fm-hommes"),
                accessibility: {
                    point: { valueDescriptionFormat: "{xDescription}, {subtract 0 point.y}." },
                },
            },
            {
                name: "Femmes",
                data: womenData,
                type: "bar",
                color: getCssColor("fm-femmes"),
            },
        ],
    });
}
