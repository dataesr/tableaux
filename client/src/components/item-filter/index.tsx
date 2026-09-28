import { useState, type ReactNode } from "react";
import "./styles.scss";

export interface FilterItem {
    key: string;
    label: string;
    category?: string;
    count?: number;
    hint?: string;
}

interface ItemFilterProps {
    label: string;
    hint?: string;
    id?: string;
    items: FilterItem[];
    availableKeys?: Set<string>;
    selectedKey: string | null;
    onSelect: (key: string | null) => void;
    emptyLabel?: string;
}

export default function ItemFilter({
    label,
    hint,
    id,
    items,
    availableKeys,
    selectedKey,
    onSelect,
    emptyLabel,
}: ItemFilterProps) {
    const availableItems = availableKeys
        ? items.filter((item) => availableKeys.has(item.key))
        : items;
    const groupId = id ?? `item-filter-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const resolvedHint =
        hint ??
        (availableKeys
            ? `${availableItems.length} disponible${availableItems.length > 1 ? "s" : ""}`
            : undefined);

    return (
        <div className="fr-select-group fr-mb-2w">
            <label className="fr-label" htmlFor={groupId}>
                {label}
                {resolvedHint && <span className="fr-hint-text">{resolvedHint}</span>}
            </label>
            <select
                className="fr-select"
                id={groupId}
                name={groupId}
                value={selectedKey ?? ""}
                onChange={(e) => onSelect(e.target.value || null)}
            >
                {emptyLabel !== undefined ? (
                    <option value="">{emptyLabel}</option>
                ) : !selectedKey ? (
                    <option value="" disabled>
                        Sélectionnez une option
                    </option>
                ) : null}
                {availableItems.map((item) => (
                    <option key={item.key} value={item.key}>
                        {item.label}
                        {typeof item.count === "number" && item.count > 0 ? ` (${item.count})` : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface ItemFilterPanelProps {
    title: string;
    items: FilterItem[];
    availableKeys?: Set<string>;
    selectedKey: string | null;
    onSelect: (key: string) => void;
    footer?: ReactNode;
}

export function ItemFilterPanel({
    title,
    items,
    availableKeys,
    selectedKey,
    onSelect,
    footer,
}: ItemFilterPanelProps) {
    const availableItems = availableKeys
        ? items.filter((item) => availableKeys.has(item.key))
        : items;
    const categories = [
        ...new Set(
            availableItems
                .map((item) => item.category)
                .filter((category): category is string => Boolean(category))
        ),
    ];
    const selectedItem = availableItems.find((item) => item.key === selectedKey);
    const groupId = `item-filter-${title.replace(/\s+/g, "-").toLowerCase()}`;

    const [browsedCategory, setBrowsedCategory] = useState(
        selectedItem?.category ?? categories[0] ?? ""
    );
    const activeCategory = categories.includes(browsedCategory)
        ? browsedCategory
        : (categories[0] ?? "");
    const categoryItems = availableItems.filter((item) => item.category === activeCategory);

    return (
        <div className="item-filter">
            <div className="fr-select-group fr-mb-2w">
                <label className="fr-label" htmlFor={groupId}>
                    {title}
                </label>
                <select
                    className="fr-select"
                    id={groupId}
                    name={groupId}
                    value={activeCategory}
                    onChange={(e) => setBrowsedCategory(e.target.value)}
                >
                    {categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <fieldset className="item-filter__list-container">
                <legend className="fr-sr-only">{activeCategory}</legend>
                <div className="item-filter__list">
                    {categoryItems.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={selectedKey === item.key}
                            onClick={() => onSelect(item.key)}
                            className={`item-filter__item ${selectedKey === item.key ? "item-filter__item--selected" : ""}`}
                        >
                            <span className="item-filter__item-label">{item.label}</span>
                            {item.hint && (
                                <span className="item-filter__item-hint">{item.hint}</span>
                            )}
                        </button>
                    ))}
                </div>
            </fieldset>

            {footer && <div className="item-filter__footer">{footer}</div>}
        </div>
    );
}
