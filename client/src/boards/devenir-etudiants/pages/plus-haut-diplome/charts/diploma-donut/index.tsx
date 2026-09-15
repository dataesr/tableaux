import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { type OutcomesFilterField, useOutcomesPlusHautDiplome } from "../../../../api";
import { createDiplomaDonutOptions } from "./options";

const FILTER_FIELDS: OutcomesFilterField[] = [
    "groupe_disciplinaire", "sexe", "origine_sociale",
    "bac_type", "bac_mention", "retard_scolaire",
    "devenir_en_un_an", "type_de_trajectoire",
];

export default function DiplomaDonut() {
    const [searchParams] = useSearchParams();
    const filters = FILTER_FIELDS.reduce<Partial<Record<OutcomesFilterField, string | null>>>(
        (acc, f) => { acc[f] = searchParams.get(f); return acc; }, {},
    );
    const { data, isLoading } = useOutcomesPlusHautDiplome({
        cohorteAnnee: searchParams.get("cohorte_annee") || "2019-2020",
        cohorteSituation: searchParams.get("cohorte_situation") || "L1",
        filters,
    });

    const title = `Plus haut diplôme obtenu lors de la session 2023 par les néo-bacheliers inscrits en L1 en 2019`;

    const options = useMemo(() => {
        if (!data?.rows.length) return null;
        return createDiplomaDonutOptions(data.rows, data.totals.nonDiplomes, title);
    }, [data, title]);

    if (isLoading) return <DefaultSkeleton height="320px" />;
    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "outcomes-plus-haut-diplome-donut",
                integrationURL: `/integration?chart_id=outcomesPhdDonut&${searchParams.toString()}`,
                title,
            }}
            options={options}
        />
    );
}
