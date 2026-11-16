import type { Ratio } from "../../../../api";
import type { ErcDisciplinePoint, ErcVivierDisciplines, TauxVivier } from "../../../../api/erc.ts";
import TableauDonnees from "../../../../components/tableau-donnees.tsx";
import { formatNombre, formatPart } from "../../../../utils";
import { formatCalculVivier, UNITE_TAUX_VIVIER } from "../../vivier.ts";
import { getTextesNuage, getTitreQuadrant } from "../../components/nuage-vivier/utils.ts";
import type { AxesNuage } from "../../components/nuage-vivier/utils.ts";

export type NuageDisciplines = Extract<Extract<ErcVivierDisciplines, { vivier: unknown }>["vivier"], { entite: unknown }>;

export const nom = (p: ErcDisciplinePoint) => `${p.discipline_code} · ${p.discipline_nom}`;

// Indice : « 1,11 » (1 = la référence)
export function formatIndice(valeur: number | null): string {
  if (valeur === null) return "—";
  return valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Taux de candidature avec trois chiffres significatifs : le quotient de deux taux affichés retrouve l'indice affiché
function formatTaux(valeur: number | null): string {
  if (valeur === null) return "—";
  return valeur.toLocaleString("fr-FR", { maximumSignificantDigits: 3 });
}

// Libellés des deux références, cités dans les axes, l'infobulle, les tableaux et le commentaire
export function getReferences(data: NuageDisciplines) {
  return {
    candidature: `les ${data.nb_pays_reference} pays européens comparés`,
    succes: "l'ensemble des candidatures ERC",
  };
}

// Axes du nuage des disciplines : indice de candidature × indice de succès, coupés à 1 (la même discipline en Europe).
// Chaque indice est donné avec les deux taux qu'il compare, et chaque taux avec son numérateur et son dénominateur.
export function getAxesIndices(data: NuageDisciplines, entiteNom: string): AxesNuage<ErcDisciplinePoint> {
  const { unites, calculSucces } = getTextesNuage(data);
  const references = getReferences(data);
  const calculCandidature = (taux: TauxVivier) => formatCalculVivier(taux, data.vivier, unites);
  const comparaisonCandidature = (p: ErcDisciplinePoint) => `${formatTaux(p.candidature.valeur)} contre ${formatTaux(p.reference.candidature.valeur)}`;
  const comparaisonSucces = (p: ErcDisciplinePoint) => `${formatPart(p.succes.valeur)} contre ${formatPart(p.reference.succes.valeur)}`;
  const axes: AxesNuage<ErcDisciplinePoint> = {
    axeX: "Indice de candidature (1 = la même discipline en Europe, échelle logarithmique)",
    axeY: "Indice de succès (1 = la même discipline à l'ERC)",
    x: (p) => p.indice.candidature!,
    y: (p) => p.indice.succes!,
    formatX: formatIndice,
    formatY: formatIndice,
    quadrants: [
      { key: "hd", titre: "Moteurs, candidature et succès au-dessus de l'Europe" },
      { key: "hg", titre: "Réserve, succès au-dessus et candidature sous l'Europe" },
      { key: "bd", titre: "Volontaristes, candidature au-dessus et succès sous l'Europe" },
      { key: "bg", titre: "En retrait, candidature et succès sous l'Europe" },
    ],
    definitionQuadrant: (key) => `Indice de candidature ${key.endsWith("d") ? "supérieur ou égal" : "inférieur"} à 1 : `
      + `${key.endsWith("d") ? "au moins autant" : "moins"} de candidatures par chercheur que ${references.candidature} dans la même discipline. `
      + `Indice de succès ${key.startsWith("h") ? "supérieur ou égal" : "inférieur"} à 1 : un taux de succès `
      + `${key.startsWith("h") ? "au moins égal à" : "inférieur à"} celui de ${references.succes} de la discipline.`,
    infobulle: (p) => [
      `Indice de candidature : <b>${formatIndice(p.indice.candidature)}</b> = ${formatTaux(p.candidature.valeur)} ÷ ${formatTaux(p.reference.candidature.valeur)} (${UNITE_TAUX_VIVIER})`,
      `· ${entiteNom} : ${calculCandidature(p.candidature)}`,
      `· Europe, ${references.candidature} : ${calculCandidature(p.reference.candidature)}`,
      `Indice de succès : <b>${formatIndice(p.indice.succes)}</b> = ${formatPart(p.succes.valeur)} ÷ ${formatPart(p.reference.succes.valeur)}`,
      `· ${entiteNom} : ${calculSucces(p.succes)}`,
      `· ERC, ${references.succes} : ${calculSucces(p.reference.succes)}`,
    ],
    colonnes: [
      { titre: `Indice de candidature (${UNITE_TAUX_VIVIER} : entité contre Europe)`, valeur: (p) => `${formatIndice(p.indice.candidature)} (${comparaisonCandidature(p)})` },
      { titre: "Indice de succès (taux de succès : entité contre ERC)", valeur: (p) => `${formatIndice(p.indice.succes)} (${comparaisonSucces(p)})` },
    ],
    lecture: (p, nomPoint) => `${nomPoint} : indice de candidature ${formatIndice(p.indice.candidature)}, soit `
      + `${formatTaux(p.candidature.valeur)} ${unites.candidatures} ${UNITE_TAUX_VIVIER} (${calculCandidature(p.candidature)}) contre `
      + `${formatTaux(p.reference.candidature.valeur)} pour ${references.candidature} (${calculCandidature(p.reference.candidature)}) ; `
      + `indice de succès ${formatIndice(p.indice.succes)}, soit ${formatPart(p.succes.valeur)} (${calculSucces(p.succes)}) contre `
      + `${formatPart(p.reference.succes.valeur)} pour ${references.succes} (${calculSucces(p.reference.succes)}) : `
      + `quadrant « ${getTitreQuadrant(axes, p.quadrant)} »${p.fiable ? "" : `, position peu fiable (moins de ${data.seuil_fiabilite} ${unites.candidatures})`}.`,
  };
  return axes;
}

// Vue tableau : pour chaque discipline, les deux indices et les quatre taux bruts qu'ils comparent, chacun avec son
// numérateur et son dénominateur, pour que chaque valeur se recalcule à partir des effectifs
export function renderDataTable(data: NuageDisciplines, caption: string) {
  const { unites } = getTextesNuage(data);
  const ans = `${data.nb_annees} an${data.nb_annees > 1 ? "s" : ""}`;
  const cellTaux = (taux: TauxVivier) => `${formatTaux(taux.valeur)} (${formatNombre(taux.numerateur)} / ${ans} / ${formatNombre(taux.denominateur)} × 1 000)`;
  const cellSucces = (ratio: Ratio) => `${formatPart(ratio.valeur)} (${formatNombre(ratio.numerateur)} / ${formatNombre(ratio.denominateur)})`;
  const references = getReferences(data);
  const lignes = [...data.points].sort((a, b) => a.discipline_code.localeCompare(b.discipline_code));
  return (
    <TableauDonnees caption={caption}>
      <thead>
        <tr>
          <th scope="col">Discipline</th>
          <th scope="col">Indice de candidature</th>
          <th scope="col">{`Entité : ${unites.candidatures} ${UNITE_TAUX_VIVIER} (${unites.candidatures} / années / chercheurs × 1 000)`}</th>
          <th scope="col">{`Europe, ${references.candidature} : idem`}</th>
          <th scope="col">Indice de succès</th>
          <th scope="col">{`Entité : taux de succès (${unites.laureats} / ${unites.candidatures})`}</th>
          <th scope="col">{`ERC, ${references.succes} : idem`}</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((p) => (
          <tr key={p.discipline_code}>
            <th scope="row">{`${nom(p)}${p.fiable ? "" : " (peu fiable)"}`}</th>
            <td>{formatIndice(p.indice.candidature)}</td>
            <td>{cellTaux(p.candidature)}</td>
            <td>{cellTaux(p.reference.candidature)}</td>
            <td>{formatIndice(p.indice.succes)}</td>
            <td>{cellSucces(p.succes)}</td>
            <td>{cellSucces(p.reference.succes)}</td>
          </tr>
        ))}
      </tbody>
    </TableauDonnees>
  );
}
