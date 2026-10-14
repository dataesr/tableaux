import MetricDefinitions from "../../../../components/metric-definitions";
import { definitions } from "../../pages/definitions/definitions";

interface FmMetricDefinitionsTableProps {
    definitionKeys: string[];
    extraItems?: { title: string; definition: string }[];
}

export default function FmMetricDefinitionsTable({ definitionKeys, extraItems = [] }: FmMetricDefinitionsTableProps) {
    const relevant = [
        ...definitions.filter((d) => definitionKeys.includes(d.title)),
        ...extraItems,
    ];

    return (
        <MetricDefinitions
            definitions={relevant.map((def) => ({ key: def.title, title: def.title, definition: def.definition }))}
        />
    );
}
