import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createGenderEvolutionOptions(
    genderEvolution: any[]
): Highcharts.Options {
    const categories = genderEvolution.map((e: any) => e._id);

    const femaleData = genderEvolution.map((e: any) => {
        const f = e.gender_breakdown?.find((g: any) => g.gender === "Féminin");
        return f?.count || 0;
    });

    const maleData = genderEvolution.map((e: any) => {
        const m = e.gender_breakdown?.find((g: any) => g.gender === "Masculin");
        return m?.count || 0;
    });

    return createChartOptions("area", {
        chart: { height: 350 },
        xAxis: {
            categories,
            title: { text: null },
            labels: { rotation: -45 },
        },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: "Part des effectifs (%)" },
            labels: { format: "{value} %" },
        },
        tooltip: {
            shared: true,
            headerFormat: "<b>{point.key}</b><br/>",
            pointFormat:
                '<span style="color:{series.color}">●</span> {series.name}: <b>{point.percentage:.1f} %</b> ({point.y:,.0f})<br/>',
        },
        plotOptions: {
            area: {
                stacking: "percent",
                marker: { enabled: false, radius: 3 },
                lineWidth: 1,
            },
        },
        legend: {
            enabled: true,
            reversed: true,
            itemStyle: { fontSize: "11px", fontWeight: "normal" },
        },
        series: [
            {
                type: "area",
                name: "Hommes",
                data: maleData,
                color: getCssColor("fm-hommes"),
            },
            {
                type: "area",
                name: "Femmes",
                data: femaleData,
                color: getCssColor("fm-femmes"),
            },
        ],
    });
}
