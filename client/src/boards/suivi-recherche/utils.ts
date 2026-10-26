import type { BiblioDiscipline, Indicateur, Ratio, Selection } from "./api";

export const INDICATEUR_LABELS: Record<Indicateur, string> = {
  poids: "Poids",
  influence: "Influence",
  prestige: "Prestige",
};

const RATIO_UNITES: Record<Indicateur, string> = {
  poids: "articles",
  influence: "articles du top 10 % mondial",
  prestige: "articles en revues de tête",
};

// Le calcul en toutes lettres, pour voir les ordres de grandeur : « 13 539 / 230 675 articles du top 10 % mondial »
export function formatRatio(ratio: Ratio, indicateur: Indicateur): string {
  return `${formatArticles(ratio.numerateur)} / ${formatArticles(ratio.denominateur)} ${RATIO_UNITES[indicateur]}`;
}

// Une part mondiale va de ~25 % (un grand pays) à ~0,01 % (un petit établissement) : 3 chiffres significatifs
export function formatPart(valeur: number | null): string {
  if (valeur === null) return "—";
  const percent = (valeur * 100).toLocaleString("fr-FR", { maximumSignificantDigits: 3 });
  return `${percent} %`;
}

// Le top 10 % est en équivalent-articles décimaux : on arrondit pour l'affichage
export function formatArticles(nombre: number): string {
  return Math.round(nombre).toLocaleString("fr-FR");
}

export function formatDynamique(valeur: number | null): string {
  if (valeur === null || !Number.isFinite(valeur)) return "—";
  const sign = valeur > 0 ? "+" : valeur < 0 ? "−" : "±";
  const digits = Math.abs(valeur) >= 10 ? 0 : 1;
  return `${sign}${Math.abs(valeur).toLocaleString("fr-FR", { maximumFractionDigits: digits })} %`;
}

export function formatPeriode([debut, fin]: [number, number] | number[]): string {
  return debut === fin ? `${debut}` : `${debut}–${fin}`;
}

export function getDisciplineLabel(selection: Selection, disciplines: BiblioDiscipline[]): string {
  if (selection.disciplineCode) {
    const discipline = disciplines.find((d) => d.discipline_code === selection.disciplineCode);
    return discipline ? `${discipline.discipline_code} · ${discipline.discipline_nom}` : selection.disciplineCode;
  }
  if (selection.domaineCode) {
    const domaine = disciplines.find((d) => d.domaine_code === selection.domaineCode);
    return domaine ? domaine.domaine_nom : selection.domaineCode;
  }
  return "Toutes disciplines";
}

// Libellé de la sélection, répété sur les indicateurs et les graphiques pour lever toute ambiguïté
export function describeSelection(selection: Selection, entiteNom: string, disciplines: BiblioDiscipline[]): string {
  return [entiteNom, formatPeriode([selection.anneeDebut, selection.anneeFin]), getDisciplineLabel(selection, disciplines)].join(" · ");
}

export function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}
