import { useMemo } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import type { ErcMeta, ErcVivierNuage, ErcVivierPoint } from "../../../../api/erc.ts";
import LegendeTailles from "../../../../components/matrice/legende-tailles.tsx";
import { LegendeEtablissements } from "../../../../components/matrice/legendes.tsx";
import { LibelleEtablissement } from "../../../../components/matrice/libelles.tsx";
import { getNomCourt } from "../../../../components/matrice/utils.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { formatPart, formatPeriode, getEtablissementColor } from "../../../../utils";
import { formatValeurVivier, getCommentaireVivier } from "../../vivier.ts";
import getNuageOptions from "../../components/nuage-vivier/options.ts";
import type { RenduNuage } from "../../components/nuage-vivier/options.ts";
import QuadrantsVivier from "../../components/nuage-vivier/quadrants.tsx";
import { getLectureNuage, getTextesNuage } from "../../components/nuage-vivier/utils.ts";

import "../../../../components/matrice/styles.scss";

const nom = (p: ErcVivierPoint) => p.sigle ?? p.nom;
const cle = (p: ErcVivierPoint) => p.entite_id;
const RENDU: RenduNuage<ErcVivierPoint> = {
  couleur: (p) => getEtablissementColor(p.focus),
  entete: (p) => [`<b>${p.nom}</b>${p.sigle ? ` (${p.sigle})` : ""}`, p.categorie],
  etiquette: (p) => getNomCourt(nom(p), 22),
  focus: (p) => p.focus,
  nomSerie: "Établissements",
};

const libelle = (p: ErcVivierPoint) => (
  <LibelleEtablissement couleur={getEtablissementColor(p.focus)} focus={p.focus} nom={p.nom} sigle={p.sigle} />
);

type ErcVivierEtablissementsProps = {
  data: ErcVivierNuage;
  disciplineLabel: string;
  entiteNom: string;
  groupeLibelle: string;
  meta: ErcMeta;
};

// « Qui candidate peu mais réussit bien ? » : taux de candidature au vivier × taux de succès des établissements d'un groupe
export default function ErcVivierEtablissements({ data, disciplineLabel, entiteNom, groupeLibelle, meta }: ErcVivierEtablissementsProps) {
  const chartOptions = useMemo(() => (data.points.length > 0 ? getNuageOptions(data, RENDU) : null), [data]);
  const textes = getTextesNuage(data);
  const titre = `Candidature au vivier et taux de succès ERC des établissements · ${groupeLibelle} · ${disciplineLabel} · appels ${formatPeriode(data.appels)}`;

  if (!chartOptions) {
    return (
      <p className="fr-text--sm">
        Aucun établissement de ce groupe n'a de candidature ERC et de chercheurs dans le vivier pour cette sélection : choisissez une autre discipline ou un autre groupe.
      </p>
    );
  }

  const { candidature, succes } = data.references;
  const pointMedian = (id: string | null) => data.points.find((p) => p.entite_id === id);
  const medianeX = pointMedian(candidature.point);
  const medianeY = pointMedian(succes.point);
  const horsCadre = data.points.filter((p) => p.hors_cadre);
  const pointLu = data.points.find((p) => p.focus) ?? data.points[0];
  const { france } = data;

  const legend = (
    <div className="sr-matrice-legende">
      <LegendeEtablissements entiteNom={data.points.some((p) => p.focus) ? entiteNom : null} groupe={groupeLibelle} />
      <LegendeTailles periode={data.appels} tailles={data.tailles} textes={textes} />
    </div>
  );

  return (
    <>
      <ChartWrapper
        config={{
          id: "suivi-recherche-financements-erc-vivier-etablissements",
          title: { fr: titre, look: "h5" as const },
          comment: {
            fr: (
              <>
                {`Horizontal : ${getCommentaireVivier(data, "chaque établissement")} Échelle logarithmique. `}
                {`Vertical : taux de succès, ${textes.unites.laureats} (structure de signature) / ${textes.unites.candidatures} (structure de dépôt), mêmes appels et mêmes panels. `}
                {`Ligne verticale en tirets : médiane du groupe, ${formatValeurVivier(candidature.valeur)}${medianeX ? `, celle de ${nom(medianeX)}` : ""}. `}
                {`Ligne horizontale : médiane du groupe, ${formatPart(succes.valeur)}${medianeY ? `, celle de ${nom(medianeY)} (${textes.calculSucces(medianeY.succes)})` : ""}. `}
                {`France entière : ${formatValeurVivier(france.candidature.valeur)} candidatures par an pour 1\u00a0000 chercheurs, taux de succès ${formatPart(france.succes.valeur)} (${textes.calculSucces(france.succes)}). `}
                {horsCadre.length > 0 && `Posés sur le bord du cadre, avec un triangle : taux de succès peu fiables et très éloignés des autres, ${horsCadre.map((p) => `${nom(p)} (${formatPart(p.succes.valeur)})`).join(", ")}. `}
                {`Taille : ${textes.unites.laureats}. Bulles vides : ${textes.peuFiable}, position peu fiable. `}
                {"Un chercheur ou une bourse comptent pour plusieurs établissements (UMR et tutelles) : les taux ne s'additionnent pas."}
                {data.exclus.length > 0 && ` ${data.exclus.length} établissement(s) non représenté(s) : aucune candidature ou aucun chercheur dans le vivier.`}
              </>
            ),
          },
          readingKey: { fr: <>{getLectureNuage(data, pointLu, pointLu.nom)}</> },
          sources: getChartSources([...meta.sources, ...(meta.vivier?.sources ?? [])]),
        }}
        legend={legend}
        options={chartOptions}
      />
      <QuadrantsVivier cle={cle} colonne="Établissement" data={data} libelle={libelle} vide="Aucun établissement." />
    </>
  );
}
