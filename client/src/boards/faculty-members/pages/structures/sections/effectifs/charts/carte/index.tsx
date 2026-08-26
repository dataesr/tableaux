import FranceMap from "../../../../components/france-map";

interface MapChartProps {
    selectedYear: string;
}

export default function MapChart({ selectedYear }: MapChartProps) {
    return (
        <FranceMap
            year={selectedYear}
            title={`Répartition géographique des enseignants (${selectedYear})`}
            asideList
        />
    );
}
