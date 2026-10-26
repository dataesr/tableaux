import type { ComparaisonRow, Indicateur } from "../../../../api";
import { getContinentFromCountryCode } from "../../../../../../utils/continents";
import { getFlagEmoji } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { formatPart, formatRatio } from "../../../../utils";

// athena publie des codes ISO2, l'utilitaire des continents attend de l'ISO3
const ISO3_BY_ISO2: Record<string, string> = {
  AU: "AUS", BR: "BRA", CA: "CAN", CH: "CHE", CN: "CHN", DE: "DEU", EG: "EGY", ES: "ESP", FR: "FRA",
  GB: "GBR", ID: "IDN", IN: "IND", IR: "IRN", IT: "ITA", JP: "JPN", KR: "KOR", MX: "MEX", NL: "NLD",
  PL: "POL", RU: "RUS", SA: "SAU", SE: "SWE", TR: "TUR", UA: "UKR", US: "USA",
};

export function getContinent(paysCode: string): string {
  return getContinentFromCountryCode(ISO3_BY_ISO2[paysCode] ?? paysCode);
}

export function getContinentColor(continent: string): string {
  return getCssColor(`sr-continent-${continent.normalize("NFD").replace(/[̀-ͯ]/g, "")}`);
}

// Géométrie du graphique en rubans, en unités arbitraires de 0 à HAUTEUR (axe inversé : rang 1 en haut).
// Épaisseur minimale + écart ≈ 2 unités, soit ~16 px par pays sur un tracé de 800 px : les noms ne se chevauchent pas.
const HAUTEUR = 100;
const EPAISSEUR_MIN = 1.6;
const ECART = 0.4;
const DEMI_COLONNE = 0.18;
const PAS_TRANSITION = 12;

// Courbe en S entre deux années (même allure qu'une courbe de Bézier horizontale)
const lisser = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

export function getOptions(rows: ComparaisonRow[], indicateur: Indicateur, provisoires: number[], focusId: string) {
  const annees = [...new Set(rows.map((row) => row.annee_publication))].sort((a, b) => a - b);
  const pays = [...new Map(rows.map((row) => [row.entite_id, row.nom])).entries()];
  const ratio = (id: string, annee: number) =>
    rows.find((row) => row.entite_id === id && row.annee_publication === annee)?.[indicateur];
  const valeur = (id: string, annee: number) => ratio(id, annee)?.valeur ?? 0;

  // Chaque année, les pays sont empilés du premier au dernier ; l'épaisseur suit la part
  const colonnes = annees.map((annee) => pays.map(([id]) => ({ id, v: valeur(id, annee) })).sort((a, b) => b.v - a.v));
  const sommeMax = Math.max(...colonnes.map((colonne) => colonne.reduce((total, p) => total + p.v, 0)), 0);
  const echelle = (HAUTEUR - pays.length * EPAISSEUR_MIN - (pays.length - 1) * ECART) / (sommeMax || 1);
  const geo = new Map(pays.map(([id]) => [id, [] as { y0: number; y1: number; rang: number; v: number }[]]));
  colonnes.forEach((colonne, j) => {
    let y = 0;
    colonne.forEach((p, rang) => {
      const h = EPAISSEUR_MIN + p.v * echelle;
      geo.get(p.id)![j] = { y0: y, y1: y + h, rang: rang + 1, v: p.v };
      y += h + ECART;
    });
  });

  const rubans = pays.map(([id, nom]) => {
    const focus = id === focusId;
    return {
      type: "arearange",
      name: nom,
      color: focus ? getCssColor("sr-focus") : getContinentColor(getContinent(id)),
      fillOpacity: focus ? 1 : 0.75,
      lineWidth: 0,
      zIndex: focus ? 2 : 1,
      marker: { enabled: false },
      states: { hover: { lineWidth: 0 }, inactive: { opacity: 0.25 } },
      data: annees.flatMap((annee, j) => {
        const g = geo.get(id)![j];
        const point = { low: g.y0, high: g.y1, rang: g.rang, valeur: g.v, annee, ratio: ratio(id, annee) };
        const colonne = [{ x: annee - DEMI_COLONNE, ...point }, { x: annee + DEMI_COLONNE, ...point }];
        const suivant = geo.get(id)![j + 1];
        if (!suivant) return colonne;
        // Transition vers l'année suivante : les points intermédiaires portent encore les valeurs de l'année courante
        const transition = Array.from({ length: PAS_TRANSITION - 1 }, (_, k) => {
          const t = (k + 1) / PAS_TRANSITION;
          const e = lisser(t);
          return {
            ...point,
            x: annee + DEMI_COLONNE + t * (1 - 2 * DEMI_COLONNE),
            low: g.y0 + e * (suivant.y0 - g.y0),
            high: g.y1 + e * (suivant.y1 - g.y1),
          };
        });
        return [...colonne, ...transition];
      }),
    };
  });

  // Noms à l'extérieur du tracé : graduations d'axes verticaux, au milieu de chaque ruban en début et en fin de période
  const etiquettes = (j: number, gauche: boolean) => {
    const libelles = new Map(pays.map(([id, nom]) => {
      const g = geo.get(id)![j];
      const texte = gauche ? `${getFlagEmoji(id)} ${nom} ${formatPart(g.v)}` : `${formatPart(g.v)} ${nom} ${getFlagEmoji(id)}`;
      return [((g.y0 + g.y1) / 2).toFixed(4), id === focusId ? `<b>${texte}</b>` : texte];
    }));
    return {
      reversed: true,
      min: 0,
      max: HAUTEUR,
      opposite: !gauche,
      title: { text: null },
      gridLineWidth: 0,
      startOnTick: false,
      endOnTick: false,
      tickPositions: [...libelles.keys()].map(Number),
      labels: {
        step: 1,
        style: { color: getCssColor("text-default-grey"), fontSize: "12px" },
        formatter: function (this: any) { return libelles.get(Number(this.value).toFixed(4)) ?? ""; },
      },
    };
  };

  return {
    chart: { height: Math.max(560, pays.length * 34) },
    credits: { enabled: false },
    legend: { enabled: false },
    title: { text: "" },
    xAxis: {
      opposite: true,
      lineWidth: 0,
      tickLength: 0,
      min: annees[0] - DEMI_COLONNE,
      max: annees[annees.length - 1] + DEMI_COLONNE,
      tickPositions: annees,
      labels: {
        formatter: function (this: any) {
          return indicateur === "influence" && provisoires.includes(this.value) ? `${this.value}*` : `${this.value}`;
        },
      },
    },
    yAxis: [etiquettes(0, true), etiquettes(annees.length - 1, false)],
    tooltip: {
      formatter: function (this: any) {
        const { annee, rang, valeur: v, ratio: r } = this.point.options;
        return [
          `<b>${this.series.name}</b> · ${annee}`,
          `Rang ${rang} sur ${pays.length} · <b>${formatPart(v)}</b>`,
          r ? `= ${formatRatio(r, indicateur)}` : "",
        ].join("<br/>");
      },
    },
    series: rubans,
  };
}
