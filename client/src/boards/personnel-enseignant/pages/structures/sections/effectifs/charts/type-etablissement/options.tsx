import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const SCALE_TOKENS = ["scale-1", "scale-2", "scale-3", "scale-4", "scale-5", "scale-6"];

export function createEstablishmentTypeOptions(
    categories: string[],
    data: number[]
): Highcharts.Options {
    const chartData = data.map((y, i) => ({
        y,
        color: getCssColor(SCALE_TOKENS[i % SCALE_TOKENS.length]),
    }));

    return createChartOptions("column", {
        chart: { height: 300 },
        xAxis: {
            categories,
            title: { text: null },
            labels: {
                autoRotation: [-45],
                style: { fontSize: "11px" },
            },
        },
        yAxis: { visible: false, min: 0 },
        plotOptions: {
            column: {
                borderWidth: 0,
                borderRadius: 4,
                dataLabels: {
                    enabled: true,
                    format: "{point.y:,.0f}",
                    style: { fontSize: "11px", fontWeight: "bold" },
                },
            },
        },
        tooltip: {
            headerFormat: "<b>{point.key}</b><br/>",
            pointFormat: "Effectif\u00a0: <b>{point.y:,.0f}</b>",
        },
        legend: { enabled: false },
        series: [
            {
                type: "column",
                name: "Effectif",
                data: chartData,
            },
        ],
    });
}
