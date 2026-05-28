import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { createChartOptions } from "../../../../../components/chart-wrapper/default-options";


export type HeatmapCell = { pct: number; count: number; dipl: number } | null;

interface CreateHeatmapOptionsParams {
    vOptions: Array<{ key: string; label: string }>;
    vAxisLabel: string;
    hOptions: Array<{ key: string; label: string }>;
    hAxisLabel: string;
    getCell: (vKey: string, hKey: string) => HeatmapCell;
    getRowMargin: (vKey: string) => HeatmapCell;
    getColMargin: (hKey: string) => HeatmapCell;
    ensemble: HeatmapCell;
}

const ENSEMBLE_LABEL = "Ensemble";

export function createHeatmapOptions({
    vOptions,
    hOptions,
    getCell,
    getRowMargin,
    getColMargin,
    ensemble,
}: CreateHeatmapOptionsParams): HighchartsInstance.Options {
    const xCategories = [...hOptions.map((h) => h.label), ENSEMBLE_LABEL];
    const yCategories = [...vOptions.map((v) => v.label), ENSEMBLE_LABEL];
    const lastX = xCategories.length - 1;
    const lastY = yCategories.length - 1;

    type DataPoint = {
        x: number;
        y: number;
        value: number | null;
        custom: { count: number; dipl: number; vLabel: string; hLabel: string; isMargin: boolean };
        borderWidth?: number;
        borderColor?: string;
    };

    const data: DataPoint[] = [];
    const pushPoint = (
        x: number, y: number, cell: HeatmapCell,
        vLabel: string, hLabel: string, isMargin: boolean,
    ) => {
        data.push({
            x, y,
            value: cell ? Number(cell.pct.toFixed(1)) : null,
            custom: { count: cell?.count ?? 0, dipl: cell?.dipl ?? 0, vLabel, hLabel, isMargin },
            ...(isMargin ? { borderWidth: 2, borderColor: "var(--border-default-grey)" } : {}),
        });
    };

    vOptions.forEach((v, vi) => {
        hOptions.forEach((h, hi) => pushPoint(hi, vi, getCell(v.key, h.key), v.label, h.label, false));
        pushPoint(lastX, vi, getRowMargin(v.key), v.label, ENSEMBLE_LABEL, true);
    });
    hOptions.forEach((h, hi) => pushPoint(hi, lastY, getColMargin(h.key), ENSEMBLE_LABEL, h.label, true));
    pushPoint(lastX, lastY, ensemble, ENSEMBLE_LABEL, ENSEMBLE_LABEL, true);

    const chartHeight = Math.max(380, yCategories.length * 56 + 100);

    return createChartOptions("heatmap" as any, ({
        caption: {
            align: "left",
            style: { color: "var(--text-mention-grey)", fontSize: "11px" },
            text: "Source : MESRE-SIES.",
            verticalAlign: "bottom",
        },
        chart: {
            type: "heatmap",
            height: chartHeight,
            marginTop: 60,
            marginBottom: 80,
        },
        title: {
            text: " ",
        },
        xAxis: {
            categories: xCategories,
            opposite: true,
        },
        yAxis: {
            categories: yCategories,
            title: { text: undefined },
            reversed: true,
        },
        colorAxis: {
            min: 0,
            max: 100,
            stops: [
                [0, "#ce614a"],
                [0.25, "#fcbfb7"],
                [0.45, "var(--background-alt-grey)"],
                [0.6, "#6fe49d"],
                [0.75, "#00a95f"],
            ],
            labels: { format: "{value}%" },
        },
        legend: {
            enabled: true,
            align: "right",
            layout: "vertical",
            verticalAlign: "middle",
            symbolHeight: 240,
        },
        tooltip: {
            useHTML: true,
            formatter: function () {
                const point = this as any;
                const c = point.point.custom as DataPoint["custom"];
                if (point.value === null) {
                    return `<b>${c.vLabel} × ${c.hLabel}</b><br/>Données non disponibles`;
                }
                const lib = c.isMargin ? "(ensemble)" : "";
                return `<b>${c.vLabel} × ${c.hLabel}</b> ${lib}<br/>` +
                    `Taux de diplômés : <b>${point.value.toFixed(1)}%</b><br/>` +
                    `Effectif : ${c.count.toLocaleString("fr-FR")} étudiants<br/>` +
                    `Diplômés : ${c.dipl.toLocaleString("fr-FR")}`;
            },
        },
        series: [{
            type: "heatmap",
            name: "Taux de diplômés",
            data,
            nullColor: "var(--background-disabled-grey)",
            borderWidth: 1,
            borderColor: "var(--background-default-grey)",
            dataLabels: {
                enabled: true,
                format: "{point.value:.0f}%",
                style: { fontSize: "13px", fontWeight: "600", textOutline: "none" },
                nullFormat: "n/a",
            },
        }],
    } as any));
}
