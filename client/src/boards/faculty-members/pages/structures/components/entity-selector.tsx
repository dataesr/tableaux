import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus";
import CardSimple from "../../../../../components/card-simple";
import { ViewType, useFacultyFilters, useFacultyYears } from "../api";
import Breadcrumb from "../../../components/breadcrumb";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default";
import FranceMap from "./france-map";
import { getParamKey, formatDisciplineLabel } from "../utils";

const VIEW_CONFIG: Record<ViewType, { title: string; selectLabel: string; selectPlaceholder: string; resultLabel: string }> = {
    structure: {
        title: "Sélectionnez un établissement",
        selectLabel: "Accéder à un établissement",
        selectPlaceholder: "Sélectionner un établissement",
        resultLabel: "établissement",
    },
    discipline: {
        title: "Sélectionnez une discipline",
        selectLabel: "Accéder à une discipline",
        selectPlaceholder: "Sélectionner une discipline",
        resultLabel: "discipline",
    },
    region: {
        title: "Sélectionnez une région",
        selectLabel: "Accéder à une région",
        selectPlaceholder: "Sélectionner une région",
        resultLabel: "région",
    },
    academie: {
        title: "Sélectionnez une académie",
        selectLabel: "Accéder à une académie",
        selectPlaceholder: "Sélectionner une académie",
        resultLabel: "académie",
    },
};

interface Props {
    viewType: ViewType;
}

export default function EntitySelector({ viewType }: Props) {
    const [, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const config = VIEW_CONFIG[viewType];

    const showMap = viewType === "region";

    const { data: yearsData } = useFacultyYears(viewType, undefined);
    const latestYear: string = yearsData?.latestCompleteYear || "";

    const { data, isLoading } = useFacultyFilters(viewType, latestYear || undefined);

    const items = useMemo(() => {
        if (!data?.items) return [];
        const seen = new Set<string>();
        return data.items
            .filter((s: any) => {
                if (!s.id || !s.label || seen.has(s.id)) return false;
                seen.add(s.id);
                return true;
            })
            .sort((a: any, b: any) =>
                (a.label || "").localeCompare(b.label || "", "fr", { sensitivity: "base" })
            );
    }, [data]);

    const displayLabel = (s: any): string =>
        viewType === "discipline" ? formatDisciplineLabel(s.label) : s.label;

    const handleSelect = (id: string) => {
        const paramKey = getParamKey(viewType);

        setSearchParams({
            [paramKey]: id,
            section: "enseignants-chercheurs",
        });
    };

    const handleMapRegionClick = (_geoId: string) => {
        navigate(`/personnel-enseignant/regions?geo_id=${encodeURIComponent(_geoId)}&section=enseignants-chercheurs`);
    };
    return (
        <main>
            <Container fluid className="fm-etablissement-selector__wrapper">
                <Container as="section">
                    <Row>
                        <Col>
                            <Breadcrumb
                                items={[
                                    { label: "Accueil", href: "/personnel-enseignant/accueil" },
                                    { label: config.title },
                                ]}
                            />
                        </Col>
                    </Row>
                    {isLoading ? (
                        <Row>
                            <Col>
                                <DefaultSkeleton />
                            </Col>
                        </Row>
                    ) : showMap ? (
                        <>
                            <Title as="h1" look="h4" className="fr-mb-1w">
                                {config.title}
                            </Title>
                            <p className="fr-text--sm fr-mb-3w" style={{ color: "var(--text-mention-grey)" }}>
                                Cliquez sur une région — sur la carte ou dans la liste — pour explorer ses données.
                            </p>
                            {latestYear && (
                                <FranceMap
                                    year={latestYear}
                                    level="region"
                                    onRegionClick={handleMapRegionClick}
                                    title={`Enseignants par région du siège (${latestYear})`}
                                    asideList
                                />
                            )}
                        </>
                    ) : (
                        <Row gutters className="fr-mb-2w">
                            <Col xs="12" md="6">
                                <Title as="h1" look="h4" className="fr-mb-2w">
                                    {config.title}
                                </Title>
                                <div className="fr-select-group">
                                    <label className="fr-label" htmlFor="fm-entity-select">
                                        {config.selectLabel}
                                    </label>
                                    <select
                                        className="fr-select"
                                        id="fm-entity-select"
                                        name="entity"
                                        value=""
                                        onChange={(e) => handleSelect(e.target.value)}
                                    >
                                        <option value="" disabled>
                                            {config.selectPlaceholder}
                                        </option>
                                        {items.map((item: any) => (
                                            <option key={item.id} value={item.id}>
                                                {displayLabel(item)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Container>
            </Container>

            {!isLoading && !showMap && items.length > 0 && (
                <Container as="section" className="fr-py-4w" aria-label="Résultats">
                    <Text size="sm" className="fr-mb-2w" aria-live="polite">
                        {items.length} {config.resultLabel}{items.length > 1 ? "s" : ""} trouvé{items.length > 1 ? "s" : ""}
                    </Text>
                    <Row gutters>
                        {items.map((item: any) => (
                            <Col key={item.id} xs="12" md="6" lg="4">
                                <CardSimple
                                    title={displayLabel(item)}
                                    onClick={() => handleSelect(item.id)}
                                    className="fr-mb-2w"
                                    description={`${item?.count?.toLocaleString("fr-FR")} enseignant${item.count > 1 ? "s" : ""}  en ${latestYear}`}
                                />
                            </Col>
                        ))}
                    </Row>
                </Container>
            )}
        </main>
    );
}
