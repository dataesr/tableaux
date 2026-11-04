import type { Ratio } from "../../../../api";
import type { ErcEvolution } from "../../../../api/erc.ts";
import { formatNombre, formatPart } from "../../../../utils";

export const INDICATEURS = [
  { key: "parts", label: "Parts dans l'ERC" },
  { key: "taux", label: "Taux de succès" },
] as const;

export type IndicateurEvolution = (typeof INDICATEURS)[number]["key"];

export type Serie = {
  color: string;
  name: string;
  // Une valeur par année d'appel, avec son numérateur et son dénominateur
  ratios: Ratio[];
  // Série de référence (ensemble de l'ERC) : trait pointillé, pour ne pas reposer sur la seule couleur
  reference: boolean;
  unites: { numerateur: string; denominateur: string };
};

// Le calcul en toutes lettres : « 9,5 % (786 / 8 318 candidatures) », « 17,9 % (141 lauréats / 786 candidatures) »
export function formatRatio(ratio: Ratio, { numerateur, denominateur }: Serie["unites"]): string {
  const calcul = numerateur === denominateur
    ? `${formatNombre(ratio.numerateur)} / ${formatNombre(ratio.denominateur)} ${denominateur}`
    : `${formatNombre(ratio.numerateur)} ${numerateur} / ${formatNombre(ratio.denominateur)} ${denominateur}`;
  return `${formatPart(ratio.valeur)} (${calcul})`;
}

// Séries du graphique et colonnes du tableau, pour l'indicateur choisi (ratios déjà calculés par le serveur)
export function getSeries(data: ErcEvolution["annees"], indicateur: IndicateurEvolution, entiteNom: string): Serie[] {
  if (indicateur === "taux") {
    const unites = { numerateur: "lauréats", denominateur: "candidatures" };
    return [
      { name: entiteNom, color: "sr-focus", reference: false, ratios: data.map((d) => d.taux_succes), unites },
      { name: "Ensemble des candidatures ERC", color: "sr-etablissement", reference: true, ratios: data.map((d) => d.taux_succes_reference), unites },
    ];
  }
  // Écart entre les deux courbes : lauréats au-dessus des candidatures = réussite supérieure à la moyenne
  return [
    {
      name: "Part des candidatures ERC",
      color: "sr-focus",
      reference: false,
      ratios: data.map((d) => d.part_candidatures),
      unites: { numerateur: "candidatures", denominateur: "candidatures" },
    },
    {
      name: "Part des lauréats ERC",
      color: "sr-influence",
      reference: false,
      ratios: data.map((d) => d.part_laureats),
      unites: { numerateur: "lauréats", denominateur: "lauréats" },
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
                    {series.map((serie) => (
                      <td key={serie.name}>
                        {formatRatio(serie.ratios[index], serie.unites)}
                        {!serie.reference && !d.fiable && ` · ${PEU_FIABLE}`}
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
