import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createRatioProfMcfOptions(
    scatterData: Array<{
        name: string;
        x: number;
        y: number;
        total: number;
    }>,
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
                const ratio =
                    point.x > 0 ? (point.y / point.x).toFixed(2) : "—";
                return `<div style="padding:6px;">
          <strong>${point.name}</strong><br/>
          Professeurs : <strong>${point.y?.toLocaleString("fr-FR")}</strong><br/>
          MCF : <strong>${point.x?.toLocaleString("fr-FR")}</strong><br/>
          Total : <strong>${point.sectionTotal?.toLocaleString("fr-FR")}</strong><br/>
          Ratio Professeurs et assimilés/MCF : <strong>${ratio}</strong>
        </div>`;
            },
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 6,
                    symbol: "circle",
                    fillOpacity: 0.7,
                },
            },
        },
        legend: { enabled: false },
        series: [
            {
                type: "line",
                data: [
                    [0, 0],
                    [maxValue, maxValue],
                ],
                color: "var(--border-default-grey)",
                dashStyle: "Dash",
                lineWidth: 2,
                marker: { enabled: false },
                showInLegend: false,
                enableMouseTracking: false,
            },
            {
                type: "scatter",
                name: "Sections CNU",
                data: scatterData,
                color: getCssColor("fm-cat-pr"),
            },
        ] as any,
    });
}
