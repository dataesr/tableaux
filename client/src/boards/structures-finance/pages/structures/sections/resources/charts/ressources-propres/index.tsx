import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import { createRessourcesPropresChartOptions } from "./options";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";

const euro = (n?: number) =>
  n != null ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "—";
const pct = (n?: number) => (n != null ? `${n.toFixed(1)} %` : "—");

interface RessourcesPropresChartProps {
  data?: any;
  selectedYear?: string | number;
  etablissementName?: string;
}

export default function RessourcesPropresChart({
  data: propData,
  selectedYear: propSelectedYear,
  etablissementName,
}: RessourcesPropresChartProps) {
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get("structureId") || "";
  const selectedYear = propSelectedYear || searchParams.get("year") || "";

  const { data: evolutionData } = useFinanceEtablissementEvolution(
    etablissementId,
    !!etablissementId
  );

  const data = useMemo(() => {
    if (propData) return propData;
    if (!evolutionData || !selectedYear) return null;
    return evolutionData.find(
      (item: any) => String(item.exercice) === String(selectedYear)
    );
  }, [propData, evolutionData, selectedYear]);

  const options = useMemo(() => {
    if (!data) return {} as Highcharts.Options;
    return createRessourcesPropresChartOptions(data);
  }, [data]);

  const ressourcesPropresDecomposition = [
    {
      label: "Droits d'inscription",
      value: data?.droits_d_inscription,
      part: data?.part_droits_d_inscription,
    },
    {
      label: "Formation continue",
      value: data?.formation_continue_diplomes_propres_et_vae,
      part: data?.part_formation_continue_diplomes_propres_et_vae,
    },
    {
      label: "Taxe d'apprentissage",
      value: data?.taxe_d_apprentissage,
      part: data?.part_taxe_d_apprentissage,
    },
    {
      label: "Valorisation",
      value: data?.valorisation,
      part: data?.part_valorisation,
    },
    {
      label: "ANR hors investissements",
      value: data?.anr_hors_investissements_d_avenir,
      part: data?.part_anr_hors_investissements_d_avenir,
    },
    {
      label: "ANR investissements d'avenir",
      value: data?.anr_investissements_d_avenir,
      part: data?.part_anr_investissements_d_avenir,
    },
    {
      label: "Contrats & prestations",
      value: data?.contrats_et_prestations_de_recherche_hors_anr,
      part: data?.part_contrats_et_prestations_de_recherche_hors_anr,
    },
    {
      label: "Subventions région",
      value: data?.subventions_de_la_region,
      part: data?.part_subventions_de_la_region,
    },
    {
      label: "Subventions UE",
      value: data?.subventions_union_europeenne,
      part: data?.part_subventions_union_europeenne,
    },
    {
      label: "Autres ressources",
      value: data?.autres_ressources_propres,
      part: data?.part_autres_ressources_propres,
    },
    {
      label: "Autres subventions",
      value: data?.autres_subventions,
      part: data?.part_autres_subventions,
    },
  ];

  const topRessource = ressourcesPropresDecomposition
    .filter((r) => r.value != null && r.value > 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0))[0];

  const totalRessources = data?.recettes_propres || 0;

  const etabName = etablissementName || data?.etablissement_lib || "";

  const isBudgetYear = data?.sanfin_source === "Budget";
  const formattedYear =
    selectedYear && isBudgetYear ? `${selectedYear} (Budget)` : selectedYear;

  const config = {
    id: "ressourcesPropres",
    integrationURL: `/integration?chart_id=ressourcesPropres&structureId=${etablissementId}&year=${selectedYear}`,
    title: `Décomposition des ressources propres${etabName ? ` — ${etabName}` : ""}${formattedYear ? ` — ${formattedYear}` : ""}`,
    comment: {
      fr: (
        <>
          Ce graphique présente la répartition détaillée des ressources propres
          de l'établissement pour l'exercice {formattedYear}. Les ressources
          propres comprennent notamment les droits d'inscription, la formation
          continue, les contrats de recherche, les subventions régionales et
          européennes.
        </>
      ),
    },
    readingKey: topRessource
      ? {
        fr: (
          <>
            En {formattedYear}, le total des ressources propres s'élève à{" "}
            <strong>{euro(totalRessources)} €</strong>. La principale source
            est {topRessource.label.toLowerCase()} avec{" "}
            <strong>{euro(topRessource.value)} €</strong> (
            {pct(topRessource.part)}).
          </>
        ),
      }
      : undefined,
  };

  if (!data) return null;

  return (
    <div>
      <ChartWrapper
        config={config}
        options={options}
      />
    </div>
  );
}
