import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import SanteFinanciereTableau from "../../../sante-financiere/charts/sante-financiere-tableau";
import DefaultSkeleton from "../../../../../../../../components/charts-skeletons/default";
import { Title } from "@dataesr/dsfr-plus";

interface SyntheseSanteFinanciereProps {
  etablissementId?: string;
  etablissementName?: string;
}

export default function SyntheseSanteFinanciere({
  etablissementId: propEtablissementId,
  etablissementName,
}: SyntheseSanteFinanciereProps) {
  const [searchParams] = useSearchParams();
  const etablissementId =
    propEtablissementId || searchParams.get("structureId") || "";

  const { data: rawData, isLoading } = useFinanceEtablissementEvolution(
    etablissementId,
    !!etablissementId
  );

  // Logique métier en lien avec les id actual etc......
  // Nécessaire pour les institutions fusionnées qui ont plusieurs
  // lignes pour une même année (ex: Université de Lille 2018-2020).
  const data = useMemo(() => {
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

  if (isLoading) {
    return <DefaultSkeleton height="400px" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info" role="status">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div>
      <Title as="h3" look="h3" className="fr-h5 fr-mb-3w">
        Synthèse de la santé financière
        {etablissementName ? ` — ${etablissementName}` : ""}
      </Title>
      <SanteFinanciereTableau data={data?.[0]} />
    </div>
  );
}
