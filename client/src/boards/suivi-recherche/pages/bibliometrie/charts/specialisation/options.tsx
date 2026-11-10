import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { Specialisation, SpecialisationCellule, SpecialisationVue } from "../../../../api";
import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import { getFlagEmoji } from "../../../../../../utils";
import { getCssColor } from "../../../../../../utils/colors";
import { getVue } from "./utils.tsx";

const HAUTEUR_LIGNE = 28;

type Custom = { cellule: SpecialisationCellule; discipline: number; groupe: number; pays: string };

// Indices et évolutions déjà calculés par le serveur : ici, uniquement du mapping vers une carte de chaleur Highcharts.
// Les deux vues partagent la grille (mêmes lignes, mêmes colonnes) ; seules la couleur et le texte des cases changent.
export default function getOptions(data: Specialisation, vue: SpecialisationVue, focusId: string) {
  const { disciplines, echelles, pays } = data;
  if (pays.length === 0 || (vue === "evolution" && !data.periodes)) return null;
  const textes = getVue(vue, data);

  const points = pays.flatMap((ligne, y) => ligne.cellules.map((cellule, x) => ({
    x,
    y,
    // Échelle logarithmique : une valeur nulle n'a pas de couleur
    value: textes.couleur(cellule),
    custom: { cellule, discipline: x, groupe: ligne.groupe, pays: ligne.nom } satisfies Custom,
  })));
  const nomDiscipline = (x: number) => `${disciplines[x].discipline_code} · ${disciplines[x].discipline_nom}`;

  // Séparateurs entre domaines : avant la première discipline de chaque domaine, sauf le premier
  const separateurs = disciplines
    .map((discipline, x) => (x > 0 && discipline.domaine_code !== disciplines[x - 1].domaine_code ? x - 0.5 : null))
    .filter((x): x is number => x !== null)
    .map((value) => ({ color: "var(--border-plain-grey)", value, width: 2, zIndex: 5 }));

  // Séparateurs entre groupes de pays, et cadre autour de la ligne mise en avant
  const separateursGroupes = pays
    .map((ligne, y) => (y > 0 && ligne.groupe !== pays[y - 1].groupe ? y - 0.5 : null))
    .filter((y): y is number => y !== null)
    .map((value) => ({ color: "var(--border-plain-grey)", value, width: 2, zIndex: 5 }));
  const focus = pays.findIndex(({ entite_id: id }) => id === focusId);
  const cadreFocus = focus < 0 ? [] : [focus - 0.5, focus + 0.5].map((value) => ({ color: getCssColor("sr-france"), value, width: 3, zIndex: 6 }));

  const [bas, centre, haut] = textes.couleurs.map((couleur) => getCssColor(couleur));
  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: pays.length * HAUTEUR_LIGNE + 170,
      // 28 colonnes ne tiennent pas sur un petit écran : le graphique défile dans son cadre, pas la page
      scrollablePlotArea: { minWidth: 1100, scrollPositionX: 0 },
    },
    xAxis: {
      categories: disciplines.map(({ discipline_code: code }) => code),
      opposite: true,
      plotLines: separateurs,
      // Tous les codes, à l'horizontale : une colonne sans en-tête serait illisible
      labels: { rotation: 0, step: 1, style: { fontSize: "12px" } },
    },
    yAxis: {
      categories: pays.map(({ entite_id: id, nom }) => (id === focusId ? `<b>${getFlagEmoji(id)} ${nom}</b>` : `${getFlagEmoji(id)} ${nom}`)),
      reversed: true,
      plotLines: [...separateursGroupes, ...cadreFocus],
      title: { text: undefined },
      labels: { step: 1, style: { fontSize: "12px" } },
    },
    colorAxis: {
      type: "logarithmic",
      min: echelles[vue].min,
      max: echelles[vue].max,
      stops: [[0, bas], [0.5, centre], [1, haut]],
      labels: {
        formatter: function () { return textes.graduation(Number(this.value)); },
      },
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      symbolWidth: 320,
      title: { text: textes.legende, style: { color: "var(--text-default-grey)", fontWeight: "500" } },
    },
    tooltip: {
      // Hors du graphique : sinon l'axe des pays, figé au-dessus de la zone qui défile (scrollablePlotArea), le recouvre.
      // Largeur naturelle (une ligne par information) : une largeur imposée fait passer le texte à la ligne
      // après le calcul de la hauteur du cadre, et le haut est coupé
      outside: true,
      formatter: function () {
        const { cellule, discipline, groupe, pays: nom } = (this as unknown as { point: { custom: Custom } }).point.custom;
        return `<b>${nom}</b> (groupe ${groupe})<br/>${nomDiscipline(discipline)}<br/>${textes.infobulle(cellule, disciplines[discipline])}`;
      },
    },
    accessibility: {
      point: {
        descriptionFormatter: function (point) {
          const { cellule, discipline, groupe, pays: nom } = (point as unknown as { custom: Custom }).custom;
          const fiabilite = textes.fiable(cellule) ? "" : ", peu fiable";
          return `${nom} (groupe ${groupe}), ${nomDiscipline(discipline)} : ${textes.description(cellule, disciplines[discipline])}${fiabilite}.`;
        },
      },
    },
    series: [
      {
        type: "heatmap",
        name: textes.legende,
        data: points,
        borderWidth: 1,
        borderColor: "var(--background-default-grey)",
        nullColor: "var(--background-disabled-grey)",
        colsize: 1,
        dataLabels: {
          enabled: true,
          // Noir ou blanc selon la case, pour rester lisible sur les teintes foncées comme sur le centre
          color: "contrast",
          style: { fontSize: "11px", fontWeight: "400" },
          formatter: function () {
            return textes.etiquette((this as unknown as { point: { custom: Custom } }).point.custom.cellule);
          },
        },
      },
    ],
  };

  return createChartOptions("heatmap", newOptions);
}
