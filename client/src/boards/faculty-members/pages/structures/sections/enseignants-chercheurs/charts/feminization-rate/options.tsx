import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../../../utils/colors";

export function createFeminizationRateOptions(
    genderEvolution: any[]
): Highcharts.Options {
    const categories = genderEvolution.map((e: any) => e._id);
    const rateData = genderEvolution.map((e: any) => {
        const f = e.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
        const m = e.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0;
        const total = f + m;
        return total > 0 ? Math.round((f / total) * 1000) / 10 : null;
    });

    return createChartOptions("line", {
        chart: { height: 350 },
        xAxis: {
            categories,
            title: { text: null },
            labels: { rotation: -45 },
        },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: "Part des femmes (%)" },
            labels: { format: "{value} %" },
            plotLines: [
                {
                    value: 50,
                    color: getCssColor("text-mention-grey"),
                    dashStyle: "Dash",
                    width: 1,
                    zIndex: 3,
                    label: {
                        text: "Parité (50 %)",
                        align: "right",
                        x: -8,
                        style: { color: "var(--text-mention-grey)", fontSize: "10px" },
                    },
                },
            ],
        },
        tooltip: {
            shared: true,
            headerFormat: "<b>{point.key}</b><br/>",
            pointFormat:
                '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:.1f} %</b>',
        },
        plotOptions: {
            line: {
                marker: { enabled: true, radius: 3 },
                lineWidth: 2.5,
            },
        },
        legend: { enabled: false },
        series: [
            {
                type: "line",
                name: "Part des femmes",
                data: rateData,
                color: getCssColor("fm-femmes"),
            },
        ],
    });
}
