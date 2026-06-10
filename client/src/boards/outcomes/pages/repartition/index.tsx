import { Button, Col, Container, DismissibleTag, Row, TagGroup, Title } from "@dataesr/dsfr-plus";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default";
import ChartWrapper from "../../../../components/chart-wrapper";
import Callout from "../../../../components/callout.tsx";
import { type OutcomesFilterField, useOutcomesRepartition } from "../../api";
import OutcomesFilterSelect from "../../components/filter-select/index.tsx";
import OutcomesDefinitionsTable from "../../components/definitions-table/index.tsx";
import { OUTCOMES_DEFINITIONS } from "../../components/definitions-table/data.tsx";
import RepartitionChart from "./charts/repartition-column";
import YearRangeSlider from "../../components/year-range-slider/index.tsx";

const DEFAULT_COHORT_YEAR = "2019-2020";
const DEFAULT_COHORT_SITUATION = "SIT01";
const ALL_RELATIVE_YEARS = [0, 1, 2, 3, 4];
const DEFAULT_YEAR_START = 0;
const DEFAULT_YEAR_END = 4;
const YEAR_LABELS: Record<number, string> = {
    0: "2019-2020 (N+0)",
    1: "2020-2021 (N+1)",
    2: "2021-2022 (N+2)",
    3: "2022-2023 (N+3)",
    4: "2023-2024 (N+4)",
};

const FILTER_FIELDS: OutcomesFilterField[] = [
    "groupe_disciplinaire",
    "sexe",
    "origine_sociale",
    "bac_type",
    "bac_mention",
    "retard_scolaire",
    "devenir_en_un_an",
    "type_de_trajectoire",
];

const FILTER_SECTIONS: Array<{
    title: string;
    fields: Array<{ field: OutcomesFilterField; label: string }>;
}> = [
        {
            title: "Discipline d'inscription",
            fields: [{ field: "groupe_disciplinaire", label: "Groupe disciplinaire" }],
        },
        {
            title: "Caractéristiques de l'étudiant",
            fields: [
                { field: "sexe", label: "Sexe" },
                { field: "origine_sociale", label: "Origine sociale" },
            ],
        },
        {
            title: "Informations sur le baccalauréat",
            fields: [
                { field: "bac_type", label: "Type" },
                { field: "bac_mention", label: "Mention obtenue" },
                { field: "retard_scolaire", label: "Retard scolaire" },
            ],
        },
        {
            title: "Parcours spécifiques",
            fields: [
                { field: "devenir_en_un_an", label: "Devenir en un an" },
                { field: "type_de_trajectoire", label: "Parcours types" },
            ],
        },
    ];

export default function RepartitionPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const filters = {
        groupe_disciplinaire: searchParams.get("groupe_disciplinaire"),
        sexe: searchParams.get("sexe"),
        origine_sociale: searchParams.get("origine_sociale"),
        bac_type: searchParams.get("bac_type"),
        bac_mention: searchParams.get("bac_mention"),
        retard_scolaire: searchParams.get("retard_scolaire"),
        devenir_en_un_an: searchParams.get("devenir_en_un_an"),
        type_de_trajectoire: searchParams.get("type_de_trajectoire"),
    };

    const cohortYear = searchParams.get("cohorte_annee") || DEFAULT_COHORT_YEAR;
    const cohortSituation = searchParams.get("cohorte_situation") || DEFAULT_COHORT_SITUATION;

    const { yearEnd, yearStart } = useMemo(() => {
        const raw = searchParams.get("annee_rel");
        if (!raw) return { yearEnd: DEFAULT_YEAR_END, yearStart: DEFAULT_YEAR_START };
        const parsed = raw.split(",").map(Number).filter((n) => ALL_RELATIVE_YEARS.includes(n));
        if (parsed.length < 1) return { yearEnd: DEFAULT_YEAR_END, yearStart: DEFAULT_YEAR_START };
        const minYear = Math.max(DEFAULT_YEAR_START, Math.min(DEFAULT_YEAR_END, Math.min(...parsed)));
        const maxYear = Math.max(minYear, Math.min(DEFAULT_YEAR_END, Math.max(...parsed)));
        return { yearEnd: maxYear, yearStart: minYear };
    }, [searchParams]);

    const relativeYears = useMemo(() => {
        const result: number[] = [];
        for (let y = yearStart; y <= yearEnd; y += 1) result.push(y);
        return result;
    }, [yearStart, yearEnd]);

    const { data, error, isLoading } = useOutcomesRepartition({
        cohorteAnnee: cohortYear,
        cohorteSituation: cohortSituation,
        filters,
        relativeYears,
    });

    const activeFiltersElement = (() => {
        const tags = FILTER_SECTIONS.flatMap(s =>
            s.fields.filter(f => filters[f.field]).map(f => {
                const value = filters[f.field]!;
                const option = data?.filterOptions?.[f.field]?.find((o) => o.key === value);
                return { field: f.field, label: f.label, valueLabel: option?.label ?? value };
            })
        );
        if (!tags.length) return null;
        return (
            <TagGroup className="fr-mt-1w fr-mb-1w">
                {tags.map(({ field, label, valueLabel }) => (
                    <DismissibleTag key={field} size="sm" onClick={() => updateFilter(field, null)}>{label} : {valueLabel}</DismissibleTag>
                ))}
            </TagGroup>
        );
    })();

    const updateFilter = (field: OutcomesFilterField, value: string | null) => {
        const nextParams = new URLSearchParams(searchParams);
        if (value) {
            nextParams.set(field, value);
        } else {
            nextParams.delete(field);
        }
        setSearchParams(nextParams);
    };

    const resetFilters = () => {
        const nextParams = new URLSearchParams(searchParams);
        FILTER_FIELDS.forEach((field) => nextParams.delete(field));
        nextParams.delete("annee_rel");
        setSearchParams(nextParams);
    };

    const updateYearRange = (start: number, end: number) => {
        const safeStart = Math.max(DEFAULT_YEAR_START, Math.min(DEFAULT_YEAR_END, start));
        const safeEnd = Math.max(safeStart, Math.min(DEFAULT_YEAR_END, end));
        const nextParams = new URLSearchParams(searchParams);
        const isAll = safeStart === DEFAULT_YEAR_START && safeEnd === DEFAULT_YEAR_END;
        if (isAll) {
            nextParams.delete("annee_rel");
        } else {
            const list: number[] = [];
            for (let y = safeStart; y <= safeEnd; y += 1) list.push(y);
            nextParams.set("annee_rel", list.join(","));
        }
        setSearchParams(nextParams);
    };
    return (
        <Container className="outcomes-section-page outcomes-flux-page">
            <Row gutters>
                <Col>
                    <Callout className="fr-mb-2w" colorFamily="pink-tuile" icon="fr-icon-alert-line">
                        Version sous embargo à ne pas diffuser
                    </Callout>
                </Col>
            </Row>
            <Row>
                <Title as="h1" look="h4" className="fr-mb-3w">
                    Parcours des néo-bacheliers inscrits en L1 en 2019
                </Title>
            </Row>
            <Row gutters>
                <Col lg={4}>
                    <section className="outcomes-flux-page__filters" aria-label="Filtres du graphique de répartition">
                        <Title as="h2" look="h4" className="fr-mb-3w">Filtres à sélectionner</Title>
                        {FILTER_SECTIONS.map((section) => (
                            <section key={section.title} className="outcomes-flux-page__filters-section">
                                <Title as="h3" look="h5" className="fr-mb-2w">{section.title}</Title>
                                {section.fields.map(({ field, label }) => (
                                    <OutcomesFilterSelect
                                        key={field}
                                        label={label}
                                        options={data?.filterOptions?.[field] || []}
                                        selectedKey={filters[field]}
                                        onSelect={(value) => updateFilter(field, value)}
                                    />
                                ))}
                            </section>
                        ))}
                        <Button title="Réinitialiser les filtres" className="fr-mt-3w" onClick={resetFilters}>Réinitialiser les filtres</Button>
                    </section>
                </Col>
                <Col lg={8}>
                    <div className="outcomes-flux-page__content">
                        <ChartWrapper.Title config={{ id: "outcomes-repartition", title: { fr: "Répartition des néo-bacheliers inscrits en L1 en 2019 selon les inscriptions par année (en %)", look: "h4" as const } }} />
                        {isLoading && <DefaultSkeleton height="540px" />}
                        {!isLoading && error && (
                            <Callout colorFamily="pink-macaron" icon="fr-icon-error-warning-line" title="Erreur de chargement">
                                Impossible de récupérer les données de répartition pour cette cohorte.
                            </Callout>
                        )}
                        {!isLoading && !error && data && !data.distribution?.length && (
                            <Callout title="Aucune donnée" icon="fr-icon-information-line">
                                Aucune donnée disponible avec les filtres actuellement sélectionnés.
                            </Callout>
                        )}
                        {activeFiltersElement}
                        {!isLoading && !error && (data?.distribution?.length ?? 0) > 0 && (
                            <RepartitionChart hideTitle />
                        )}

                        <div className="fr-mt-3w outcomes-flux-page__params outcomes-flux-page__params--after-chart">
                            <Title as="h2" look="h5" className="fr-mb-2w">Paramètres pour la répartition</Title>
                            <Row gutters>
                                <Col>
                                    <YearRangeSlider
                                        id="repartition-year-range"
                                        label="Années à analyser"
                                        hint={`Sélection continue obligatoire entre ${YEAR_LABELS[DEFAULT_YEAR_START]} et ${YEAR_LABELS[DEFAULT_YEAR_END]}.`}
                                        min={DEFAULT_YEAR_START}
                                        max={DEFAULT_YEAR_END}
                                        start={yearStart}
                                        end={yearEnd}
                                        onChange={updateYearRange}
                                        yearLabels={YEAR_LABELS}
                                    />
                                </Col>
                            </Row>
                        </div>

                        <div className="outcomes-flux-page__params fr-mt-3w fr-mb-3w">
                            <Title as="h2" look="h5" className="fr-mb-2w">Commentaires</Title>
                            <p>
                                <b>Source : </b>
                                MESRE-SIES, système d'information SISE, enquêtes menées par le SIES auprès des établissements de l'enseignement supérieur. MEN-DEPP, systèmes d'informations SCOLARITE et SIFA, enquêtes menées par la DEPP auprès d'établissements du secondaire et de centres de formation d'apprentis (CFA).
                            </p>
                            <p>
                                <b>Champ : </b>
                                les néo-bacheliers inscrits en licence en université à la rentrée 2019 en France.
                            </p>
                        </div>
                        <OutcomesDefinitionsTable definitions={OUTCOMES_DEFINITIONS} />
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
