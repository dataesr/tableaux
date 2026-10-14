import MetricDefinitions, { type MetricDefinition } from "../../../../components/metric-definitions";

export type OutcomesDefinition = MetricDefinition;

export default function OutcomesDefinitionsTable({ definitions }: { definitions: OutcomesDefinition[] }) {
    return (
        <div className="fr-mb-4w">
            <MetricDefinitions
                countLabel="définition"
                definitions={definitions}
                title="À propos des indicateurs et des filtres"
            />
        </div>
    );
}
