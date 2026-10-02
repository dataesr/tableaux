import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";
import { AGE_CLASSES } from "../../../../../../config/age-classes";

export function createAgeDistributionOptions(
    ageDistribution: any[],
    title: string
): Highcharts.Options {
    const sorted = AGE_CLASSES.map((a) => a.key)
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

    const maxAbs =
        Math.max(
            0,
            ...femaleData.map((v) => Math.abs(v)),
            ...maleData.map((v) => Math.abs(v))
        ) || 1;

    return createChartOptions("bar", {
        chart: { height: 280 },
        title: { text: title, style: { display: "none" } },
        accessibility: {
            description:
                "Pyramide des âges : effectifs de femmes et d'hommes enseignants-chercheurs par tranche d'âge.",
        },
        xAxis: {
            categories,
            title: { text: null },
        },
        yAxis: {
            min: -maxAbs,
            max: maxAbs,
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
                accessibility: {
                    point: { valueDescriptionFormat: "{xDescription}, {subtract 0 point.y}." },
                },
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
