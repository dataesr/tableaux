import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

const isPartiel = (q: string) => /partiel/i.test(q || "");

function partTimeRate(entry: any, gender?: string): number | null {
    let partiel = 0;
    let total = 0;
    (entry?.quotite_breakdown || []).forEach((b: any) => {
        if (gender && b.gender !== gender) return;
        total += b.count || 0;
        if (isPartiel(b.quotite)) partiel += b.count || 0;
    });
    return total > 0 ? Math.round((partiel / total) * 1000) / 10 : null;
}

export function createPartTimeEvolutionOptions(
    quotiteEvolution: any[]
): Highcharts.Options | null {
    if (!quotiteEvolution?.length) return null;

    const rows = [...quotiteEvolution].sort((a, b) =>
        String(a._id).localeCompare(String(b._id))
    );
    const categories = rows.map((e) => e._id);

    return createChartOptions("line", {
        chart: { height: 350 },
        xAxis: {
            categories,
            title: { text: null },
            labels: { rotation: -45 },
        },
        yAxis: {
            min: 0,
            title: { text: "Part du temps partiel (%)" },
            labels: { format: "{value} %" },
        },
        tooltip: {
            shared: true,
            headerFormat: "<b>{point.key}</b><br/>",
            pointFormat:
                '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:.1f} %</b><br/>',
        },
        plotOptions: {
            line: { marker: { enabled: true, radius: 3 }, lineWidth: 2.5 },
        },
        legend: {
            enabled: true,
            itemStyle: { fontSize: "11px", fontWeight: "normal" },
        },
        series: [
            {
                type: "line",
                name: "Ensemble",
                data: rows.map((e) => partTimeRate(e)),
                color: getCssColor("fm-indicateur"),
                dashStyle: "Dash",
                marker: { enabled: false },
            },
            {
                type: "line",
                name: "Femmes",
                data: rows.map((e) => partTimeRate(e, "Féminin")),
                color: getCssColor("fm-femmes"),
            },
            {
                type: "line",
                name: "Hommes",
                data: rows.map((e) => partTimeRate(e, "Masculin")),
                color: getCssColor("fm-hommes"),
            },
        ],
    });
}
