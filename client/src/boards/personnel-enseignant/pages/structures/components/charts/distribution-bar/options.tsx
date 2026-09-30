import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../../../components/chart-wrapper/default-options";

export interface DistributionSegment {
    name: string;
    value: number;
    color: string;
    female?: number;
    male?: number;
}

export function createDistributionBarOptions(
    segments: DistributionSegment[],
    title: string
): Highcharts.Options {
    const series = segments
        .filter((s) => s.value > 0)
        .map((s) => ({
            type: "bar" as const,
            name: s.name,
            color: s.color,
            data: [{ y: s.value, custom: { female: s.female ?? null, male: s.male ?? null } }],
        }));

    return createChartOptions("bar", {
        chart: {
            height: 150, spacingBottom: 0, backgroundColor: "transparent",
        },
        xAxis: { visible: false, categories: [""] },
        yAxis: { visible: false, min: 0, reversedStacks: false },
        title: {
            text: title,
            style: { display: "none" },
        },
        plotOptions: {
            bar: {
                stacking: "percent",
                borderWidth: 1,
                dataLabels: {
                    enabled: true,
                    formatter() {
                        const point: any = this;
                        return point.percentage >= 8 ? `${Math.round(point.percentage)} %` : null;
                    },
                    style: { color: "#ffffff", fontSize: "10px", fontWeight: "700", textOutline: "none" },
                },
            },
        },
        legend: {
            enabled: true,
            navigation: { enabled: false },
            itemStyle: { fontSize: "11px", fontWeight: "normal" },
        },
        series,
        tooltip: {
            formatter() {
                const point: any = this;
                const c = point.point?.custom || {};
                const gender =
                    c.female != null && c.male != null
                        ? `<br/>${Highcharts.numberFormat(c.female, 0, ",", " ")} F · ${Highcharts.numberFormat(c.male, 0, ",", " ")} H`
                        : "";
                return `<b>${point.series.name}</b><br/>${Highcharts.numberFormat(point.y, 0, ",", " ")} · ${Math.round(point.percentage)} %${gender}`;
            },
        },
    });
}
