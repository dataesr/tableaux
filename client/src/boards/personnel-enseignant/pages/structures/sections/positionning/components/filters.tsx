import { Col, Row, Text } from "@dataesr/dsfr-plus";
import type { FmPositioningFilters } from "../hooks/usePositioningParams";
import type { ViewType } from "../../../api";

interface Props {
    viewType: ViewType;
    currentItem: any;
    filters: FmPositioningFilters;
    onFiltersChange: (f: FmPositioningFilters) => void;
}

export default function PositioningFilters({ viewType, currentItem, filters, onFiltersChange }: Props) {
    const toggle = (key: keyof FmPositioningFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: filters[key] === value ? "" : value });
    };

    const showType = viewType === "structure" && currentItem?.etablissement_type;
    const showAcademie = viewType === "structure" && currentItem?.etablissement_code_academie;
    const showRegion = (viewType === "structure" || viewType === "academie") && currentItem?.etablissement_code_region;

    if (!showType && !showAcademie && !showRegion) return null;

    return (
        <div className="fr-mb-3w">
            <Text className="fr-text--sm fr-text--bold fr-mb-1w" style={{ color: "var(--text-mention-grey)" }}>
                Filtrer la comparaison
            </Text>
            <Row gutters>
                {showType && (
                    <Col xs="12" md="4">
                        <button
                            type="button"
                            className={`fr-btn fr-btn--sm ${filters.type === "same-type" ? "" : "fr-btn--secondary"}`}
                            onClick={() => toggle("type", "same-type")}
                        >
                            Même type ({currentItem.etablissement_type})
                        </button>
                    </Col>
                )}
                {showRegion && (
                    <Col xs="12" md="4">
                        <button
                            type="button"
                            className={`fr-btn fr-btn--sm ${filters.region === "same-region" ? "" : "fr-btn--secondary"}`}
                            onClick={() => toggle("region", "same-region")}
                        >
                            Même région ({currentItem.etablissement_region})
                        </button>
                    </Col>
                )}
                {showAcademie && (
                    <Col xs="12" md="4">
                        <button
                            type="button"
                            className={`fr-btn fr-btn--sm ${filters.academie === "same-academie" ? "" : "fr-btn--secondary"}`}
                            onClick={() => toggle("academie", "same-academie")}
                        >
                            Même académie ({currentItem.etablissement_academie})
                        </button>
                    </Col>
                )}
            </Row>
        </div>
    );
}
