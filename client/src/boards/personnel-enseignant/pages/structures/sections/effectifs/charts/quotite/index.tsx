import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createQuotiteGroupedOptions } from "./options";

interface QuotiteChartProps {
    selectedYear: string;
    quotiteByGender: any[];
}

export default function QuotiteChart({ selectedYear, quotiteByGender }: QuotiteChartProps) {
    const options = useMemo(() => {
        if (!quotiteByGender?.length) return null;
        return createQuotiteGroupedOptions(quotiteByGender);
    }, [quotiteByGender]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-quotite-grouped",
                title: { fr: `Temps plein et temps partiel par genre (${selectedYear})`, look: "h5" as const },
                sources: [{ label: { fr: <>MESRE-DGRH, traitement DND</> }, url: { fr: "https://data.enseignementsup-recherche.gouv.fr" } }],
            }}
            options={options}
        />
    );
}
