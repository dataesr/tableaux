import { useSearchParams } from "react-router-dom";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { ViewType } from "../../api";
import EnseignantsChercheurSection from "../enseignants-chercheurs";
import Enseignants2ndDegreArtsMetiersSection from "../enseignants-2nd-degre-arts-metiers";
import EnseignantsNonPermanentsSection from "../enseignants-non-permanents";

interface PersonnelsSectionProps {
    viewType: ViewType;
    selectedId: string;
    selectedYear: string;
    initialPopulation?: string;
}

const POPULATIONS = [
    { id: "enseignants-chercheurs", label: "Enseignants-chercheurs" },
    { id: "enseignants-2nd-degre-arts-metiers", label: "Enseignants 2nd degré & Arts et Métiers" },
    { id: "enseignants-non-permanents", label: "Enseignants non permanents" },
];

export default function PersonnelsSection({
    viewType,
    selectedId,
    selectedYear,
    initialPopulation,
}: PersonnelsSectionProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const population =
        searchParams.get("population") || initialPopulation || "enseignants-chercheurs";

    const handlePopulationChange = (value: string) => {
        const params = Object.fromEntries(searchParams);
        setSearchParams({ ...params, population: value });
    };

    return (
        <>
            <div className="fr-mb-4w">
                <SegmentedControl
                    className="fr-segmented--sm"
                    name="fm-population"
                    aria-label="Champ de population"
                >
                    {POPULATIONS.map((p) => (
                        <SegmentedElement
                            key={p.id}
                            checked={population === p.id}
                            label={p.label}
                            onClick={() => handlePopulationChange(p.id)}
                            value={p.id}
                        />
                    ))}
                </SegmentedControl>
            </div>

            {population === "enseignants-chercheurs" && (
                <EnseignantsChercheurSection
                    viewType={viewType}
                    selectedId={selectedId}
                    selectedYear={selectedYear}
                />
            )}
            {population === "enseignants-2nd-degre-arts-metiers" && (
                <Enseignants2ndDegreArtsMetiersSection
                    viewType={viewType}
                    selectedId={selectedId}
                    selectedYear={selectedYear}
                />
            )}
            {population === "enseignants-non-permanents" && (
                <EnseignantsNonPermanentsSection
                    viewType={viewType}
                    selectedId={selectedId}
                    selectedYear={selectedYear}
                />
            )}
        </>
    );
}
