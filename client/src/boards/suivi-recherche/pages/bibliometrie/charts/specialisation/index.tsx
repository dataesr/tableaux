import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioSpecialisation } from "../../../../api";
import type { BiblioMeta, BiblioOptions, Selection, Specialisation, SpecialisationVue } from "../../../../api";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatIndice, formatPeriode } from "../../../../utils";
import getOptions from "./options.tsx";
import { formatVariation, getLectureSpecialisation, LegendeSpecialisation, TableSpecialisation } from "./utils.tsx";

import "../../../../components/rubans/styles.scss";

const VUES: Record<SpecialisationVue, string> = {
  niveau: "Niveau",
  evolution: "Évolution",
};

type SpecialisationProps = {
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

// Titre et commentaire de la vue affichée
function getTextes(data: Specialisation, vue: SpecialisationVue) {
  const regroupement = (
    <>
      Les pays sont regroupés par similarité de profil (classification hiérarchique sur l'indice de la période : deux pays
      sont proches lorsqu'ils sont sur- et sous-représentés dans les mêmes disciplines, quelle que soit l'ampleur) et
      découpés en {data.groupes.length} groupes, séparés par un trait ; les lignes sont les mêmes dans les deux vues.
      La France, encadrée, est en tête, suivie des pays au profil le plus proche du sien. Les disciplines citées pour un
      groupe sont celles où l'ensemble de ses articles est le plus sur-représenté.
    </>
  );
  const comptage = (
    <>
      Un article cosigné par plusieurs pays compte entièrement pour chacun : les disciplines très collaboratives, comme les
      sciences de l'univers (PE9), ressortent chez tous les pays qui y participent.
    </>
  );

  if (vue === "niveau") {
    return {
      titre: `Spécialisation disciplinaire des pays · ${formatPeriode(data.periode)}`,
      commentaire: (
        <>
          Indice de spécialisation = part de la discipline dans les articles du pays ÷ part de la discipline dans les articles
          mondiaux, calculé sur le nombre d'articles de la période, pour toutes les disciplines quelle que soit la discipline
          sélectionnée. Au-dessus de 1, le pays publie relativement plus dans la discipline que le monde ; en dessous,
          relativement moins. L'indice est relatif : il monte dans une discipline quand le pays y publie plus, mais aussi
          quand il publie moins dans les autres. {comptage}
          {" "}Couleurs saturées en dessous de {formatIndice(data.echelles.niveau.min)} et au-dessus
          de {formatIndice(data.echelles.niveau.max)}. * Peu fiable : moins de {data.seuil_fiabilite} articles du pays
          dans la discipline. {regroupement}
        </>
      ),
    };
  }

  const { arrivee, depart } = data.periodes!;
  return {
    titre: `Évolution de la spécialisation disciplinaire des pays · ${formatPeriode(depart)} → ${formatPeriode(arrivee)}`,
    commentaire: (
      <>
        Variation de l'indice de spécialisation (part de la discipline dans les articles du pays ÷ part dans les articles
        mondiaux) entre la période de départ ({formatPeriode(depart)}) et la période d'arrivée ({formatPeriode(arrivee)}),
        de 1 à 3 années à chaque bout de la période choisie. Une hausse signifie que le pays se renforce dans la discipline
        relativement au monde : il peut y publier de moins en moins et progresser quand même, si le monde y recule plus
        vite ; une baisse peut venir d'une croissance moins rapide que celle du monde, Chine comprise. {comptage}
        {" "}Couleurs saturées en dessous de {formatVariation((data.echelles.evolution.min - 1) * 100)} et au-dessus
        de {formatVariation((data.echelles.evolution.max - 1) * 100)}. * Peu fiable : moins
        de {data.seuil_fiabilite} articles du pays dans la discipline sur l'une des deux périodes. {regroupement}
      </>
    ),
  };
}

export default function SpecialisationPays({ meta, options, selection }: SpecialisationProps) {
  const [vue, setVue] = useState<SpecialisationVue>("niveau");
  const { data, isLoading, isError, isPlaceholderData } = useBiblioSpecialisation(selection, options);

  // Les deux vues sont dans la réponse : changer de vue ne relance pas de requête, mais redessine 700 cases.
  // Toute nouvelle valeur (données ou vue) n'est appliquée qu'une fois le grisé peint.
  const demande = useMemo(() => ({ data, vue }), [data, vue]);
  const { applied, busy } = useRenderTransition(demande);
  const chartOptions = useMemo(
    () => (applied.data ? getOptions(applied.data, applied.vue, ENTITE_NATIONALE) : null),
    [applied],
  );

  const controle = (
    <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Vue" name="sr-specialisation-vue">
      {(Object.keys(VUES) as SpecialisationVue[]).map((key) => (
        <SegmentedElement checked={vue === key} key={key} label={VUES[key]} onClick={() => setVue(key)} value={key} />
      ))}
    </SegmentedControl>
  );

  if (isError) {
    return (
      <>
        {controle}
        <Alert description="La spécialisation des pays n'a pas pu être chargée." title="Erreur de chargement" variant="error" />
      </>
    );
  }
  if (isLoading || !applied.data) {
    return (
      <>
        {controle}
        <DefaultSkeleton height="760px" />
      </>
    );
  }

  // Titre, commentaire, lecture et tableau décrivent la carte affichée (valeurs appliquées)
  const affiche = applied.data;
  let contenu;
  if (applied.vue === "evolution" && !affiche.periodes) {
    contenu = (
      <Alert
        description="L'évolution compare une période de départ et une période d'arrivée : choisissez une période d'au moins deux ans."
        title="Période trop courte"
        variant="info"
      />
    );
  } else if (!chartOptions) {
    contenu = <Alert description="Aucune publication pour cette période : élargissez-la." title="Aucune donnée" variant="info" />;
  } else {
    const { titre, commentaire } = getTextes(affiche, applied.vue);
    const lecture = getLectureSpecialisation(affiche, applied.vue, ENTITE_NATIONALE);
    const config = {
      id: "suivi-recherche-bibliometrie-specialisation-pays",
      title: { fr: titre, look: "h5" as const },
      comment: { fr: commentaire },
      ...(lecture && { readingKey: { fr: <>{lecture}</> } }),
      sources: getChartSources(meta.sources),
    };
    contenu = (
      <ChartWrapper
        config={config}
        legend={<LegendeSpecialisation data={affiche} vue={applied.vue} />}
        options={chartOptions}
        renderData={() => (
          <TableSpecialisation
            caption={applied.vue === "niveau"
              ? `Indice de spécialisation des pays par discipline, ${formatPeriode(affiche.periode)}, et part de chaque discipline dans les articles`
              : "Évolution de l'indice de spécialisation des pays par discipline, indices et parts de départ et d'arrivée"}
            data={affiche}
            vue={applied.vue}
          />
        )}
      />
    );
  }

  return (
    <>
      {controle}
      {/* Grisé pendant l'appel API (réponse précédente affichée) et pendant le redessin */}
      <ChartBusy busy={isPlaceholderData || busy}>{contenu}</ChartBusy>
    </>
  );
}
