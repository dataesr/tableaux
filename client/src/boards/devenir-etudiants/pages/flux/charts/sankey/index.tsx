import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import "../../../../colors.scss";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import Callout from "../../../../../../components/callout";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../utils/colors";
import { type OutcomesFilterField, type OutcomesFluxLink, useOutcomesFlux } from "../../../../api";
import { createSankeyOptions, SITUATION_ORDER } from "./options";

interface SankeyChartProps {
    exportMetadata?: {
        filtersText?: string;
        sourceText?: string;
    };
    hideTitle?: boolean;
    links?: OutcomesFluxLink[];
    totalStudents?: number;
}

const DEFAULT_COHORT_YEAR = "2019-2020";
const DEFAULT_COHORT_SITUATION = "L1";
const DEFAULT_MIN_VALUE = 100;
const MIN_MIN_VALUE = 1;
const DEFAULT_RELATIVE_YEARS = [0, 1, 2, 3, 4];
const ALLOWED_RELATIVE_YEARS = new Set(DEFAULT_RELATIVE_YEARS);

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

function parseRelativeYears(value: string | null): number[] {
    if (!value) return DEFAULT_RELATIVE_YEARS;

    const parsed = value
        .split(",")
        .map((item) => Number.parseInt(item, 10))
        .filter((year) => Number.isInteger(year) && ALLOWED_RELATIVE_YEARS.has(year));

    return parsed.length > 0 ? parsed : DEFAULT_RELATIVE_YEARS;
}

function getSituationLabel(situation?: string) {
    if (!situation) return "Non renseigné";
    return SITUATION_LABELS[situation] || situation.replaceAll("_", " ");
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("fr-FR").format(value);
}

function formatPercent(value: number) {
    return `${new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }).format(value)} %`;
}

function getNodeKey(relativeYear: number, situation: string) {
    return `${relativeYear}__${situation}`;
}

function SankeyRenderData({ links, totalStudents = 0 }: { links: OutcomesFluxLink[]; totalStudents?: number }) {
    const incomingByNode = new Map<string, number>();
    const outgoingByNode = new Map<string, number>();

    links.forEach((link) => {
        const fromKey = getNodeKey(link.source_rel, link.source_situation);
        const toKey = getNodeKey(link.target_rel, link.target_situation);
        outgoingByNode.set(fromKey, (outgoingByNode.get(fromKey) || 0) + link.value);
        incomingByNode.set(toKey, (incomingByNode.get(toKey) || 0) + link.value);
    });

    const totalVisibleFlow = links.reduce((sum, link) => sum + (Number(link.value) || 0), 0);
    const totalBase = totalStudents > 0 ? totalStudents : totalVisibleFlow;

    const rows = [...links]
        .sort((a, b) => {
            if (a.source_rel !== b.source_rel) return a.source_rel - b.source_rel;
            if (a.target_rel !== b.target_rel) return a.target_rel - b.target_rel;
            return (a.target_situation || "").localeCompare(b.target_situation || "");
        })
        .map((link) => {
            const sourceKey = getNodeKey(link.source_rel, link.source_situation);
            const targetKey = getNodeKey(link.target_rel, link.target_situation);
            const outgoing = outgoingByNode.get(sourceKey) || 0;
            const incoming = incomingByNode.get(targetKey) || 0;
            const value = Number(link.value) || 0;

            return {
                incomingShare: incoming > 0 ? (value / incoming) * 100 : 0,
                outgoingShare: outgoing > 0 ? (value / outgoing) * 100 : 0,
                sourceLabel: getSituationLabel(link.source_situation),
                sourceYear: link.source_annee || `N+${link.source_rel}`,
                targetLabel: getSituationLabel(link.target_situation),
                targetYear: link.target_annee || `N+${link.target_rel}`,
                totalShare: totalBase > 0 ? (value / totalBase) * 100 : 0,
                value,
            };
        });

    if (!rows.length) {
        return <p className="fr-py-3w">Aucune donnée disponible pour le tableau.</p>;
    }

    return (
        <div className="fr-table fr-table--sm fr-table--bordered">
            <div className="fr-table__wrapper">
                <div className="fr-table__container">
                    <div className="fr-table__content">
                        <table id="outcomes-flux-sankey-data-table" style={{ width: "100%" }}>
                            <caption>Détail des flux entre situations et années universitaires</caption>
                            <thead>
                                <tr>
                                    <th>Année source</th>
                                    <th>Situation source</th>
                                    <th>Année cible</th>
                                    <th>Situation cible</th>
                                    <th>Effectif du flux</th>
                                    <th>Part des flux sortants source</th>
                                    <th>Part des flux entrants cible</th>
                                    <th>Part du total cohorte</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={`${row.sourceYear}-${row.sourceLabel}-${row.targetYear}-${row.targetLabel}-${index}`}>
                                        <td>{row.sourceYear}</td>
                                        <td>{row.sourceLabel}</td>
                                        <td>{row.targetYear}</td>
                                        <td>{row.targetLabel}</td>
                                        <td>{formatNumber(row.value)}</td>
                                        <td>{formatPercent(row.outgoingShare)}</td>
                                        <td>{formatPercent(row.incomingShare)}</td>
                                        <td>{formatPercent(row.totalShare)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SankeyChartView({
    exportMetadata,
    hideTitle,
    links,
    totalStudents = 0,
}: Required<Pick<SankeyChartProps, "links">> & Pick<SankeyChartProps, "exportMetadata" | "hideTitle" | "totalStudents">) {
    const [searchParams] = useSearchParams();
    const options = useMemo(() => {
        if (!links?.length) return null;
        const baseOptions = createSankeyOptions(links, totalStudents);
        const filtersText = exportMetadata?.filtersText?.trim();

        if (!filtersText) {
            return baseOptions;
        }

        return {
            ...baseOptions,
            exporting: {
                ...(baseOptions.exporting || {}),
                chartOptions: {
                    ...((baseOptions.exporting && (baseOptions.exporting as any).chartOptions) || {}),
                    subtitle: {
                        style: {
                            color: getCssColor("text-mention-grey"),
                            fontSize: "12px",
                        },
                        text: `Filtres : ${filtersText}`,
                        useHTML: true,
                    },
                },
            },
        };
    }, [exportMetadata?.filtersText, links, totalStudents]);

    const presentSituations = useMemo(() => {
        const set = new Set<string>();
        links.forEach((l) => {
            if (l.source_situation) set.add(l.source_situation);
            if (l.target_situation) set.add(l.target_situation);
        });
        return [...set].sort((a, b) => (SITUATION_ORDER[a] ?? 99) - (SITUATION_ORDER[b] ?? 99));
    }, [links]);

    if (!options) return null;

    const legend = (
        <div className="outcomes-flux-sankey__legend">
            {presentSituations.map((sit) => (
                <span key={sit} className="outcomes-flux-sankey__legend-item">
                    <span className={`outcomes-flux-sankey__legend-color outcomes-flux-sankey__legend-color--${sit}`} />
                    {SITUATION_LABELS[sit] || sit}
                </span>
            ))}
        </div>
    );

    return (
        <ChartWrapper
            hideTitle={hideTitle}
            legend={legend}
            config={{
                id: "outcomes-flux-sankey",
                integrationURL: `/integration?chart_id=outcomesFluxSankey&${searchParams.toString()}`,
                title: "Parcours des néo-bacheliers inscrits en L1 en 2019",
            }}
            options={options}
            renderData={() => <SankeyRenderData links={links} totalStudents={totalStudents} />}
        />
    );
}

function SankeyChartIntegration({ hideTitle }: Pick<SankeyChartProps, "hideTitle">) {
    const [searchParams] = useSearchParams();

    const filters: Partial<Record<OutcomesFilterField, string | null>> = {
        groupe_disciplinaire: searchParams.get("groupe_disciplinaire"),
        sexe: searchParams.get("sexe"),
        origine_sociale: searchParams.get("origine_sociale"),
        bac_type: searchParams.get("bac_type"),
        bac_mention: searchParams.get("bac_mention"),
        retard_scolaire: searchParams.get("retard_scolaire"),
        devenir_en_un_an: searchParams.get("devenir_en_un_an"),
        type_de_trajectoire: searchParams.get("type_de_trajectoire"),
    };

    const minValueParam = Number.parseInt(searchParams.get("min_value") || "", 10);
    const minValue = Number.isInteger(minValueParam)
        ? Math.max(MIN_MIN_VALUE, minValueParam)
        : DEFAULT_MIN_VALUE;

    const relativeYears = parseRelativeYears(searchParams.get("annee_rel"));

    const { data, error, isLoading } = useOutcomesFlux({
        cohorteAnnee: searchParams.get("cohorte_annee") || DEFAULT_COHORT_YEAR,
        cohorteSituation: searchParams.get("cohorte_situation") || DEFAULT_COHORT_SITUATION,
        filters,
        minValue,
        relativeYears,
    });

    if (isLoading) {
        return <DefaultSkeleton height="540px" />;
    }

    if (error) {
        return (
            <Callout colorFamily="pink-macaron" icon="fr-icon-error-warning-line" title="Erreur de chargement">
                Impossible de récupérer les flux pour cette cohorte.
            </Callout>
        );
    }

    if (!data?.links?.length) {
        return (
            <Callout title="Aucune transition visible" icon="fr-icon-information-line">
                Aucun flux ne dépasse le seuil d'affichage avec les filtres actuellement sélectionnés.
            </Callout>
        );
    }

    return <SankeyChartView hideTitle={hideTitle} links={data.links} totalStudents={data.totalStudents} />;
}

export default function SankeyChart({ exportMetadata, hideTitle, links, totalStudents = 0 }: SankeyChartProps) {
    if (links) {
        return <SankeyChartView exportMetadata={exportMetadata} hideTitle={hideTitle} links={links} totalStudents={totalStudents} />;
    }

    return <SankeyChartIntegration hideTitle={hideTitle} />;
}
