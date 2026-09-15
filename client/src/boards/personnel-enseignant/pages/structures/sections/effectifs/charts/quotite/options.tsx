import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createQuotiteGroupedOptions(quotiteByGender: any[]): Highcharts.Options {
    const genders = ["Masculin", "Féminin"];
    const labels = ["Hommes", "Femmes"];

    const fullTimeData = genders.map((g) => {
        const entry = quotiteByGender.find((d: any) => d._id === g);
        return entry?.quotite_breakdown?.find((q: any) => q.quotite === "Temps plein")?.count || 0;
    });

    const partTimeData = genders.map((g) => {
        const entry = quotiteByGender.find((d: any) => d._id === g);
        const total = entry?.total || 0;
        const fullTime = entry?.quotite_breakdown?.find((q: any) => q.quotite === "Temps plein")?.count || 0;
        return Math.max(0, total - fullTime);
    });

    return createChartOptions("column", {
        chart: { height: 280 },
        xAxis: { categories: labels, title: { text: null } },
        yAxis: {
            min: 0,
            title: { text: "Effectif" },
            stackLabels: {
                enabled: true,
                format: "{total:,.0f}",
                style: { fontSize: "11px", fontWeight: "bold", textOutline: "none", color: "inherit" },
            },
        },
        plotOptions: {
            column: {
                stacking: "normal",
                borderWidth: 0,
                borderRadius: 3,
                dataLabels: {
                    enabled: true,
                    format: "{point.y:,.0f}",
                    style: { fontSize: "10px", fontWeight: "normal", textOutline: "none", color: getCssColor("text-inverted-grey") },
                    filter: { property: "y", operator: ">", value: 0 },
                },
            },
        },
        tooltip: {
            shared: true,
            headerFormat: "<b>{point.key}</b><br/>",
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}\u00a0: <b>{point.y:,.0f}</b><br/>',
        },
        legend: { enabled: true, reversed: true, itemStyle: { fontSize: "11px", fontWeight: "normal" } },
        series: [
            { type: "column", name: "Temps partiel", data: partTimeData, color: getCssColor("fm-quotite-temps-partiel") },
            { type: "column", name: "Temps plein", data: fullTimeData, color: getCssColor("fm-quotite-temps-plein") },
        ],
    });
}
