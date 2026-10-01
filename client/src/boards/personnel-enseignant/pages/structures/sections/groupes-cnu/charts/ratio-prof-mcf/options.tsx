import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export interface RatioPoint {
    name: string;
    x: number;
    y: number;
    sectionTotal: number;
}

export function createRatioProfMcfOptions(
    scatterData: RatioPoint[],
    maxValue: number
): Highcharts.Options {
    const padding = maxValue * 0.05;

    return createChartOptions("scatter", {
        chart: { height: 500 },
        xAxis: {
            title: { text: "Maîtres de conférences et assimilés" },
            min: -padding,
            max: maxValue + padding,
            gridLineWidth: 1,
        },
        yAxis: {
            title: { text: "Professeurs des universités et assimilés" },
            min: -padding,
            max: maxValue + padding,
            gridLineWidth: 1,
        },
        tooltip: {
            useHTML: true,
            formatter: function () {
                const point = this as any;
                const ratio = point.x > 0 ? (point.y / point.x).toFixed(2) : "—";
                return `<strong>${point.name}</strong><br/>
          Professeurs : <strong>${point.y?.toLocaleString("fr-FR")}</strong><br/>
          MCF : <strong>${point.x?.toLocaleString("fr-FR")}</strong><br/>
          Total : <strong>${point.sectionTotal?.toLocaleString("fr-FR")}</strong><br/>
          Ratio professeurs / MCF : <strong>${ratio}</strong>`;
            },
        },
        plotOptions: {
            scatter: {
                marker: { radius: 6, symbol: "circle" },
            },
        },
        legend: { enabled: false },
        series: [
            {
                type: "line",
                name: "Équilibre professeurs / MCF",
                data: [
                    [0, 0],
                    [maxValue, maxValue],
                ],
                color: getCssColor("border-default-grey"),
                dashStyle: "Dash",
                lineWidth: 2,
                marker: { enabled: false },
                enableMouseTracking: false,
            },
            {
                type: "scatter",
                name: "Sections CNU",
                data: scatterData,
                color: getCssColor("fm-cat-pr"),
            },
        ],
    });
}
