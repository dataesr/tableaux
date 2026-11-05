import type { Ratio } from "../../../../api";
import type { ErcEvolution } from "../../../../api/erc.ts";
import { formatIndice, formatNombre, formatPart } from "../../../../utils";
import type { UNITES } from "../../comptage.ts";
import { formatIndiceCandidature, formatIndiceLaureats, formatIndiceReussite } from "../../indice.ts";

type Unites = (typeof UNITES)[keyof typeof UNITES];
type Annee = ErcEvolution["annees"][number];

export const INDICATEURS = [
  { key: "parts", label: "Parts dans l'ERC" },
  { key: "taux", label: "Taux de succès" },
  { key: "indices", label: "Indice de candidature" },
] as const;

export type IndicateurEvolution = (typeof INDICATEURS)[number]["key"];

// Axe des ordonnées : parts et taux en pourcentage, indices autour de 1
export const AXES: Record<IndicateurEvolution, { titre: string; format: (valeur: number | null) => string }> = {
  parts: { titre: "Part de l'ensemble de l'ERC", format: formatPart },
  taux: { titre: "Taux de succès", format: formatPart },
  indices: { titre: "Indice (pays de l'UE = 1)", format: formatIndice },
};

// Un point par année d'appel : valeur tracée, calcul en toutes lettres (infobulle, tableau) et fiabilité
export type PointSerie = { fiable: boolean; texte: string; valeur: number | null };

export type Serie = {
  color: string;
  name: string;
  points: PointSerie[];
  // Série de référence (ensemble de l'ERC, France) : sans zone provisoire
  reference: boolean;
  // Le trait distingue les séries sans reposer sur la seule couleur
  trait: "Solid" | "ShortDot" | "LongDash";
};

// Le calcul en toutes lettres : « 9,5 % (786 / 8 318 candidatures) », « 17,9 % (141 lauréats / 786 candidatures) »
export function formatRatio(ratio: Ratio, numerateur: string, denominateur: string): string {
  const calcul = numerateur === denominateur
    ? `${formatNombre(ratio.numerateur)} / ${formatNombre(ratio.denominateur)} ${denominateur}`
    : `${formatNombre(ratio.numerateur)} ${numerateur} / ${formatNombre(ratio.denominateur)} ${denominateur}`;
  return `${formatPart(ratio.valeur)} (${calcul})`;
}

const SANS_INDICE: PointSerie = { fiable: true, texte: "—", valeur: null };

// Trois indices, référence = 1 ; indice des lauréats = indice de candidature × indice de réussite
function getSeriesIndices(data: ErcEvolution["annees"], libelles: Unites): Serie[] {
  const points = (point: (indices: NonNullable<Annee["indices"]>) => Omit<PointSerie, "fiable">) => data.map((d) => (
    d.indices ? { fiable: d.indices.fiable, ...point(d.indices) } : SANS_INDICE
  ));
  return [
    {
      name: "Indice de candidature",
      color: "sr-focus",
      reference: false,
      trait: "Solid",
      points: points(({ candidature }) => ({ texte: formatIndiceCandidature(candidature, libelles), valeur: candidature.valeur })),
    },
    {
      name: "Indice de réussite",
      color: "sr-influence",
      reference: false,
      trait: "LongDash",
      points: points(({ reussite }) => ({ texte: formatIndiceReussite(reussite), valeur: reussite.valeur })),
    },
    {
      name: "Indice des lauréats",
      color: "sr-prestige",
      reference: false,
      trait: "ShortDot",
      points: points(({ laureats }) => ({ texte: formatIndiceLaureats(laureats, libelles), valeur: laureats.valeur })),
    },
  ];
}

// Séries du graphique et colonnes du tableau, pour l'indicateur choisi (ratios déjà calculés par le serveur).
// `libelles` : unités du mode de comptage des données affichées (projets ou porteurs).
export function getSeries(data: ErcEvolution["annees"], indicateur: IndicateurEvolution, entiteNom: string, libelles: Unites): Serie[] {
  if (indicateur === "indices") return getSeriesIndices(data, libelles);

  const { candidatures, laureats } = libelles;
  const point = (ratio: Ratio, fiable: boolean, numerateur: string, denominateur: string): PointSerie => ({
    fiable,
    texte: formatRatio(ratio, numerateur, denominateur),
    valeur: ratio.valeur,
  });

  if (indicateur === "taux") {
    // Établissement sélectionné : la France (bleu Marianne) s'ajoute à l'ensemble de l'ERC comme référence
    const etablissement = data.some((d) => d.taux_succes_france);
    const reference = (ratios: Ratio[]) => ratios.map((ratio) => point(ratio, true, laureats, candidatures));
    const france: Serie = {
      name: "France",
      color: "sr-france",
      reference: true,
      trait: "LongDash",
      points: reference(data.map((d) => d.taux_succes_france as Ratio)),
    };
    return [
      {
        name: entiteNom,
        color: etablissement ? "sr-etablissement-selectionne" : "sr-france",
        reference: false,
        trait: "Solid",
        points: data.map((d) => point(d.taux_succes, d.fiable, laureats, candidatures)),
      },
      ...(etablissement ? [france] : []),
      {
        name: `Ensemble des ${candidatures} ERC`,
        color: "sr-etablissement",
        reference: true,
        trait: "ShortDot",
        points: reference(data.map((d) => d.taux_succes_reference)),
      },
    ];
  }

  // Écart entre les deux courbes : lauréats au-dessus des candidatures = réussite supérieure à la moyenne
  return [
    {
      name: `Part des ${candidatures} ERC`,
      color: "sr-focus",
      reference: false,
      trait: "Solid",
      points: data.map((d) => point(d.part_candidatures, d.fiable, candidatures, candidatures)),
    },
    {
      name: `Part des ${laureats} ERC`,
      color: "sr-influence",
      reference: false,
      trait: "Solid",
      points: data.map((d) => point(d.part_laureats, d.fiable, laureats, laureats)),
    },
  ];
}

export function getCategorie(annee: number, provisoire: boolean): string {
  return provisoire ? `${annee} (provisoire)` : String(annee);
}

export const PEU_FIABLE = "peu fiable";

// Vue tableau : chaque valeur avec son calcul, année d'appel par année d'appel
export function renderDataTable(data: ErcEvolution["annees"], series: Serie[], caption: string) {
  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{caption}</caption>
              <thead>
                <tr>
                  <th scope="col">Année d'appel</th>
                  {series.map(({ name }) => <th key={name} scope="col">{name}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((d, index) => (
                  <tr key={d.annee_appel}>
                    <th scope="row">{getCategorie(d.annee_appel, d.provisoire)}</th>
                    {series.map(({ name, points }) => (
                      <td key={name}>
                        {points[index].texte}
                        {!points[index].fiable && ` · ${PEU_FIABLE}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
