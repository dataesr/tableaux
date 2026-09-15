import Select from "../../../../components/select";

interface FilterOption {
    count?: number;
    key: string;
    label: string;
}

interface OutcomesFilterSelectProps {
    emptyLabel?: string;
    hint?: string;
    id?: string;
    label: string;
    onSelect: (value: string | null) => void;
    options: FilterOption[];
    selectedKey: string | null;
}

export default function OutcomesFilterSelect({
    emptyLabel = "Ensemble",
    hint,
    id,
    label,
    onSelect,
    options,
    selectedKey,
}: OutcomesFilterSelectProps) {
    const selectedOption = options.find((o) => o.key === selectedKey);
    const triggerLabel = selectedOption?.label ?? emptyLabel;
    const groupId = id ?? `outcomes-filter-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
        <div className="fr-select-group fr-mb-2w">
            <label className="fr-label fr-mb-1w" htmlFor={groupId}>
                {label}
                {hint ? <span className="fr-hint-text">{hint}</span> : null}
            </label>
            <Select
                aria-label={label}
                fullWidth
                label={triggerLabel}
                size="sm"
                title={label}
            >
                <ul role="presentation">
                    <li>
                        <Select.Option
                            value=""
                            selected={!selectedKey}
                            onClick={() => onSelect(null)}
                        >
                            {emptyLabel}
                        </Select.Option>
                    </li>
                    {options.map((opt) => (
                        <li key={opt.key}>
                            <Select.Option
                                value={opt.key}
                                selected={selectedKey === opt.key}
                                onClick={() => onSelect(opt.key)}
                            >
                                {opt.label}{typeof opt.count === "number" && opt.count > 0 ? ` (${opt.count})` : ""}
                            </Select.Option>
                        </li>
                    ))}
                </ul>
            </Select>
        </div>
    );
}
