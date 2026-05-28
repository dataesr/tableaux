import { createChartOptions } from "../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../utils/colors";

const YEAR_LABELS = ["2019-20", "2020-21", "2021-22", "2022-23", "2023-24"];
const RELATIVE_YEARS = [0, 1, 2, 3, 4];

export const PROFILE_BADGES = ["A", "B", "C"] as const;
export type ProfileBadge = typeof PROFILE_BADGES[number];

export const PROFILE_COLOR_TOKENS: Record<ProfileBadge, string> = {
    A: "blue-france-main-525",
    B: "orange-terre-battue-main-645",
    C: "green-emeraude-main-632",
};

interface ProfileSeriesInput {
    badge: ProfileBadge;
    series?: Array<number | null>;
}

export function createProfilesLineOptions(profiles: ProfileSeriesInput[]) {
    return createChartOptions("line", ({
        accessibility: { enabled: false },
        caption: {
            align: "left",
            style: { color: "var(--text-mention-grey)", fontSize: "11px" },
            text: "Source : MESRE-SIES.",
            verticalAlign: "bottom",
        },
        chart: { type: "line", backgroundColor: "transparent", height: 380 },
        title: { text: undefined },
        legend: { enabled: true, itemStyle: { color: getCssColor("text-default-grey") } },
        xAxis: {
            categories: YEAR_LABELS,
            labels: { style: { color: getCssColor("text-default-grey") } },
            lineColor: getCssColor("border-default-grey"),
            tickColor: getCssColor("border-default-grey"),
        },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: undefined },
            labels: { format: "{value}%", style: { color: getCssColor("text-default-grey") } },
            gridLineColor: getCssColor("border-default-grey"),
        },
        plotOptions: {
            line: { marker: { enabled: true, radius: 4 } },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            borderRadius: 0,
            shape: "square",
            backgroundColor: getCssColor("background-overlap-grey"),
            borderColor: getCssColor("border-default-grey"),
            style: { color: getCssColor("text-title-grey") },
            formatter() {
                const ctx = this as any;
                const rows = (ctx.points || [])
                    .map(
                        (p: any) =>
                            `<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;"><span style="color:${p.series.color};">■ ${p.series.name}</span><span style="font-weight:700;">${(p.y as number).toFixed(1)}%</span></div>`,
                    )
                    .join("");
                return `<div style="padding:8px 12px;min-width:180px;"><div style="font-weight:700;margin-bottom:6px;">${ctx.points?.[0]?.key ?? ctx.x}</div>${rows}</div>`;
            },
        },
        series: profiles.map((profile, index) => ({
            name: `Profil ${profile.badge}`,
            color: getCssColor(PROFILE_COLOR_TOKENS[profile.badge]),
            dashStyle: index === 1 ? "Dash" : index === 2 ? "Dot" : "Solid",
            data: profile.series ?? RELATIVE_YEARS.map(() => null),
        })),
    } as any));
}

interface ProfileStackInput {
    badge: ProfileBadge;
    dipl?: number;
    nonDipl?: number;
}

export function createProfilesDiplomaStackOptions(profiles: ProfileStackInput[]) {
    const categories = profiles.map((p) => `Profil ${p.badge}`);
    const diplData = profiles.map((p) => {
        const tot = (p.dipl ?? 0) + (p.nonDipl ?? 0);
        return tot ? ((p.dipl ?? 0) / tot) * 100 : 0;
    });
    const nonDiplData = profiles.map((p) => {
        const tot = (p.dipl ?? 0) + (p.nonDipl ?? 0);
        return tot ? ((p.nonDipl ?? 0) / tot) * 100 : 0;
    });

    return createChartOptions("column", ({
        accessibility: { enabled: false },
        caption: {
            align: "left",
            style: { color: "var(--text-mention-grey)", fontSize: "11px" },
            text: "Source : MESRE-SIES.",
            verticalAlign: "bottom",
        },
        chart: { type: "column", backgroundColor: "transparent", height: 320 },
        title: { text: " " },
        legend: { enabled: true, itemStyle: { color: getCssColor("text-default-grey") } },
        xAxis: {
            categories,
            labels: { style: { color: getCssColor("text-default-grey") } },
        },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: undefined },
            labels: { format: "{value}%", style: { color: getCssColor("text-default-grey") } },
            gridLineColor: getCssColor("border-default-grey"),
        },
        plotOptions: {
            column: {
                stacking: "percent",
                borderWidth: 0,
                dataLabels: {
                    enabled: true,
                    format: "{point.y:.0f}%",
                    style: { color: "white", textOutline: "none", fontWeight: "600" },
                },
            },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter() {
                const ctx = this as any;
                const rows = (ctx.points || [])
                    .map((p: any) => `<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;"><span style="color:${p.series.color};">■ ${p.series.name}</span><span style="font-weight:700;">${p.y.toFixed(1)}%</span></div>`)
                    .join("");
                return `<div style="padding:8px 12px;min-width:220px;"><div style="font-weight:700;margin-bottom:6px;">${ctx.points?.[0]?.key ?? ctx.x}</div>${rows}</div>`;
            },
        },
        series: [
            {
                name: "Diplômés du supérieur",
                color: getCssColor("outcomes-m1"),
                data: diplData,
            },
            {
                name: "Sortants sans diplôme",
                color: getCssColor("outcomes-sortants-non-diplomes"),
                data: nonDiplData,
            },
        ],
    } as any));
}
