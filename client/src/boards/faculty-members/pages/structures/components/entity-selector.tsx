import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus";
import CardSimple from "../../../../../components/card-simple";
import { ViewType, useFacultyFilters, useFacultyYears } from "../api";
import Breadcrumb from "../../../components/breadcrumb";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default";
import FranceMap from "./france-map";
import Select from "../../../../../components/select";
import { getParamKey } from "../utils";

const VIEW_CONFIG: Record<ViewType, { title: string; searchLabel: string; searchPlaceholder: string; resultLabel: string }> = {
    structure: {
        title: "Sélectionnez un établissement",
        searchLabel: "Rechercher un établissement",
        searchPlaceholder: "Rechercher un établissement...",
        resultLabel: "établissement",
    },
    discipline: {
        title: "Sélectionnez une discipline",
        searchLabel: "Rechercher une discipline",
        searchPlaceholder: "Rechercher une discipline...",
        resultLabel: "discipline",
    },
    region: {
        title: "Sélectionnez une région",
        searchLabel: "Rechercher une région",
        searchPlaceholder: "Rechercher une région...",
        resultLabel: "région",
    },
    academie: {
        title: "Sélectionnez une académie",
        searchLabel: "Rechercher une académie",
        searchPlaceholder: "Rechercher une académie...",
        resultLabel: "académie",
    },
};

function normalizeString(str: string) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

interface Props {
    viewType: ViewType;
}

export default function EntitySelector({ viewType }: Props) {
    const [, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
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

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const normalized = normalizeString(searchQuery);
        return items.filter((s: any) =>
            normalizeString(s.label).includes(normalized)
        );
    }, [items, searchQuery]);

    const handleSelect = (id: string) => {
        const paramKey = getParamKey(viewType);

        setSearchParams({
            [paramKey]: id,
            section: "enseignants-chercheurs",
        });

        setSearchQuery("");
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
                    ) : (
                        <>
                            <Row gutters className="fr-mb-2w">
                                <Col xs="12" md="6">
                                    <Title as="h1" look="h4" className="fr-mb-2w">
                                        {config.title}
                                    </Title>
                                    <Select
                                        label={config.searchLabel}
                                        icon="search-line"
                                        size="md"
                                        fullWidth
                                    >
                                        <Select.Search
                                            placeholder={config.searchPlaceholder}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Select.Content maxHeight="320px">
                                            {filteredItems.map((item: any) => (
                                                <Select.Option
                                                    key={item.id}
                                                    value={item.id}
                                                    onClick={() => handleSelect(item.id)}
                                                >
                                                    {item.label}
                                                </Select.Option>
                                            ))}
                                            {filteredItems.length === 0 && (
                                                <Select.Empty>Aucun résultat trouvé</Select.Empty>
                                            )}
                                        </Select.Content>
                                    </Select>
                                </Col>
                            </Row>
                            {showMap && latestYear && (
                                <Row className="fr-mb-2w">
                                    <Col xs="12">
                                        <FranceMap
                                            year={latestYear}
                                            level="region"
                                            onRegionClick={handleMapRegionClick}
                                            title={`Enseignants par région du siège (${latestYear})`}
                                        />
                                    </Col>
                                </Row>
                            )}
                        </>
                    )}
                </Container>
            </Container>

            {!isLoading && filteredItems.length > 0 && (
                <Container as="section" className="fr-py-4w" aria-label="Résultats">
                    <Text size="sm" className="fr-mb-2w" aria-live="polite">
                        {filteredItems.length} {config.resultLabel}{filteredItems.length > 1 ? "s" : ""} trouvé{filteredItems.length > 1 ? "s" : ""}
                    </Text>
                    <Row gutters>
                        {filteredItems.map((item: any) => (
                            <Col key={item.id} xs="12" md="6" lg="4">
                                <CardSimple
                                    title={item.label}
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
