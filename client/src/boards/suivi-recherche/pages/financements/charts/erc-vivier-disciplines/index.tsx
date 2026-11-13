import { Alert, Notice } from "@dataesr/dsfr-plus";
import { useMemo } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useErcDisciplines } from "../../../../api/erc.ts";
import type { ErcDisciplinePoint, ErcMeta, ErcOptions, ErcVivierDisciplines, VivierIndisponible } from "../../../../api/erc.ts";
import type { Selection } from "../../../../api";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import LegendeTailles from "../../../../components/matrice/legende-tailles.tsx";
import { LegendeDomaines } from "../../../../components/matrice/legendes.tsx";
import { Pastille } from "../../../../components/matrice/libelles.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { formatPart, formatPeriode, getDomaineColor } from "../../../../utils";
import { formatValeurVivier, getCommentaireVivier, getTexteIndisponible } from "../../vivier.ts";
import getNuageOptions from "../../components/nuage-vivier/options.ts";
import type { RenduNuage } from "../../components/nuage-vivier/options.ts";
import QuadrantsVivier from "../../components/nuage-vivier/quadrants.tsx";
import { getLectureNuage, getTextesNuage } from "../../components/nuage-vivier/utils.ts";

import "../../../../components/matrice/styles.scss";

type Nuage = Extract<Extract<ErcVivierDisciplines, { vivier: unknown }>["vivier"], { entite: unknown }>;

const cle = (p: ErcDisciplinePoint) => p.discipline_code;
const nom = (p: ErcDisciplinePoint) => `${p.discipline_code} · ${p.discipline_nom}`;
// Couleur du domaine ERC (couleurs globales, les mêmes que la matrice des disciplines de la bibliométrie)
const couleur = (p: ErcDisciplinePoint) => getDomaineColor(p.domaine_code);
const RENDU: RenduNuage<ErcDisciplinePoint> = {
  couleur,
  entete: (p) => [`<b>${nom(p)}</b>`, p.domaine_nom],
  etiquette: cle,
  focus: () => false,
  nomSerie: "Disciplines",
};

const libelle = (p: ErcDisciplinePoint) => (
  <>
    <Pastille couleur={couleur(p)} />
    {nom(p)}
  </>
);

function NuageDisciplines({ data, entiteNom, meta }: { data: Nuage; entiteNom: string; meta: ErcMeta }) {
  const chartOptions = useMemo(() => (data.points.length > 0 ? getNuageOptions(data, RENDU) : null), [data]);
  const textes = getTextesNuage(data);

  if (!chartOptions) {
    return (
      <p className="fr-text--sm">
        {`Aucune discipline de ${entiteNom} n'a de candidature ERC et de chercheurs dans le vivier sur ces appels : élargissez la période ou cochez d'autres types de bourse.`}
      </p>
    );
  }

  const { candidature, succes } = data.references;
  const pointMedian = (code: string | null) => data.points.find((p) => p.discipline_code === code);
  const medianeX = pointMedian(candidature.point);
  const medianeY = pointMedian(succes.point);
  const horsCadre = data.points.filter((p) => p.hors_cadre);
  // Exemple de lecture : la plus grosse bulle (points triés par taille décroissante par le serveur)
  const pointLu = data.points[0];
  const { entite } = data;
  const domaines = [...new Map(data.points.map((p) => [p.domaine_code, p.domaine_nom])).entries()];

  const legend = (
    <div className="sr-matrice-legende">
      <LegendeDomaines domaines={domaines} />
      <LegendeTailles periode={data.appels} tailles={data.tailles} textes={textes} />
    </div>
  );

  return (
    <>
      <ChartWrapper
        config={{
          id: "suivi-recherche-financements-erc-vivier-disciplines",
          title: { fr: `Candidature au vivier et taux de succès ERC par discipline · ${entiteNom} · appels ${formatPeriode(data.appels)}`, look: "h5" as const },
          comment: {
            fr: (
              <>
                {`Chaque bulle est une discipline (panel ERC) de ${entiteNom}. `}
                {`Horizontal : ${getCommentaireVivier(data, "chaque discipline de l'entité")} Échelle logarithmique. `}
                {`Vertical : taux de succès, ${textes.unites.laureats} (structure de signature) / ${textes.unites.candidatures} (structure de dépôt), mêmes appels et mêmes panels. `}
                {`Ligne verticale en tirets : médiane des disciplines, ${formatValeurVivier(candidature.valeur)}${medianeX ? `, celle de ${medianeX.discipline_code}` : ""}. `}
                {`Ligne horizontale : médiane des disciplines, ${formatPart(succes.valeur)}${medianeY ? `, celle de ${medianeY.discipline_code} (${textes.calculSucces(medianeY.succes)})` : ""}. `}
                {`${entiteNom}, toutes disciplines : ${formatValeurVivier(entite.candidature.valeur)} candidatures par an pour 1 000 chercheurs, taux de succès ${formatPart(entite.succes.valeur)} (${textes.calculSucces(entite.succes)}). `}
                {horsCadre.length > 0 && `Posées sur le bord du cadre, avec un triangle : taux de succès peu fiables et très éloignés des autres, ${horsCadre.map((p) => `${p.discipline_code} (${formatPart(p.succes.valeur)})`).join(", ")}. `}
                {`Taille : ${textes.unites.laureats}. Bulles vides : ${textes.peuFiable}, position peu fiable.`}
                {data.exclus.length > 0 && ` Disciplines non représentées (aucune candidature ou aucun chercheur dans le vivier) : ${data.exclus.join(", ")}.`}
              </>
            ),
          },
          readingKey: { fr: <>{getLectureNuage(data, pointLu, `${entiteNom}, ${nom(pointLu)}`)}</> },
          sources: getChartSources([...meta.sources, ...(meta.vivier?.sources ?? [])]),
        }}
        legend={legend}
        options={chartOptions}
      />
      <QuadrantsVivier cle={cle} colonne="Discipline" data={data} libelle={libelle} vide="Aucune discipline." />
    </>
  );
}

type ErcVivierDisciplinesProps = {
  entiteNom: string;
  meta: ErcMeta;
  options: ErcOptions;
  selection: Selection;
};

// « Dans quelles disciplines l'entité candidate-t-elle peu mais réussit-elle bien ? » : taux de candidature au vivier
// × taux de succès, une bulle par discipline
export default function ErcVivierDisciplinesChart({ entiteNom, meta, options, selection }: ErcVivierDisciplinesProps) {
  const { data, isError, isLoading, isPlaceholderData } = useErcDisciplines(selection, options);
  // Réponse appliquée une fois le grisé peint : le redessin du nuage n'est jamais muet
  const { applied, busy } = useRenderTransition(data);
  const filtreDiscipline = Boolean(selection.disciplineCode || selection.domaineCode);

  if (isError) return <Alert description="Le nuage des disciplines n'a pas pu être chargé." title="Erreur de chargement" variant="error" />;
  if (isLoading || !applied) return <DefaultSkeleton height="560px" />;
  if (!applied.periode) return null;
  if (applied.vivier.indisponible) {
    return <Notice closeMode="disallow" type="info">{getTexteIndisponible(applied.vivier as VivierIndisponible)}</Notice>;
  }

  return (
    <>
      {filtreDiscipline && (
        <p className="fr-text--sm fr-text-mention--grey">Chaque bulle est une discipline : le filtre de discipline ne s'applique pas à ce graphique.</p>
      )}
      <ChartBusy busy={isPlaceholderData || busy}>
        <NuageDisciplines data={applied.vivier as Nuage} entiteNom={entiteNom} meta={meta} />
      </ChartBusy>
    </>
  );
}
