import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import { createRessourcesAutresDecompositionChartOptions } from "./options";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";

interface RessourcesAutresDecompositionChartProps {
  etablissementId?: string;
  etablissementName?: string;
}

export default function RessourcesAutresDecompositionChart({
  etablissementId: propEtablissementId,
  etablissementName,
}: RessourcesAutresDecompositionChartProps) {
  const [searchParams] = useSearchParams();
  const etablissementId =
    propEtablissementId || searchParams.get("structureId") || "";
  const [viewMode, setViewMode] = useState<"value" | "percentage">("value");

  const { data: rawData } = useFinanceEtablissementEvolution(
    etablissementId,
    !!etablissementId
  );

  // Logique métier en lien avec les id actual etc......
  // Nécessaire pour les institutions fusionnées qui ont plusieurs
  // lignes pour une même année (ex: Université de Lille 2018-2020).
  const evolutionData = useMemo(() => {
    if (!rawData) return undefined;

    const uniqueByExercice = new Map();
    rawData.forEach((item: any) => {
      const key = item.exercice || item.anuniv;
      if (!uniqueByExercice.has(key)) {
        uniqueByExercice.set(key, item);
      }
    });

    return Array.from(uniqueByExercice.values());
  }, [rawData]);

  const options = useMemo(() => {
    if (!evolutionData || evolutionData.length === 0) return null;
    return createRessourcesAutresDecompositionChartOptions(
      evolutionData,
      viewMode
    );
  }, [evolutionData, viewMode]);

  const years = (() => {
    if (!evolutionData || evolutionData.length === 0) return [];
    return evolutionData
      .map((d: any) => d.exercice)
      .filter((y: any) => typeof y === "number")
      .sort((a: number, b: number) => a - b);
  })();

  const periodText =
    years.length === 0
      ? ""
      : years.length === 1
        ? String(years[0])
        : `${years[0]} - ${years[years.length - 1]}`;

  const etabName =
    etablissementName || evolutionData?.[0]?.etablissement_lib || "";

  const config = {
    id: "ressourcesAutresDecomposition",
    integrationURL: `/integration?chart_id=ressourcesAutresDecomposition&structureId=${etablissementId}`,
    title: `Décomposition des autres ressources propres${etabName ? ` — ${etabName}` : ""}`,
    comment: {
      fr: (
        <>
          Ce graphique présente la décomposition des autres ressources propres
          (hors formation et recherche) de l'établissement entre subventions et
          autres recettes sur la période {periodText}.
        </>
      ),
    },
    readingKey: {
      fr: (
        <>
          {viewMode === "value" ? (
            <>
              Le graphique montre l'évolution des montants en euros pour chaque
              composante des autres ressources propres.
            </>
          ) : (
            <>
              Le graphique montre la répartition en pourcentage de chaque
              composante des autres ressources propres.
            </>
          )}
        </>
      ),
    },
  };

  if (!evolutionData || evolutionData.length === 0 || !options) {
    return null;
  }

  return (
    <div>
      <div className="fr-mb-2w">
        <SegmentedControl
          className="fr-segmented--sm fr-segmented--no-legend"
          label="Affichage"
          name="ressources-autres-decomposition-view"
        >
          <SegmentedElement
            checked={viewMode === "value"}
            label="Valeurs"
            onClick={() => setViewMode("value")}
            value="value"
          />
          <SegmentedElement
            checked={viewMode === "percentage"}
            label="Parts (%)"
            onClick={() => setViewMode("percentage")}
            value="percentage"
          />
        </SegmentedControl>
      </div>

      <ChartWrapper
        config={config}
        options={options}
      />
    </div>
  );
}
