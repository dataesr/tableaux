import { Button, Col, Container, DismissibleTag, Row, TagGroup, Title } from "@dataesr/dsfr-plus";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default";
import ChartWrapper from "../../../../components/chart-wrapper";
import Callout from "../../../../components/callout.tsx";
import { type OutcomesFilterField, useOutcomesFlux } from "../../api";
import OutcomesFilterSelect from "../../components/filter-select/index.tsx";
import OutcomesDefinitionsTable from "../../components/definitions-table/index.tsx";
import { OUTCOMES_DEFINITIONS } from "../../components/definitions-table/data.tsx";
import SankeyChart from "./charts/sankey";
import YearRangeSlider from "../../components/year-range-slider/index.tsx";

const DEFAULT_COHORT_YEAR = "2019-2020";
const DEFAULT_COHORT_SITUATION = "L1";
const DEFAULT_MIN_VALUE = 100;
const MIN_MIN_VALUE = 1;
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
                { field: "bac_type", label: "Type de baccalauréat" },
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

function buildContiguousYears(startYear: number, endYear: number) {
    const safeStart = Math.max(DEFAULT_YEAR_START, Math.min(DEFAULT_YEAR_END, startYear));
    const safeEnd = Math.max(safeStart, Math.min(DEFAULT_YEAR_END, endYear));
    return ALL_RELATIVE_YEARS.filter((year) => year >= safeStart && year <= safeEnd);
}

export default function FluxPage() {
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

    const activeFilterCount = FILTER_FIELDS.filter((f) => !!filters[f]).length;
    const suggestedThreshold = Math.max(MIN_MIN_VALUE, Math.round(DEFAULT_MIN_VALUE / (activeFilterCount + 1)));
    const isManualOverride = searchParams.has("min_value");
    const parsedMinValue = Number.parseInt(searchParams.get("min_value") || "", 10);
    const minValue = isManualOverride && Number.isInteger(parsedMinValue)
        ? Math.max(MIN_MIN_VALUE, parsedMinValue)
        : suggestedThreshold;
    const [sliderValue, setSliderValue] = useState(minValue);

    useEffect(() => {
        if (!isManualOverride) {
            setSliderValue(suggestedThreshold);
        }
    }, [isManualOverride, suggestedThreshold]);
    const { yearEnd, yearStart } = useMemo(() => {
        const raw = searchParams.get("annee_rel");
        if (!raw) {
            return { yearEnd: DEFAULT_YEAR_END, yearStart: DEFAULT_YEAR_START };
        }
        const parsed = raw.split(",").map(Number).filter((n) => ALL_RELATIVE_YEARS.includes(n));
        if (parsed.length < 2) {
            return { yearEnd: DEFAULT_YEAR_END, yearStart: DEFAULT_YEAR_START };
        }
        const minYear = Math.max(DEFAULT_YEAR_START, Math.min(DEFAULT_YEAR_END, Math.min(...parsed)));
        const maxYear = Math.max(minYear, Math.min(DEFAULT_YEAR_END, Math.max(...parsed)));
        return { yearEnd: maxYear, yearStart: minYear };
    }, [searchParams]);
    const relativeYears = useMemo(() => buildContiguousYears(yearStart, yearEnd), [yearStart, yearEnd]);

    const { data, error, isFetching, isLoading } = useOutcomesFlux({
        cohorteAnnee: cohortYear,
        cohorteSituation: cohortSituation,
        filters,
        minValue,
        relativeYears,
    });

    const activeFiltersElement = (() => {
        const tags = FILTER_SECTIONS.flatMap(s =>
            s.fields.filter(f => filters[f.field]).map(f => {
                const code = filters[f.field]!;
                const option = data?.filterOptions?.[f.field]?.find((o: { key: string }) => o.key === code);
                return { field: f.field, label: f.label, value: option?.label || code };
            })
        );
        if (!tags.length) return null;
        return (
            <TagGroup className="fr-mt-1w fr-mb-1w">
                {tags.map(({ field, label, value }) => (
                    <DismissibleTag key={field} size="sm" onClick={() => updateFilter(field, null)}>{label} : {value}</DismissibleTag>
                ))}
            </TagGroup>
        );
    })();

    const exportFiltersText = useMemo(() => {
        const selectedFilters = FILTER_SECTIONS.flatMap((section) =>
            section.fields
                .filter(({ field }) => !!filters[field])
                .map(({ field, label }) => {
                    const key = filters[field]!;
                    const optionLabel = data?.filterOptions?.[field]?.find((opt: { key: string; label: string }) => opt.key === key)?.label;
                    return `${label}: ${optionLabel || key}`;
                })
        );

        const meta = [
            `Période: ${YEAR_LABELS[yearStart]} à ${YEAR_LABELS[yearEnd]}`,
            `Seuil min: ${minValue}`,
        ];

        if (!selectedFilters.length) {
            return [...meta, "Ensemble"].join(" | ");
        }

        return [...meta, ...selectedFilters].join(" | ");
    }, [data?.filterOptions, filters, minValue, yearEnd, yearStart]);

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
        nextParams.delete("min_value");
        nextParams.delete("annee_rel");
        setSearchParams(nextParams);
    };

    const updateMinValue = (value: number) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("min_value", String(value));
        setSearchParams(nextParams);
    };

    const resetMinValue = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("min_value");
        setSearchParams(nextParams);
    };

    const updateYearRange = (start: number, end: number) => {
        const safeStart = Math.max(DEFAULT_YEAR_START, Math.min(DEFAULT_YEAR_END, start));
        const safeEnd = Math.max(safeStart, Math.min(DEFAULT_YEAR_END, end));
        const next = buildContiguousYears(safeStart, safeEnd);
        const nextParams = new URLSearchParams(searchParams);
        const isAll = safeStart === DEFAULT_YEAR_START && safeEnd === DEFAULT_YEAR_END;
        if (isAll) {
            nextParams.delete("annee_rel");
        } else {
            nextParams.set("annee_rel", next.join(","));
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
                    <section className="outcomes-flux-page__filters" aria-label="Filtres du graphique de flux">
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
                        <ChartWrapper.Title config={{ id: "outcomes-flux-sankey", title: `Parcours des néo-bacheliers inscrits en L1 en 2019 (seuil : ${minValue} étudiant${minValue > 1 ? "s" : ""})` }} />
                        {activeFiltersElement}
                        {(isLoading || (isFetching && !data)) && <DefaultSkeleton height="540px" />}
                        {!isLoading && isFetching && data && (
                            <div style={{ opacity: 0.5, transition: "opacity 0.2s" }}>
                                <SankeyChart
                                    exportMetadata={{
                                        filtersText: exportFiltersText,
                                        sourceText: "Source : MESRE-SIES.",
                                    }}
                                    hideTitle
                                    links={data.links}
                                    totalStudents={data.totalStudents}
                                />
                            </div>
                        )}
                        {!isLoading && !isFetching && error && (
                            <Callout colorFamily="pink-macaron" icon="fr-icon-error-warning-line" title="Erreur de chargement">
                                Impossible de récupérer les flux pour cette cohorte.
                            </Callout>
                        )}
                        {!isLoading && !isFetching && data && !data.links?.length && (
                            <Callout title="Aucune transition visible" icon="fr-icon-information-line">
                                Aucun flux ne dépasse le seuil d'affichage avec les filtres actuellement sélectionnés.
                            </Callout>
                        )}
                        {!isLoading && !isFetching && (data?.links?.length ?? 0) > 0 && (
                            <SankeyChart
                                exportMetadata={{
                                    filtersText: exportFiltersText,
                                    sourceText: "Source : MESRE-SIES.",
                                }}
                                hideTitle
                                links={data!.links}
                                totalStudents={data!.totalStudents}
                            />
                        )}

                        <div className="outcomes-flux-page__params outcomes-flux-page__params--after-chart">
                            <Title as="h2" look="h5" className="fr-mb-2w">Paramètres pour les flux</Title>
                            <Row gutters>
                                <Col md={6}>
                                    <YearRangeSlider
                                        id="flux-year-range"
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
                                <Col md={6}>
                                    <div className="fr-range-group">
                                        <label className="fr-label" id="flux-min-value-range-label">
                                            Affichage des flux
                                            <span className="fr-hint-text">
                                                {!isManualOverride && activeFilterCount > 0
                                                    ? <>Seuil ajusté automatiquement à {sliderValue} étudiant{sliderValue > 1 ? "s" : ""} en fonction de vos {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}. Vous pouvez l'ajuster manuellement ci-dessous.</>
                                                    : <>Afficher les flux regroupant au minimum {sliderValue} étudiant{sliderValue > 1 ? "s" : ""}. Ajustez le seuil pour filtrer les flux les plus faibles et mieux visualiser les parcours majoritaires.</>
                                                }
                                            </span>
                                        </label>
                                        <div className="fr-range fr-range--sm">
                                            <span className="fr-range__output">{sliderValue}</span>
                                            <input
                                                aria-describedby="flux-min-value-range-messages"
                                                aria-labelledby="flux-min-value-range-label"
                                                className="fr-range__input"
                                                max={1000}
                                                min={MIN_MIN_VALUE}
                                                name="flux-min-value-range"
                                                onChange={(e) => setSliderValue(Number(e.target.value))}
                                                onMouseUp={() => updateMinValue(sliderValue)}
                                                onTouchEnd={() => updateMinValue(sliderValue)}
                                                step={1}
                                                type="range"
                                                value={sliderValue}
                                            />
                                            <span className="fr-range__min" aria-hidden="true">{MIN_MIN_VALUE}</span>
                                            <span className="fr-range__max" aria-hidden="true">1 000</span>
                                        </div>
                                        <div className="fr-messages-group" id="flux-min-value-range-messages" aria-live="polite" />
                                        {isManualOverride && (
                                            <div className="fr-mt-1w">
                                                <button title="Réinitialiser le seuil automatique" className="fr-btn fr-btn--sm fr-btn--tertiary" onClick={resetMinValue} type="button">
                                                    Réinitialiser le seuil automatique ({suggestedThreshold})
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <div className="outcomes-flux-page__params fr-mt-3w fr-mb-3w">
                            <Title as="h2" look="h5" className="fr-mb-2w">Commentaires</Title>
                            <p>
                                <b>Note : </b>
                                ce graphique représente les flux de néo-bacheliers inscrits en licence en 2019, d'une année à l'année suivante jusqu'à l'année universitaire 2023-2024.
                            </p>
                            <p>
                                Pour des raisons de confidentialité, certaines données ont été bruitées. Les taux d'inscription présentés peuvent différer des valeurs réelles ; pour consulter les données exactes, veuillez vous référer au second onglet (l'histogramme sur la répartition des inscriptions).
                            </p>
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
