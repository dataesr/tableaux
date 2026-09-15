import { Col, Row, Title } from "@dataesr/dsfr-plus";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Callout from "../../../../../components/callout.tsx";
import ChartWrapper from "../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default";
import OutcomesFilterSelect from "../../../components/filter-select/index.tsx";
import { type OutcomesFilterField, useOutcomesPlusHautDiplome } from "../../../api";
import { createHeatmapOptions, type HeatmapCell } from "./options";

const { VITE_APP_SERVER_URL } = import.meta.env;

const COHORT_YEAR = "2019-2020";
const COHORT_SITUATION = "L1";
const STALE_TIME = 5 * 60 * 1000;

const AXIS_FIELDS: Array<{ field: OutcomesFilterField; label: string }> = [
    { field: "groupe_disciplinaire", label: "Groupe disciplinaire" },
    { field: "sexe", label: "Sexe" },
    { field: "origine_sociale", label: "Origine sociale" },
    { field: "bac_type", label: "Type de baccalauréat" },
    { field: "bac_mention", label: "Mention obtenue" },
    { field: "retard_scolaire", label: "Retard scolaire" },
];

const sigOf = (filters: Record<string, string>) =>
    Object.entries(filters).sort().map(([k, v]) => `${k}=${v}`).join("&");

async function fetchCell(filters: Record<string, string>): Promise<HeatmapCell> {
    const params = new URLSearchParams({ cohorte_annee: COHORT_YEAR, cohorte_situation: COHORT_SITUATION });
    Object.entries(filters).forEach(([k, v]) => params.append(k, v));
    const res = await fetch(`${VITE_APP_SERVER_URL}/outcomes/plus-haut-diplome?${params.toString()}`);
    if (!res.ok) throw new Error("Erreur récupération heatmap");
    const json = await res.json();
    const total = json?.totalStudents || 0;
    const dipl = json?.totals?.diplomes?.effectif || 0;
    return total ? { pct: (dipl / total) * 100, count: total, dipl } : null;
}

export default function HeatmapTab() {
    const [searchParams] = useSearchParams();
    const [vAxis, setVAxis] = useState<OutcomesFilterField>(
        (searchParams.get("v_axis") as OutcomesFilterField) ?? "origine_sociale"
    );
    const [hAxis, setHAxis] = useState<OutcomesFilterField>(
        (searchParams.get("h_axis") as OutcomesFilterField) ?? "bac_type"
    );

    const { data: baseData, isLoading: baseLoading } = useOutcomesPlusHautDiplome({
        cohorteAnnee: COHORT_YEAR, cohorteSituation: COHORT_SITUATION, filters: {},
    });

    const vOptions = baseData?.filterOptions?.[vAxis] ?? [];
    const hOptions = baseData?.filterOptions?.[hAxis] ?? [];
    const sameAxis = vAxis === hAxis;

    const filterSets = useMemo<Array<Record<string, string>>>(() => {
        if (sameAxis) return [];
        const sets: Record<string, Record<string, string>> = {};
        vOptions.forEach((v) => { sets[sigOf({ [vAxis]: v.key })] = { [vAxis]: v.key }; });
        hOptions.forEach((h) => { sets[sigOf({ [hAxis]: h.key })] = { [hAxis]: h.key }; });
        vOptions.forEach((v) => hOptions.forEach((h) => {
            const f = { [vAxis]: v.key, [hAxis]: h.key };
            sets[sigOf(f)] = f;
        }));
        return Object.values(sets);
    }, [sameAxis, vAxis, hAxis, vOptions, hOptions]);

    const queries = useQueries({
        queries: filterSets.map((filters) => ({
            queryKey: ["outcomes", "phd", "heatmap", COHORT_YEAR, COHORT_SITUATION, sigOf(filters)],
            queryFn: () => fetchCell(filters),
            staleTime: STALE_TIME,
        })),
    });

    const dataBySig = useMemo(() => {
        const m = new Map<string, HeatmapCell>();
        filterSets.forEach((f, i) => m.set(sigOf(f), queries[i]?.data ?? null));
        return m;
    }, [filterSets, queries]);

    const isLoading = baseLoading || (filterSets.length > 0 && queries.some((q) => q.isLoading));

    const ensembleTotal = baseData?.totalStudents || 0;
    const ensembleDipl = baseData?.totals?.diplomes?.effectif || 0;
    const ensemblePct = ensembleTotal ? (ensembleDipl / ensembleTotal) * 100 : 0;
    const ensembleCell: HeatmapCell = ensembleTotal
        ? { pct: ensemblePct, count: ensembleTotal, dipl: ensembleDipl }
        : null;
    const vAxisLabel = AXIS_FIELDS.find((f) => f.field === vAxis)?.label ?? "";
    const hAxisLabel = AXIS_FIELDS.find((f) => f.field === hAxis)?.label ?? "";

    type LabeledCell = { pct: number; count: number; dipl: number; vLabel: string; hLabel: string };
    const labeledValues: LabeledCell[] = [];
    vOptions.forEach((v) => hOptions.forEach((h) => {
        const c = dataBySig.get(sigOf({ [vAxis]: v.key, [hAxis]: h.key })) ?? null;
        if (c) labeledValues.push({ ...c, vLabel: v.label, hLabel: h.label });
    }));
    const minCell = labeledValues.reduce<LabeledCell | null>((a, c) => (!a || c.pct < a.pct ? c : a), null);
    const maxCell = labeledValues.reduce<LabeledCell | null>((a, c) => (!a || c.pct > a.pct ? c : a), null);

    const chartOptions = useMemo(() => {
        if (sameAxis || isLoading || labeledValues.length === 0) return null;
        return createHeatmapOptions({
            vOptions, hOptions,
            vAxisLabel, hAxisLabel,
            getCell: (vKey, hKey) => dataBySig.get(sigOf({ [vAxis]: vKey, [hAxis]: hKey })) ?? null,
            getRowMargin: (vKey) => dataBySig.get(sigOf({ [vAxis]: vKey })) ?? null,
            getColMargin: (hKey) => dataBySig.get(sigOf({ [hAxis]: hKey })) ?? null,
            ensemble: ensembleCell,
        });
    }, [sameAxis, isLoading, labeledValues.length, vAxisLabel, hAxisLabel, vOptions, hOptions, dataBySig, vAxis, hAxis, ensembleCell]);

    const renderAxisSelect = (
        label: string,
        value: OutcomesFilterField,
        excluded: OutcomesFilterField,
        onChange: (next: OutcomesFilterField) => void,
    ) => (
        <OutcomesFilterSelect
            label={label}
            options={AXIS_FIELDS.filter((f) => f.field !== excluded).map((f) => ({ key: f.field, label: f.label }))}
            selectedKey={value}
            emptyLabel="Choisir un axe"
            onSelect={(v) => { if (v) onChange(v as OutcomesFilterField); }}
        />
    );

    return (
        <Row gutters>
            <Col lg={4}>
                <section className="outcomes-flux-page__filters" aria-label="Axes du croisement">
                    <Title as="h2" look="h4" className="fr-mb-3w">Axes à croiser</Title>
                    <section className="outcomes-flux-page__filters-section">
                        {renderAxisSelect("Axe vertical", vAxis, hAxis, setVAxis)}
                        {renderAxisSelect("Axe horizontal", hAxis, vAxis, setHAxis)}
                    </section>
                </section>
            </Col>
            <Col lg={8}>
                <div className="outcomes-flux-page__content">
                    {!sameAxis && !isLoading && chartOptions && (
                        <Row gutters className="fr-mb-2w">
                            {([
                                { key: "max", label: "Taux le plus élevé", cell: maxCell },
                                { key: "min", label: "Taux le plus faible", cell: minCell },
                            ] as const).map(({ label, cell }) => {
                                const share = cell && ensembleTotal ? (cell.count / ensembleTotal) * 100 : null;
                                return (
                                    <Col key={label} xs={12} sm={4}>
                                        <div className="fr-tile fr-tile--sm fr-tile--no-icon">
                                            <div className="fr-tile__body">
                                                <p className="fr-text--sm fr-mb-0">{label}</p>
                                                <p className="fr-mb-0 outcomes-heatmap__stat-value">{cell ? `${cell.pct.toFixed(0)}%` : "—"}</p>
                                                {cell && <p className="fr-text--sm fr-mb-0">{cell.vLabel} × {cell.hLabel}</p>}
                                                {share !== null && <p className="fr-text--xs fr-mb-0 outcomes-heatmap__stat-note">{share.toFixed(0)}% des étudiants</p>}
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                            <Col xs={12} sm={4}>
                                <div className="fr-tile fr-tile--no-icon fr-tile--sm">
                                    <div className="fr-tile__body">
                                        <p className="fr-text--sm fr-mb-0">Plus grand écart</p>
                                        <p className="fr-mb-0 outcomes-heatmap__stat-value">{minCell && maxCell ? `${Math.round(maxCell.pct - minCell.pct)} pts` : "—"}</p>
                                        {minCell && maxCell && <p className="fr-text--xs fr-mb-0 outcomes-heatmap__stat-note">entre {maxCell.vLabel} × {maxCell.hLabel} et {minCell.vLabel} × {minCell.hLabel}</p>}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}

                    {sameAxis && (
                        <Callout colorFamily="pink-macaron" icon="fr-icon-information-line">
                            Sélectionnez deux axes différents pour visualiser le croisement.
                        </Callout>
                    )}

                    {!sameAxis && isLoading && <DefaultSkeleton height="320px" />}

                    {!sameAxis && !isLoading && chartOptions && (
                        <>
                            <Title as="h2" look="h5" className="fr-mb-3w">
                                {`${vAxisLabel} × ${hAxisLabel} — taux de diplômés dans le supérieur en 2023-2024 des néo-bacheliers inscrits en L1 en 2019`}
                            </Title>
                            <ChartWrapper
                                hideTitle
                                config={{
                                    id: "outcomes-croisements-heatmap",
                                    integrationURL: `/integration?chart_id=outcomesCroisementsHeatmap&v_axis=${vAxis}&h_axis=${hAxis}`,
                                    title: `${vAxisLabel} × ${hAxisLabel} — taux de diplômés dans le supérieur en 2023-2024 des néo-bacheliers inscrits en L1 en 2019`,
                                    readingKey: {
                                        fr: (
                                            <>
                                                {minCell && maxCell && minCell !== maxCell && (
                                                    ` parmi les néo-bacheliers inscrits en L1 en 2019, l'écart de diplomation dans le supérieur à 4 ans entre ${maxCell.vLabel} × ${maxCell.hLabel} (${maxCell.pct.toFixed(0)}%) et ${minCell.vLabel} × ${minCell.hLabel} (${minCell.pct.toFixed(0)}%) atteint ${Math.round(maxCell.pct - minCell.pct)} points. Sur l'ensemble de la cohorte, ${ensemblePct.toFixed(0)}% sont diplômés de l'enseignement supérieur.`
                                                )}
                                            </>
                                        ),
                                    },
                                }}
                                options={chartOptions}
                            />
                        </>
                    )}
                </div>
            </Col>
        </Row>
    );
}
