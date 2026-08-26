import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const AGE_ORDER = [
    "35 ans et moins",
    "36 à 55 ans",
    "56 ans et plus",
];

export function createAgeDistributionOptions(
    ageDistribution: any[]
): Highcharts.Options {
    const sorted = AGE_ORDER
        .map((age) => ageDistribution.find((a: any) => a._id === age))
        .filter(Boolean);

    const categories = sorted.map((a: any) => a._id);
    const femaleData = sorted.map((a: any) => {
        const f = a.gender_breakdown?.find((g: any) => g.gender === "Féminin");
        return f?.count || 0;
    });
    const maleData = sorted.map((a: any) => {
        const m = a.gender_breakdown?.find((g: any) => g.gender === "Masculin");
        return -(m?.count || 0);
    });

    return createChartOptions("bar", {
        chart: { height: 280 },
        xAxis: {
            categories,
            title: { text: null },
        },
        yAxis: {
            title: { text: "Effectif" },
            labels: {
                formatter() {
                    return Highcharts.numberFormat(Math.abs(this.value as number), 0, ",", " ");
                },
            },
        },
        plotOptions: {
            bar: {
                stacking: "normal",
                borderWidth: 0,
                borderRadius: 2,
            },
        },
        tooltip: {
            formatter() {
                const point: any = this;
                return `<b>${point.key ?? point.x}</b><br/><span style="color:${point.color}">●</span> ${point.series.name}: <b>${Highcharts.numberFormat(Math.abs(point.y), 0, ",", " ")}</b>`;
            },
        },
        legend: {
            enabled: true,
            reversed: true,
            itemStyle: { fontSize: "11px", fontWeight: "normal" },
        },
        series: [
            {
                type: "bar",
                name: "Hommes",
                data: maleData,
                color: getCssColor("fm-hommes"),
            },
            {
                type: "bar",
                name: "Femmes",
                data: femaleData,
                color: getCssColor("fm-femmes"),
            },
        ],
    });
}
