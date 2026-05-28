import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../utils/colors";

const DIPLOMA_COLOR_KEYS: Record<string, string> = {
    "Licence générale": "outcomes-l3",
    "Licence professionnelle": "outcomes-lp",
    BTS: "outcomes-sts",
    "DUT/BUT": "outcomes-iut",
    "Autres formations": "outcomes-autres",
};

function formatNumber(n: number): string {
    return Math.round(n).toLocaleString("fr-FR");
}

function formatPercent(n: number): string {
    return `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function createDiplomaDonutOptions(
    rows: Array<{ diplome: string; effectif: number }>,
    nonDiplomes: { effectif: number },
    seriesName: string,
): Highcharts.Options {
    const data = [
        ...rows.map((r) => ({
            name: r.diplome,
            y: r.effectif,
            color: getCssColor(DIPLOMA_COLOR_KEYS[r.diplome] || "outcomes-autres"),
        })),
        {
            name: "Non diplômés",
            y: nonDiplomes.effectif,
            color: getCssColor("outcomes-sortants-non-diplomes"),
        },
    ];

    return createChartOptions("pie", {
        caption: {
            align: "left",
            style: { color: "var(--text-mention-grey)", fontSize: "11px" },
            text: "Source : MESRE-SIES.",
            verticalAlign: "bottom",
        },
        chart: { height: 320, backgroundColor: "transparent" },
        legend: {
            enabled: true,
            layout: "horizontal",
            align: "center",
            verticalAlign: "bottom",
            labelFormatter() {
                const p = this as unknown as { name: string; percentage: number };
                return `${p.name} — ${formatPercent(p.percentage)}`;
            },
        },
        title: {
            "text": " ",
        },
        tooltip: {
            pointFormatter() {
                const p = this as unknown as { y: number; percentage: number };
                return `<b>${formatNumber(p.y)}</b> étudiants (${formatPercent(p.percentage)})`;
            },
        },
        plotOptions: {
            pie: {
                innerSize: "60%",
                borderWidth: 2,
                dataLabels: { enabled: false },
                showInLegend: true,
            },
        },
        series: [{ type: "pie", name: seriesName, data }],
    });
}
