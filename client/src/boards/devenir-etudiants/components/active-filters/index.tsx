import { DismissibleTag, TagGroup } from "@dataesr/dsfr-plus";

import type { OutcomesFilterField } from "../../api";

export interface ActiveFilter {
    field: OutcomesFilterField;
    label: string;
    value: string;
}

interface ActiveFiltersProps {
    filters: ActiveFilter[];
    onRemove: (field: OutcomesFilterField) => void;
}

export const getFilterId = (field: OutcomesFilterField) => `filter-${field}`;

export default function ActiveFilters({ filters, onRemove }: ActiveFiltersProps) {
    if (!filters.length) return null;

    const removeFilter = (field: OutcomesFilterField) => {
        onRemove(field);
        document.getElementById(getFilterId(field))?.focus();
    };

    return (
        <TagGroup className="fr-mt-1w fr-mb-1w">
            {filters.map(({ field, label, value }) => (
                <DismissibleTag
                    key={field}
                    aria-label={`Retirer le filtre ${label} : ${value}`}
                    size="sm"
                    onClick={() => removeFilter(field)}
                >
                    {label} : {value}
                </DismissibleTag>
            ))}
        </TagGroup>
    );
}
