import { Alert } from "@dataesr/dsfr-plus";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useMemo } from "react";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { getCssColor } from "../../../../../../utils/colors";
import type { Entite, Selection } from "../../../../api";
import { useInnovationEvolution } from "../../../../api/innovation.ts";
import type { InnovationMeta, StartupsEvolution } from "../../../../api/innovation.ts";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import TableauDonnees from "../../../../components/tableau-donnees.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { formatNombre } from "../../../../utils";

type Props = {
  entites: Entite[];
  meta: InnovationMeta;
  selection: Selection;
};

type Annee = StartupsEvolution["annees"][number];

function libelleAnnee(annee: Annee) {
  return annee.provisoire ? `${annee.annee} (provisoire)` : String(annee.annee);
}

function getOptions(annees: Annee[]) {
  const options: HighchartsInstance.Options = {
    chart: { height: 400 },
    xAxis: {
      categories: annees.map(libelleAnnee),
      title: { text: "Année de création" },
    },
    yAxis: {
      min: 0,
      allowDecimals: false,
      title: { text: "Start-ups créées (SIREN distincts)" },
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.key}</b><br/>Start-ups créées : <b>${formatNombre(Number(this.y ?? 0))}</b>`;
      },
    },
    series: [{
      type: "column",
      name: "SIREN distincts",
      color: getCssColor("sr-poids"),
      data: annees.map(({ nb_startups }) => nb_startups),
    }],
  };
  return createChartOptions("column", options);
}

function getLecture(annees: Annee[], entiteNom: string) {
  const completes = annees.filter(({ provisoire, nb_startups }) => !provisoire && nb_startups !== null);
  const annee = completes[completes.length - 1] ?? annees[annees.length - 1];
  if (!annee || annee.nb_startups === null) return null;
  const nombre = formatNombre(annee.nb_startups);
  const pluriel = annee.nb_startups > 1 ? "s" : "";
  return `En ${annee.annee}, ${entiteNom} compte ${nombre} start-up${pluriel} recensée${pluriel} créée${pluriel}.`;
}

function renderTable(annees: Annee[], caption: string) {
  return (
    <TableauDonnees caption={caption}>
      <thead>
        <tr>
          <th scope="col">Année de création</th>
          <th scope="col">Start-ups créées (SIREN distincts)</th>
        </tr>
      </thead>
      <tbody>
        {annees.map(({ annee, nb_startups, provisoire }) => (
          <tr key={annee}>
            <th scope="row">{libelleAnnee({ annee, nb_startups, provisoire })}</th>
            <td>{nb_startups === null ? "—" : formatNombre(nb_startups)}</td>
          </tr>
        ))}
      </tbody>
    </TableauDonnees>
  );
}

export default function StartupsEvolutionChart({ entites, meta, selection }: Props) {
  const query = useInnovationEvolution(selection);
  const entiteNom = selection.entiteId === "FR"
    ? "la France"
    : entites.find(({ entite_id: id }) => id === selection.entiteId)?.nom ?? selection.entiteId;
  const demande = useMemo(
    () => (query.data ? { data: query.data, entiteNom, meta } : null),
    [entiteNom, meta, query.data],
  );
  const { applied, busy } = useRenderTransition(demande);
  const options = useMemo(
    () => (applied?.data.annees.length ? getOptions(applied.data.annees) : null),
    [applied],
  );

  if (query.isError) {
    return (
      <Alert
        description="L’évolution annuelle des créations de start-ups n’a pas pu être chargée."
        title="Erreur de chargement"
        variant="error"
      />
    );
  }
  if (query.isLoading || !applied) return <DefaultSkeleton />;
  if (!applied.data.annees.length || !options) {
    return <p className="fr-text--sm">Aucune donnée de création pour cette sélection.</p>;
  }

  const titre = `Créations de start-ups par année · ${applied.entiteNom}`;
  const lecture = getLecture(applied.data.annees, applied.entiteNom);
  const controles = applied.meta.controles;
  const anneesProvisoires = applied.data.annees.filter(({ provisoire }) => provisoire).map(({ annee }) => annee);

  return (
    <ChartBusy busy={query.isPlaceholderData || busy}>
      <ChartWrapper
        config={{
          id: "suivi-recherche-innovation-startups-evolution",
          title: { fr: titre, look: "h5" as const },
          comment: {
            fr: (
              <>
                {"Nombre de SIREN distincts par année de création, toutes disciplines. France : chaque SIREN valide compte une fois, même sans structure liée exploitable. Pour un établissement, un SIREN est compté une fois si au moins un SIRET lié se résout vers un ROR unique ; une startup peut être comptée pour plusieurs établissements. "}
                {controles.nb_sirets_ambigus}{" "}
                {" SIRET sont ambigus et "}
                {controles.nb_sirets_non_resolus}{" "}
                {" ne sont pas résolus parmi "}
                {controles.nb_sirets_distincts}{" "}
                {" SIRET distincts. Le recensement est incomplet : un zéro observé n’établit pas l’absence de création. "}
                {meta.date_observation && `État de la source au ${meta.date_observation}. `}
                {anneesProvisoires.length > 0 && `${anneesProvisoires.join(", ")} : année provisoire.`}
              </>
            ),
          },
          ...(lecture && { readingKey: { fr: <>{lecture}</> } }),
          sources: getChartSources(applied.meta.sources),
        }}
        options={options}
        renderData={() => renderTable(applied.data.annees, titre)}
      />
    </ChartBusy>
  );
}
