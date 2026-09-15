import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";

export function createTreemapSectionsOptions(
    treemapData: Array<{
        id?: string;
        name: string;
        value?: number;
        parent?: string;
        color?: string;
    }>
): Highcharts.Options {
    return createChartOptions("treemap", {
        chart: { height: 550, marginLeft: 0 },
        tooltip: {
            useHTML: true,
            pointFormat: "Effectif : <b>{point.value:,.0f}</b>",
        },
        series: [
            {
                type: "treemap",
                layoutAlgorithm: "squarified",
                allowDrillToNode: true,
                alternateStartingDirection: true,
                levels: [
                    {
                        level: 1,
                        layoutAlgorithm: "sliceAndDice",
                        dataLabels: {
                            enabled: true,
                            align: "left",
                            verticalAlign: "top",
                            style: {
                                fontSize: "13px",
                                fontWeight: "bold",
                                textOutline: "none",
                            },
                        },
                    },
                    {
                        level: 2,
                        dataLabels: {
                            enabled: true,
                            format: "{point.name}",
                            style: {
                                fontSize: "10px",
                                fontWeight: "normal",
                                textOutline: "none",
                            },
                        },
                    },
                ],
                data: treemapData,
            },
        ] as any,
    });
}
