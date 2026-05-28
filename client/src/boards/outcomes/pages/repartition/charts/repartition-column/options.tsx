import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../utils/colors";

function resolveTokenColor(token: string) {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return getCssColor(token);
    }
    const probe = document.createElement("span");
    probe.style.color = `var(--${token})`;
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);
    const resolved = window.getComputedStyle(probe).color;
    document.body.removeChild(probe);
    if (!resolved || resolved === "rgb(0, 0, 0)") return getCssColor(token);
    return resolved;
}

function formatPercent(value: number) {
    return `${new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }).format(value)}%`;
}

const SITUATION_LABELS: Record<string, string> = {
    SIT01: "L1",
    SIT02: "L2",
    SIT03: "L3",
    SIT04: "M1",
    SIT05: "M2",
    SIT06: "STS",
    SIT07: "CPGE",
    SIT08: "IUT",
    SIT09: "LP",
    SIT10: "Cursus santé",
    SIT11: "Écoles d'ingénieur et de commerce",
    SIT12: "Autres formations",
    SIT_DIPL: "Sortants diplômés",
    SIT13: "Sortants non diplômés",
};

const SITUATION_COLOR_KEYS: Record<string, string> = {
    SIT01: "outcomes-l1",
    SIT02: "outcomes-l2",
    SIT03: "outcomes-l3",
    SIT04: "outcomes-m1",
    SIT05: "outcomes-m2",
    SIT06: "outcomes-sts",
    SIT07: "outcomes-cpge",
    SIT08: "outcomes-iut",
    SIT09: "outcomes-lp",
    SIT10: "outcomes-sante",
    SIT11: "outcomes-ecoles",
    SIT12: "outcomes-autres",
    SIT_DIPL: "outcomes-sortants-diplomes",
    SIT13: "outcomes-sortants-non-diplomes",
};

const SITUATION_ORDER = [
    "SIT01", "SIT02", "SIT03", "SIT09", "SIT04", "SIT05",
    "SIT06", "SIT08", "SIT07", "SIT11",
    "SIT10", "SIT12", "SIT_DIPL", "SIT13",
];

interface DistributionItem {
    annee_rel: number;
    situation: string;
    count: number;
}

export function createRepartitionOptions(
    distribution: DistributionItem[],
    relativeYears: number[],
    yearLabels: Record<number, string>,
) {
    const categories = relativeYears.map((y) => yearLabels[y] || `N+${y}`);

    const situationsInData = new Set(distribution.map((d) => d.situation));
    const orderedSituations = SITUATION_ORDER.filter((s) => situationsInData.has(s));

    const series = orderedSituations.map((situation) => ({
        name: SITUATION_LABELS[situation] || situation.replaceAll("_", " "),
        color: getCssColor(SITUATION_COLOR_KEYS[situation] || "scale-3"),
        data: relativeYears.map((year) => {
            const item = distribution.find(
                (d) => d.annee_rel === year && d.situation === situation
            );
            return item?.count || 0;
        }),
    }));

    return createChartOptions("column", ({
        accessibility: {
            point: {
                valueDescriptionFormat: "{series.name}: {point.percentage:.1f}%",
            },
        },
        caption: {
            align: "left",
            style: { color: "var(--text-mention-grey)", fontSize: "11px" },
            text: "Source : MESRE-SIES.",
            verticalAlign: "bottom",
        },
        chart: {
            type: "column", backgroundColor: "transparent", height: 600,
        },
        exporting: { enabled: false },
        credits: { enabled: false },
        legend: { enabled: true, reversed: false, itemStyle: { color: getCssColor("text-default-grey") } },
        plotOptions: {
            column: {
                borderWidth: 0,
                dataLabels: {
                    enabled: true,
                    format: "{point.percentage:.0f} %",
                    style: {
                        color: getCssColor("text-default-grey"),
                        fontSize: "11px",
                        textOutline: "none",
                    },
                },
                groupPadding: 0.05,
                pointPadding: 0,
                stacking: "percent",
            },
        },
        series,
        title: {
            text: " ",
        }, tooltip: {
            shared: false,
            useHTML: true,
            borderRadius: 0,
            borderWidth: 1,
            borderColor: resolveTokenColor("border-default-grey"),
            backgroundColor: resolveTokenColor("background-overlap-grey"),
            shadow: false,
            padding: 0,
            shape: "square",
            outside: true,
            style: {
                color: resolveTokenColor("text-title-grey"),
                fontSize: "13px",
                zIndex: 9999,
            },
            formatter() {
                const pt = this as any;
                if (!pt || (pt.y || 0) <= 0) return false;

                const colorTitle = resolveTokenColor("text-title-grey");
                const colorBgAlt = resolveTokenColor("background-alt-grey");
                const pct = pt.percentage || 0;
                const pctClamped = Math.max(0, Math.min(100, pct));

                const row = `
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:12px;color:${colorTitle};">
                            <span style="display:flex;align-items:center;gap:8px;min-width:0;">
                                <span style="display:inline-block;width:10px;height:10px;background:${pt.series.color};flex-shrink:0;"></span>
                                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pt.series.name}</span>
                            </span>
                            <span style="font-weight:700;flex-shrink:0;">${formatPercent(pct)}</span>
                        </div>
                        <div style="margin-top:4px;height:3px;background:${colorBgAlt};">
                            <div style="width:${pctClamped}%;height:100%;background:${pt.series.color};"></div>
                        </div>
                    </div>
                `;

                return `
                    <div style="padding:12px 14px;width:300px;box-sizing:border-box;">
                        ${row}
                    </div>
                `;
            },
        },
        xAxis: { categories, crosshair: false, labels: { style: { color: getCssColor("text-default-grey") } } },
        yAxis: {
            labels: { format: "{value} %", style: { color: getCssColor("text-default-grey") } },
            title: { text: undefined },
        },
    } as any));
}
