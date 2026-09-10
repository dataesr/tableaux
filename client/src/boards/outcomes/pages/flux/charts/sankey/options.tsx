import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options";
import { getCssColor } from "../../../../../../utils/colors";
import { type OutcomesFluxLink } from "../../../../api";

function resolveTokenColor(token: string) {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return getCssColor(token);
    }

    const probe = document.createElement("span");
    probe.style.color = `var(--${token})`;
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    document.body.appendChild(probe);
    const resolved = window.getComputedStyle(probe).color;
    document.body.removeChild(probe);

    if (!resolved || resolved === "rgb(0, 0, 0)") {
        return getCssColor(token);
    }
    return resolved;
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
    SIT13: "Sortants",
};

export const SITUATION_COLOR_KEYS: Record<string, string> = {
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
    SIT13: "outcomes-sortants-diplomes",
};

const SITUATION_YEAR_LEVEL: Record<string, string> = {
    SIT01: "1re année",
    SIT02: "2e année",
    SIT03: "3e année",
    SIT04: "4e année",
    SIT05: "5e année",
    SIT06: "1re/2e année",
    SIT07: "1re/2e année",
    SIT08: "1re/2e année",
    SIT09: "3e année",
};

export const SITUATION_ORDER: Record<string, number> = {
    SIT05: 0,  // M2
    SIT04: 1,  // M1
    SIT03: 2,  // L3
    SIT09: 3,  // LP
    SIT02: 4,  // L2
    SIT01: 5,  // L1
    SIT07: 6,  // CPGE
    SIT11: 7,  // Écoles
    SIT08: 8,  // IUT
    SIT06: 9,  // STS
    SIT10: 10, // Cursus santé
    SIT12: 11, // Autres formations
    SIT13: 12, // Sortants
};

const YEAR_LABELS: Record<number, string> = {
    0: "2019-2020",
    1: "2020-2021",
    2: "2021-2022",
    3: "2022-2023",
    4: "2023-2024",
};

function getSituationLabel(situation?: string) {
    if (!situation) return "Non renseigné";
    return SITUATION_LABELS[situation] || situation.replaceAll("_", " ");
}

function getNodeId(relativeYear: number, situation: string) {
    return `N+${relativeYear}__${situation}`;
}

function normalizeRelativeYear(value: unknown): number | null {
    if (Number.isInteger(value)) return value as number;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function buildNodes(
    links: OutcomesFluxLink[],
    yearToColumnIndex: Map<number, number>
) {
    const seen = new Set<string>();
    const nodes: Array<{
        color: string;
        column: number;
        custom: { relativeYear: number };
        id: string;
        name: string;
    }> = [];

    links.forEach((link) => {
        [
            { rel: link.source_rel, situation: link.source_situation },
            { rel: link.target_rel, situation: link.target_situation },
        ].forEach(({ rel, situation }) => {
            const normalizedRel = normalizeRelativeYear(rel);
            if (normalizedRel === null || !situation) return;
            const visualColumn = yearToColumnIndex.get(normalizedRel);
            if (visualColumn === undefined) return;

            const id = getNodeId(normalizedRel, situation);
            if (seen.has(id)) return;

            seen.add(id);
            nodes.push({
                color: resolveTokenColor(SITUATION_COLOR_KEYS[situation] || "scale-3"),
                column: visualColumn,
                custom: { relativeYear: normalizedRel },
                id,
                name: getSituationLabel(situation),
            });
        });
    });

    return nodes;
}

function buildSeriesData(links: OutcomesFluxLink[]) {
    return links
        .map((link) => {
            const sourceRel = normalizeRelativeYear(link.source_rel);
            const targetRel = normalizeRelativeYear(link.target_rel);

            if (
                sourceRel === null ||
                targetRel === null ||
                !link.source_situation ||
                !link.target_situation
            ) {
                return null;
            }

            return {
                color: resolveTokenColor(SITUATION_COLOR_KEYS[link.source_situation] || "scale-3"),
                from: getNodeId(sourceRel, link.source_situation),
                to: getNodeId(targetRel, link.target_situation),
                weight: link.value,
            };
        })
        .filter((item): item is { color: string; from: string; to: string; weight: number } => item !== null);
}

function sortLinks(links: OutcomesFluxLink[]): OutcomesFluxLink[] {
    return [...links].sort((a, b) => {
        const sourceRelA = normalizeRelativeYear(a.source_rel) ?? 999;
        const sourceRelB = normalizeRelativeYear(b.source_rel) ?? 999;
        if (sourceRelA !== sourceRelB) return sourceRelA - sourceRelB;
        const orderA = SITUATION_ORDER[a.target_situation] ?? 99;
        const orderB = SITUATION_ORDER[b.target_situation] ?? 99;
        return orderA - orderB;
    });
}

function formatPercent(value: number) {
    return `${new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }).format(value)}%`;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("fr-FR").format(value);
}

export function createSankeyOptions(links: OutcomesFluxLink[], totalStudents = 0) {
    const sorted = sortLinks(links);
    const seriesData = buildSeriesData(sorted);
    const usedYears = Array.from(
        new Set(
            sorted.flatMap((link) => {
                const years: number[] = [];
                const sourceRel = normalizeRelativeYear(link.source_rel);
                const targetRel = normalizeRelativeYear(link.target_rel);
                if (sourceRel !== null) years.push(sourceRel);
                if (targetRel !== null) years.push(targetRel);
                return years;
            })
        )
    ).sort((a, b) => a - b);
    const yearToColumnIndex = new Map<number, number>(
        usedYears.map((year, index) => [year, index])
    );
    const columnIndexToYear = new Map<number, number>(
        usedYears.map((year, index) => [index, year])
    );
    const nodes = buildNodes(sorted, yearToColumnIndex);
    const usedColumns = Array.from(new Set(nodes.map((node) => node.column))).sort((a, b) => a - b);
    const nodeNames = new Map<string, string>(nodes.map((node) => [node.id, node.name]));
    const nodeColors = new Map<string, string>(nodes.map((node) => [node.id, node.color]));
    const nodeSituations = new Map<string, string>();
    sorted.forEach((link) => {
        const sRel = normalizeRelativeYear(link.source_rel);
        const tRel = normalizeRelativeYear(link.target_rel);
        if (sRel !== null && link.source_situation) {
            nodeSituations.set(getNodeId(sRel, link.source_situation), link.source_situation);
        }
        if (tRel !== null && link.target_situation) {
            nodeSituations.set(getNodeId(tRel, link.target_situation), link.target_situation);
        }
    });
    const incomingByNode = new Map<string, number>();
    const outgoingByNode = new Map<string, number>();
    const incomingBreakdownByNode = new Map<string, Map<string, number>>();
    const outgoingBreakdownByNode = new Map<string, Map<string, number>>();

    seriesData.forEach((item) => {
        incomingByNode.set(item.to, (incomingByNode.get(item.to) || 0) + item.weight);
        outgoingByNode.set(item.from, (outgoingByNode.get(item.from) || 0) + item.weight);

        const incomingBreakdown = incomingBreakdownByNode.get(item.to) || new Map<string, number>();
        incomingBreakdown.set(item.from, (incomingBreakdown.get(item.from) || 0) + item.weight);
        incomingBreakdownByNode.set(item.to, incomingBreakdown);

        const outgoingBreakdown = outgoingBreakdownByNode.get(item.from) || new Map<string, number>();
        outgoingBreakdown.set(item.to, (outgoingBreakdown.get(item.to) || 0) + item.weight);
        outgoingBreakdownByNode.set(item.from, outgoingBreakdown);
    });

    const totalVisibleFlow = seriesData.reduce((sum, item) => sum + item.weight, 0);
    const totalStudentsBase = totalStudents > 0 ? totalStudents : totalVisibleFlow;

    return createChartOptions("sankey" as any, ({
        chart: {
            height: 800,
            backgroundColor: "transparent",
            spacingBottom: 100,

            spacingLeft: 24,
            spacingRight: 24,
            events: {
                render() {
                    const chart = this as any;
                    const sankeySeries = chart?.series?.find((serie: any) => serie.type === "sankey");

                    if (chart.outcomesYearLabelsGroup) {
                        chart.outcomesYearLabelsGroup.destroy();
                        chart.outcomesYearLabelsGroup = null;
                    }

                    if (!sankeySeries?.nodes?.length) return;

                    const group = chart.renderer.g("outcomes-year-labels").add();
                    const y = chart.plotTop + chart.plotHeight + 10;
                    const viewportPadding = 12;
                    const minCenterX = chart.plotLeft + 12;
                    const maxCenterX = chart.plotLeft + chart.plotWidth - 12;
                    const viewportMinX = viewportPadding;
                    const viewportMaxX = chart.chartWidth - viewportPadding;

                    usedColumns.forEach((columnIndex) => {
                        const yearNodes = sankeySeries.nodes
                            .filter((node: any) => node?.column === columnIndex && node?.shapeArgs)
                            .map((node: any) => node.shapeArgs.x + node.shapeArgs.width / 2);

                        if (!yearNodes.length) return;

                        const x = yearNodes.reduce((sum: number, value: number) => sum + value, 0) / yearNodes.length;
                        const relativeYear = columnIndexToYear.get(columnIndex);
                        const baseX = Math.max(minCenterX, Math.min(maxCenterX, x));

                        const textEl = chart.renderer
                            .text(
                                typeof relativeYear === "number"
                                    ? YEAR_LABELS[relativeYear] || `N+${relativeYear}`
                                    : `N+${columnIndex}`,
                                baseX,
                                y
                            )
                            .css({
                                color: resolveTokenColor("text-title-grey"),
                                fontSize: "12px",
                                fontWeight: "600",
                            })
                            .attr({ align: "center", zIndex: 5 })
                            .add(group);

                        const box = textEl.getBBox();
                        const halfWidth = box.width / 2;
                        const clampedX = Math.max(
                            viewportMinX + halfWidth,
                            Math.min(viewportMaxX - halfWidth, baseX)
                        );
                        if (Math.abs(clampedX - baseX) > 0.1) {
                            textEl.attr({ x: clampedX });
                        }
                    });

                    chart.outcomesYearLabelsGroup = group;
                },
            },
        },
        accessibility: {
            description: "Diagramme de flux (Sankey) reliant, d'une année à l'autre de 2019 à 2024, les situations d'études des néo-bacheliers inscrits en L1 en 2019.",
            point: {
                valueDescriptionFormat: "{index}. {point.fromNode.name} vers {point.toNode.name}, {point.weight} étudiants.",
            },
        },
        caption: {
            align: "left",
            style: {
                color: resolveTokenColor("text-mention-grey"),
                fontSize: "11px",
            },
            text: "Source : MESRE-SIES.",
            verticalAlign: "bottom",
        },
        credits: { enabled: false },
        exporting: { enabled: false },
        plotOptions: {
            sankey: {
                borderColor: resolveTokenColor("border-default-grey"),
                borderWidth: 1,
                dataLabels: {
                    enabled: true,
                    nodeFormatter() {
                        return (this as any).point.name;
                    },
                    style: {
                        color: resolveTokenColor("text-title-grey"),
                        fontWeight: "600",
                        textOutline: "none",
                    },
                },
                inactiveOtherPoints: false,
                linkOpacity: 0.5,
                minLinkWidth: 1,
                nodeAlignment: "left",
                nodePadding: 10,
                nodeWidth: 50,
            },
        },
        series: [
            {
                data: seriesData,
                nodes,
                type: "sankey",
            },
        ],
        title: {
            text: "Parcours des néo-bacheliers inscrits en L1 en 2019 (diagramme de flux)",
            style: { display: "none" },
        },
        tooltip: {
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
                const p = (this as any).point;
                const isNode = !p.from && !p.to;

                const colorTitle = resolveTokenColor("text-title-grey");
                const colorMention = resolveTokenColor("text-mention-grey");
                const colorBorder = resolveTokenColor("border-default-grey");
                const colorBgAlt = resolveTokenColor("background-alt-grey");
                const colorTagBg = resolveTokenColor("background-contrast-grey");

                if (isNode) {
                    const relativeYear = Number(
                        p?.options?.custom?.relativeYear ??
                        p?.custom?.relativeYear ??
                        columnIndexToYear.get(Number(p.column))
                    );
                    const yearLabel = Number.isFinite(relativeYear)
                        ? YEAR_LABELS[relativeYear] || `N+${relativeYear}`
                        : `N+${p.column}`;

                    const nodeId = String(p.id || "");
                    const situation = nodeSituations.get(nodeId) || "";
                    const yearLevelTag = SITUATION_YEAR_LEVEL[situation] || "";
                    const nodeColor = nodeColors.get(nodeId) || resolveTokenColor("text-title-grey");

                    const incoming = incomingByNode.get(nodeId) || 0;
                    const outgoing = outgoingByNode.get(nodeId) || 0;
                    const nodeTotal = Math.max(incoming, outgoing);
                    const nodePart = totalStudentsBase > 0 ? (nodeTotal / totalStudentsBase) * 100 : 0;

                    const isSink = !outgoing && incoming > 0;
                    const isSource = !incoming && outgoing > 0;

                    const buildBreakdown = (
                        breakdown: Array<[string, number]>,
                        total: number,
                        kind: "in" | "out"
                    ) => {
                        if (!total) return "";
                        const MAX_ITEMS = 4;
                        const top = breakdown.slice(0, MAX_ITEMS);
                        const rest = breakdown.slice(MAX_ITEMS);
                        const restSum = rest.reduce((sum, [, value]) => sum + value, 0);

                        const renderRow = (label: string, value: number, color: string) => {
                            const pct = (value / total) * 100;
                            const pctClamped = Math.max(0, Math.min(100, pct));
                            return `
                                <div style="margin-top:6px;">
                                    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12px;color:${colorTitle};">
                                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${label}</span>
                                        <span style="font-weight:700;flex-shrink:0;">${formatPercent(pct)}</span>
                                    </div>
                                    <div style="margin-top:3px;height:2px;background:${colorBgAlt};">
                                        <div style="width:${pctClamped}%;height:100%;background:${color};"></div>
                                    </div>
                                </div>
                            `;
                        };

                        const rows = top
                            .map(([otherId, value]) => {
                                const otherSituation = nodeSituations.get(otherId) || "";
                                const otherColor = nodeColors.get(otherId) || colorTitle;
                                const sameSituation = otherSituation === situation && otherSituation !== "";
                                const baseLabel = nodeNames.get(otherId) || otherId;
                                const shortLabel = otherSituation === "SIT11"
                                    ? "Écoles ingé./com."
                                    : baseLabel;
                                const label = sameSituation
                                    ? `${baseLabel} redoubl.`
                                    : kind === "out" && otherSituation === "SIT13"
                                        ? "Sortants"
                                        : shortLabel;
                                return renderRow(label, value, otherColor);
                            })
                            .join("");

                        const restRow = rest.length > 0
                            ? renderRow(`Autres (${rest.length})`, restSum, colorMention)
                            : "";

                        return rows + restRow;
                    };

                    const incomingBreakdown = Array.from((incomingBreakdownByNode.get(nodeId) || new Map()).entries())
                        .sort((a, b) => b[1] - a[1]);
                    const outgoingBreakdown = Array.from((outgoingBreakdownByNode.get(nodeId) || new Map()).entries())
                        .sort((a, b) => b[1] - a[1]);

                    const headerTag = yearLevelTag
                        ? `<span style="background:${colorTagBg};color:${colorTitle};font-size:11px;font-weight:500;padding:2px 8px;line-height:1.4;">${yearLevelTag}</span>`
                        : "";

                    const headerRow = `
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="display:inline-block;width:10px;height:10px;background:${nodeColor};"></span>
                                <span style="color:${colorTitle};font-size:13px;font-weight:500;">${p.name}<span style="color:${colorMention};"> · ${yearLabel}</span></span>
                            </div>
                            ${headerTag}
                        </div>
                    `;

                    const totalRow = `
                        <div style="margin-top:12px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;">
                            <span style="font-size:22px;font-weight:700;color:${colorTitle};">${formatNumber(nodeTotal)}</span>
                            <span style="font-size:13px;color:${colorMention};">étudiants</span>
                            <span style="margin-left:auto;font-size:13px;color:${colorMention};">${formatPercent(nodePart)} de la cohorte</span>
                        </div>
                    `;

                    const showIncoming = !isSource && incomingBreakdown.length > 0;
                    const showOutgoing = !isSink && outgoingBreakdown.length > 0;
                    const twoCols = showIncoming && showOutgoing;

                    const columnTitleStyle = `font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${colorMention};margin-bottom:4px;`;

                    const columns = `
                        <div style="margin-top:10px;display:flex;gap:16px;">
                            ${showIncoming ? `
                                <div style="flex:1;min-width:0;">
                                    <div style="${columnTitleStyle}">&#8592; D'où ils viennent</div>
                                    ${buildBreakdown(incomingBreakdown, incoming, "in")}
                                </div>
                            ` : ""}
                            ${showOutgoing ? `
                                <div style="flex:1;min-width:0;">
                                    <div style="${columnTitleStyle}">Où ils vont &#8594;</div>
                                    ${buildBreakdown(outgoingBreakdown, outgoing, "out")}
                                </div>
                            ` : ""}
                        </div>
                    `;

                    const tooltipWidth = twoCols ? 360 : 240;

                    return `
                        <div style="padding:12px 14px;width:${tooltipWidth}px;border-top:3px solid ${nodeColor};box-sizing:border-box;">
                            ${headerRow}
                            ${totalRow}
                            ${(showIncoming || showOutgoing) ? `<div style="margin-top:10px;border-top:1px solid ${colorBorder};"></div>` : ""}
                            ${columns}
                        </div>
                    `;
                }

                const weight = Number(p.weight) || 0;
                const incoming = incomingByNode.get(String(p.to || "")) || 0;
                const outgoing = outgoingByNode.get(String(p.from || "")) || 0;
                const shareOfIncoming = incoming > 0 ? (weight / incoming) * 100 : 0;
                const shareOfOutgoing = outgoing > 0 ? (weight / outgoing) * 100 : 0;
                const shareOfVisible = totalStudentsBase > 0 ? (weight / totalStudentsBase) * 100 : 0;
                const fromColor = nodeColors.get(String(p.from || "")) || colorTitle;
                const toColor = nodeColors.get(String(p.to || "")) || colorTitle;

                return `
                    <div style="padding:16px;min-width:260px;max-width:380px;">
                        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:${colorTitle};">
                            <span style="display:inline-block;width:10px;height:10px;background:${fromColor};"></span>
                            <span style="font-weight:600;">${p.fromNode.name}</span>
                            <span style="color:${colorMention};">&#8594;</span>
                            <span style="display:inline-block;width:10px;height:10px;background:${toColor};"></span>
                            <span style="font-weight:600;">${p.toNode.name}</span>
                        </div>
                        <div style="margin-top:12px;display:flex;align-items:baseline;gap:8px;">
                            <span style="font-size:22px;font-weight:700;color:${colorTitle};">${formatNumber(weight)}</span>
                            <span style="font-size:13px;color:${colorMention};">étudiants</span>
                        </div>
                        <div style="margin-top:12px;border-top:1px solid ${colorBorder};padding-top:10px;display:grid;grid-template-columns:1fr auto;gap:6px 16px;font-size:12px;">
                            <span style="color:${colorMention};">Part des sortants de ${p.fromNode.name}</span>
                            <span style="color:${colorTitle};font-weight:700;">${formatPercent(shareOfOutgoing)}</span>
                            <span style="color:${colorMention};">Part des entrants de ${p.toNode.name}</span>
                            <span style="color:${colorTitle};font-weight:700;">${formatPercent(shareOfIncoming)}</span>
                            <span style="color:${colorMention};">Part de la cohorte</span>
                            <span style="color:${colorTitle};font-weight:700;">${formatPercent(shareOfVisible)}</span>
                        </div>
                    </div>
                `;
            },
        },
    } as any));
}
