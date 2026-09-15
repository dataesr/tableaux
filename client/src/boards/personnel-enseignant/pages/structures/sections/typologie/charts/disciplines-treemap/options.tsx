import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createDisciplinesTreemapOptions(
    treemapData: Array<{
        name: string;
        value: number;
        colorValue: number;
        maleCount: number;
        femaleCount: number;
    }>
): Highcharts.Options {
    const hommesColor = getCssColor("fm-hommes");
    const femmesColor = getCssColor("fm-femmes");

    return createChartOptions("treemap", {
        chart: { height: 500, marginLeft: 0 },
        colorAxis: {
            minColor: hommesColor,
            maxColor: femmesColor,
            stops: [
                [0, hommesColor],
                [0.4, "#f0e68c"],
                [0.5, "#EFEFEF"],
                [0.6, "#f0b7a8"],
                [1, femmesColor],
            ],
        },
        tooltip: {
            useHTML: true,
            formatter: function () {
                const point = this as any;
                const femalePercent =
                    point.value > 0
                        ? Math.round((point.femaleCount / point.value) * 100)
                        : 0;
                return `<div style="padding:6px;">
          <strong>${point.name}</strong><br/>
          Effectif : <strong>${point.value?.toLocaleString("fr-FR")}</strong><br/>
          <span style="color:${femmesColor}">♀ Femmes : ${point.femaleCount?.toLocaleString("fr-FR")} (${femalePercent}%)</span><br/>
          <span style="color:${hommesColor}">♂ Hommes : ${point.maleCount?.toLocaleString("fr-FR")} (${100 - femalePercent}%)</span>
        </div>`;
            },
        },
        series: [
            {
                type: "treemap",
                layoutAlgorithm: "squarified",
                data: treemapData,
                dataLabels: {
                    enabled: true,
                    format: "{point.name}",
                    style: {
                        fontSize: "12px",
                        fontWeight: "bold",
                        textOutline: "2px white",
                    },
                },
            },
        ] as any,
    });
}
