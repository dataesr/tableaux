import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { type OutcomesFilterField, useOutcomesRepartition } from "../../../../api";
import { createRepartitionOptions } from "./options";

const FILTER_FIELDS: OutcomesFilterField[] = [
    "groupe_disciplinaire", "sexe", "origine_sociale",
    "bac_type", "bac_mention", "retard_scolaire",
    "devenir_en_un_an", "type_de_trajectoire",
];

const ALL_RELATIVE_YEARS = [0, 1, 2, 3, 4];
const YEAR_LABELS: Record<number, string> = {
    0: "2019-2020 (N+0)",
    1: "2020-2021 (N+1)",
    2: "2021-2022 (N+2)",
    3: "2022-2023 (N+3)",
    4: "2023-2024 (N+4)",
};

interface RepartitionChartProps {
    hideTitle?: boolean;
}

export default function RepartitionChart({ hideTitle }: RepartitionChartProps = {}) {
    const [searchParams] = useSearchParams();

    const filters = FILTER_FIELDS.reduce<Partial<Record<OutcomesFilterField, string | null>>>(
        (acc, f) => { acc[f] = searchParams.get(f); return acc; }, {},
    );

    const relativeYears = useMemo(() => {
        const raw = searchParams.get("annee_rel");
        if (!raw) return ALL_RELATIVE_YEARS;
        const parsed = raw.split(",").map(Number).filter((n) => ALL_RELATIVE_YEARS.includes(n));
        if (!parsed.length) return ALL_RELATIVE_YEARS;
        const min = Math.min(...parsed);
        const max = Math.max(...parsed);
        const result: number[] = [];
        for (let y = min; y <= max; y += 1) result.push(y);
        return result;
    }, [searchParams]);

    const { data, isLoading } = useOutcomesRepartition({
        cohorteAnnee: searchParams.get("cohorte_annee") || "2019-2020",
        cohorteSituation: searchParams.get("cohorte_situation") || "SIT01",
        filters,
        relativeYears,
    });

    const options = useMemo(() => {
        if (!data?.distribution?.length) return null;
        return createRepartitionOptions(data.distribution, relativeYears, YEAR_LABELS);
    }, [data, relativeYears]);

    if (isLoading) return <DefaultSkeleton height="540px" />;
    if (!options) return null;

    return (
        <ChartWrapper
            hideTitle={hideTitle}
            config={{
                id: "outcomes-repartition",
                integrationURL: `/integration?chart_id=outcomesRepartition&${searchParams.toString()}`,
                title: "Répartition des néo-bacheliers inscrits en L1 en 2019 selon les inscriptions par année (en %)",
            }}
            options={options}
        />
    );
}
