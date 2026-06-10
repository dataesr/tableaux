import { useState, type ReactNode } from "react";
import { Title } from "@dataesr/dsfr-plus";

import "../../../structures-finance/components/metric-definitions/metric-definitions-table.scss";

export interface OutcomesDefinition {
    key: string;
    libelle: string;
    definition?: ReactNode;
    calcul?: ReactNode;
    interpretation?: ReactNode;
    source?: ReactNode;
}

interface OutcomesDefinitionsTableProps {
    definitions: OutcomesDefinition[];
    title?: string;
}

export default function OutcomesDefinitionsTable({
    definitions,
    title = "À propos des indicateurs et des filtres",
}: OutcomesDefinitionsTableProps) {
    const [isOpen, setIsOpen] = useState(definitions.length < 3);

    if (!definitions.length) return null;

    return (
        <div className="metric-definitions-table fr-mt-4w fr-mb-4w">
            <button
                className="definitions-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                title={isOpen ? "Fermer les définitions" : "Ouvrir les définitions"}
            >
                <div className="definitions-toggle-content">
                    <span className="fr-icon-information-line fr-icon--lg" aria-hidden="true" />
                    <Title as="h2" look="h6" className="fr-mb-0">{title}</Title>
                    <span className="definitions-count">
                        {definitions.length} définition{definitions.length > 1 ? "s" : ""}
                    </span>
                </div>
                <span
                    className={`fr-icon-arrow-down-s-line toggle-icon ${isOpen ? "open" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className="definitions-grid">
                    {definitions.map((def) => (
                        <div key={def.key} className="definition-card">
                            <div className="definition-card-header">
                                <Title as="h3" look="h6" className="definition-title">{def.libelle}</Title>
                            </div>

                            {def.definition && (
                                <div className="definition-section">
                                    <span className="section-icon fr-icon-file-text-line" aria-hidden="true" />
                                    <div className="section-content">
                                        <strong className="section-label">Définition</strong>
                                        <div className="fr-mb-2w fr-text--sm">{def.definition}</div>
                                    </div>
                                </div>
                            )}

                            {def.calcul && (
                                <div className="definition-section">
                                    <span className="section-icon fr-icon-line-chart-fill" aria-hidden="true" />
                                    <div className="section-content">
                                        <strong className="section-label">Calcul</strong>
                                        <div className="fr-mb-2w fr-text--sm">{def.calcul}</div>
                                    </div>
                                </div>
                            )}

                            {def.interpretation && (
                                <div className="definition-section">
                                    <span className="section-icon fr-icon-lightbulb-line" aria-hidden="true" />
                                    <div className="section-content">
                                        <strong className="section-label">Interprétation</strong>
                                        <div className="section-text">{def.interpretation}</div>
                                    </div>
                                </div>
                            )}

                            {def.source && (
                                <div className="definition-footer">
                                    <span className="fr-icon-database-line" aria-hidden="true" />
                                    <div className="source-content fr-text--sm">{def.source}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
