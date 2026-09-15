import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const isPartiel = (q: string) => /partiel/i.test(q || "");
const isPlein = (q: string) => /plein/i.test(q || "");

export function createQuotiteByCategoryOptions(
    quotiteByCategory: any[]
): Highcharts.Options | null {
    if (!quotiteByCategory?.length) return null;

    let plein = 0;
    let partiel = 0;
    quotiteByCategory.forEach((c: any) => {
        (c.quotite_breakdown || []).forEach((b: any) => {
            if (isPartiel(b.quotite)) partiel += b.count || 0;
            else if (isPlein(b.quotite)) plein += b.count || 0;
        });
    });

    const total = plein + partiel;
    if (total <= 0) return null;

    return createChartOptions("pie", {
        chart: { height: 320 },
        tooltip: {
            useHTML: true,
            pointFormat: "<b>{point.y:,.0f}</b> ({point.percentage:.1f} %)",
        },
        plotOptions: {
            pie: {
                innerSize: "62%",
                borderWidth: 2,
                borderColor: "var(--background-default-grey)",
                dataLabels: {
                    enabled: true,
                    distance: 12,
                    format: "{point.name}<br/><b>{point.percentage:.1f} %</b>",
                    style: { fontSize: "12px", fontWeight: "normal", textOutline: "none" },
                },
            },
        },
        legend: {
            enabled: true,
            align: "center",
            verticalAlign: "bottom",
            itemStyle: { fontSize: "11px", fontWeight: "normal" },
        },
        series: [
            {
                type: "pie",
                name: "Effectif",
                showInLegend: true,
                data: [
                    { name: "Temps plein", y: plein, color: getCssColor("fm-quotite-temps-plein") },
                    { name: "Temps partiel", y: partiel, color: getCssColor("fm-quotite-temps-partiel") },
                ],
            },
        ],
    });
}
