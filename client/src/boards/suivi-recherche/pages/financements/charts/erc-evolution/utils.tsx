import type { Ratio } from "../../../../api";
import type { ErcEvolution, ErcVivierTaux, VivierContexte } from "../../../../api/erc.ts";
import TableauDonnees from "../../../../components/tableau-donnees.tsx";
import { formatNombre, formatPart, PEU_FIABLE } from "../../../../utils";
import type { Unites } from "../../comptage.ts";
import { formatTauxVivier, formatValeurVivier, TITRE_TAUX_VIVIER, UNITE_TAUX_VIVIER } from "../../vivier.ts";

type Annee = ErcEvolution["annees"][number];

// Les quatre indicateurs des chiffres clés, dans le même ordre et sous le même titre que les cartes
export type IndicateurEvolution = "candidatures" | "laureats" | "taux" | "vivier";

// Le taux de candidature au vivier n'est proposé que s'il est calculable (viviers activés, types avec panel, période)
export function getIndicateurs(unites: Unites, vivierDisponible: boolean): { key: IndicateurEvolution; label: string }[] {
  return [
    { key: "candidatures" as const, label: `${unites.Candidatures} ERC` },
    { key: "laureats" as const, label: `${unites.Laureats} ERC` },
    { key: "taux" as const, label: "Taux de succès ERC" },
    ...(vivierDisponible ? [{ key: "vivier" as const, label: TITRE_TAUX_VIVIER }] : []),
  ];
}

// Un point par année d'appel : valeur tracée, calcul en toutes lettres (infobulle, tableau) et fiabilité
export type PointSerie = { fiable: boolean; texte: string; valeur: number | null };

export type Serie = {
  color: string;
  name: string;
  points: PointSerie[];
  // Série de référence (ensemble de l'ERC ou des pays comparés, France) : sans zone provisoire
  reference: boolean;
  // Le trait distingue les séries sans reposer sur la seule couleur
  trait: "Solid" | "ShortDot" | "LongDash";
  // Axe des ordonnées (0 : gauche, 1 : droite)
  yAxis?: number;
};

// Ce que le graphique affiche pour un indicateur : années d'appel, séries, axe des ordonnées, mention « peu fiable »
export type Vue = {
  annees: Annee[];
  // Axe de gauche, puis axe de droite éventuel (part d'un effectif)
  axes: { titre: string; format: (valeur: number | null) => string }[];
  // Nom de l'indicateur de l'entité dans l'exemple de lecture
  nom: string;
  // Mention ajoutée à un point peu fiable : « moins de 20 candidatures »
  peuFiable: string;
  series: Serie[];
};

// Le calcul en toutes lettres : « 9,5 % (786 / 8 318 candidatures) », « 17,9 % (141 lauréats / 786 candidatures) »
export function formatRatio(ratio: Ratio, numerateur: string, denominateur: string): string {
  const calcul = numerateur === denominateur
    ? `${formatNombre(ratio.numerateur)} / ${formatNombre(ratio.denominateur)} ${denominateur}`
    : `${formatNombre(ratio.numerateur)} ${numerateur} / ${formatNombre(ratio.denominateur)} ${denominateur}`;
  return `${formatPart(ratio.valeur)} (${calcul})`;
}

// Entité, France (établissement sélectionné) et référence d'une année, chacune avec son point
type Points = { entite: PointSerie; france: PointSerie | null; reference: PointSerie };

// Entité (orange si établissement, bleu Marianne si France), France en tirets longs, référence en pointillés gris
function toSeries(points: Points[], entiteNom: string, referenceNom: string): Serie[] {
  const etablissement = points.length > 0 && points.every(({ france }) => france !== null);
  return [
    {
      name: entiteNom,
      color: etablissement ? "sr-etablissement-selectionne" : "sr-france",
      reference: false,
      trait: "Solid",
      points: points.map(({ entite }) => entite),
    },
    ...(etablissement
      ? [{ name: "France", color: "sr-france", reference: true, trait: "LongDash" as const, points: points.map(({ france }) => france!) }]
      : []),
    { name: referenceNom, color: "sr-etablissement", reference: true, trait: "ShortDot", points: points.map(({ reference }) => reference) },
  ];
}

// Effectif de l'entité (axe de gauche) et part qu'il représente dans son ensemble (axe de droite) : la France pour un
// établissement, l'ensemble de l'ERC pour la France. Pas de référence : un effectif ne se compare pas à celui de l'ensemble.
function getVueEffectif(data: ErcEvolution, champ: "candidatures" | "laureats", unites: Unites): Vue {
  const unite = unites[champ];
  const ensemble = data.ensemble === "france" ? `${unite} de la France` : `${unite} ERC`;
  const effectif = (d: Annee) => (champ === "candidatures" ? d.nb_candidatures : d.nb_laureats);
  return {
    annees: data.annees,
    axes: [
      { titre: `Nombre de ${unite}`, format: (valeur) => (valeur === null ? "—" : formatNombre(valeur)) },
      { titre: `Part des ${ensemble}`, format: formatPart },
    ],
    nom: `nombre de ${unite}`,
    peuFiable: `moins de ${data.seuil_fiabilite ?? 0} ${unites.candidatures}`,
    series: [
      {
        name: `Nombre de ${unite}`,
        color: data.ensemble === "france" ? "sr-etablissement-selectionne" : "sr-france",
        reference: false,
        trait: "Solid",
        yAxis: 0,
        points: data.annees.map((d) => ({ fiable: true, texte: `${formatNombre(effectif(d))} ${unite}`, valeur: effectif(d) })),
      },
      {
        name: `Part des ${ensemble}`,
        color: "sr-influence",
        reference: false,
        trait: "LongDash",
        yAxis: 1,
        points: data.annees.map((d) => {
          const part = d.part_ensemble[champ];
          return { fiable: d.fiable, texte: formatRatio(part, unite, ensemble), valeur: part.valeur };
        }),
      },
    ],
  };
}

function getVueTaux(data: ErcEvolution, entiteNom: string, { candidatures, laureats }: Unites): Vue {
  const point = (ratio: Ratio, fiable: boolean): PointSerie => ({
    fiable,
    texte: formatRatio(ratio, laureats, candidatures),
    valeur: ratio.valeur,
  });
  const points = data.annees.map((d) => ({
    entite: point(d.taux_succes, d.fiable),
    france: d.taux_succes_france && point(d.taux_succes_france, true),
    reference: point(d.taux_succes_reference, true),
  }));
  return {
    annees: data.annees,
    axes: [{ titre: "Taux de succès", format: formatPart }],
    nom: "taux de succès",
    peuFiable: `moins de ${data.seuil_fiabilite ?? 0} ${candidatures}`,
    series: toSeries(points, entiteNom, `Ensemble des ${candidatures} ERC`),
  };
}

// Candidatures de l'année pour 1 000 chercheurs du vivier fixe : seulement les appels de la période du vivier
function getVueVivier(data: ErcEvolution, entiteNom: string, unites: Unites): Vue {
  const vivier = (data.vivier as VivierContexte).vivier;
  const annees = data.annees.filter((d) => d.vivier !== null);
  const point = (taux: ErcVivierTaux["taux"]): PointSerie => ({
    fiable: taux.fiable,
    texte: formatTauxVivier(taux, vivier, unites),
    valeur: taux.valeur,
  });
  const points = annees.map((d) => ({
    entite: point(d.vivier!.taux),
    france: d.vivier!.france && point(d.vivier!.france),
    reference: point(d.vivier!.reference),
  }));
  return {
    annees,
    axes: [{ titre: `Candidatures ${UNITE_TAUX_VIVIER}`, format: formatValeurVivier }],
    nom: `${unites.candidatures} ${UNITE_TAUX_VIVIER}`,
    peuFiable: `moins de ${data.seuil_fiabilite ?? 0} ${unites.candidatures}`,
    series: toSeries(points, entiteNom, `Ensemble des ${annees[0]?.vivier?.nb_pays_reference ?? ""} pays comparés`),
  };
}

// Séries du graphique et colonnes du tableau pour l'indicateur choisi (valeurs déjà calculées par le serveur).
// `unites` : unités du mode de comptage des données affichées (projets ou porteurs).
export function getVue(data: ErcEvolution, indicateur: IndicateurEvolution, entiteNom: string, unites: Unites): Vue {
  if (indicateur === "taux") return getVueTaux(data, entiteNom, unites);
  if (indicateur === "vivier") return getVueVivier(data, entiteNom, unites);
  return getVueEffectif(data, indicateur, unites);
}

// Exemple de lecture : dernier appel consolidé (sinon le dernier appel) où l'entité a une valeur, série par série avec son calcul
export function getLecture(provisoires: number[], { annees, nom, series }: Vue, entiteNom: string): string | null {
  const indices = annees.map((_, i) => i).filter((i) => series[0]?.points[i]?.valeur !== null);
  const consolides = indices.filter((i) => !provisoires.includes(annees[i].annee_appel));
  const i = (consolides.length > 0 ? consolides : indices).pop();
  if (i === undefined) return null;
  // La première série porte le nom de l'indicateur, les suivantes (part, France, ensemble) le leur
  const libelle = (serie: Serie, rang: number) => (rang === 0 ? nom : serie.name);
  return `Appel ${annees[i].annee_appel}, ${entiteNom} : ${series.map((serie, rang) => `${libelle(serie, rang)} = ${serie.points[i].texte}`).join(" ; ")}.`;
}

export function getCategorie(annee: number, provisoire: boolean): string {
  return provisoire ? `${annee} (provisoire)` : String(annee);
}

// Vue tableau : chaque valeur avec son calcul, année d'appel par année d'appel
export function renderDataTable({ annees, series }: Vue, caption: string) {
  return (
    <TableauDonnees caption={caption}>
      <thead>
        <tr>
          <th scope="col">Année d'appel</th>
          {series.map(({ name }) => <th key={name} scope="col">{name}</th>)}
        </tr>
      </thead>
      <tbody>
        {annees.map((d, index) => (
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
    </TableauDonnees>
  );
}
