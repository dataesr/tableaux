import { useState } from "react";
import { Title } from "@dataesr/dsfr-plus";
import { definitions } from "../../pages/definitions/definitions";
import "./metric-definitions-table.scss";

interface FmMetricDefinitionsTableProps {
    definitionKeys: string[];
    extraItems?: { title: string; definition: string }[];
}

export default function FmMetricDefinitionsTable({ definitionKeys, extraItems = [] }: FmMetricDefinitionsTableProps) {
    const relevant = [
        ...definitions.filter((d) => definitionKeys.includes(d.title)),
        ...extraItems,
    ];
    const [isOpen, setIsOpen] = useState(relevant.length < 3);

    if (relevant.length === 0) return null;

    return (
        <div className="fm-metric-definitions-table fr-mt-4w">
            <button
                className="definitions-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="definitions-toggle-content">
                    <span className="fr-icon-information-line fr-icon--lg fr-mr-2w" aria-hidden="true" />
                    <Title as="h2" look="h6" className="fr-mb-0">
                        À propos des indicateurs
                    </Title>
                    <span className="definitions-count">
                        {relevant.length} indicateur{relevant.length > 1 ? "s" : ""}
                    </span>
                </div>
                <span
                    className={`fr-icon-arrow-down-s-line toggle-icon ${isOpen ? "open" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className="definitions-grid">
                    {relevant.map((def) => (
                        <div key={def.title} className="definition-card">
                            <div className="definition-card-header">
                                <p className="definition-title">{def.title}</p>
                            </div>
                            <div className="definition-section">
                                <span className="section-icon fr-icon-file-text-line" aria-hidden="true" />
                                <div className="section-content">
                                    <strong className="section-label">Définition</strong>
                                    <p className="section-text">{def.definition}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
