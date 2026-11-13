import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { Matrice, MatricePoint } from "../../api";
import { createChartOptions } from "../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../utils/colors";
import { formatDynamique, formatPart, formatPeriode } from "../../utils";
import { dessinerAnnotations, ZOOM } from "./annotations.ts";
import { getTexteInternational, getTitreQuadrant, TAILLE_MAX, TAILLE_MIN } from "./utils.tsx";
import type { MatriceTextes } from "./utils.tsx";

// Ce qui distingue une matrice d'une autre (disciplines, établissements) : nom, couleur, étiquette et infobulle des points
export type MatriceRendu<P> = {
  couleur: (point: P & MatricePoint) => string;
  // Lignes d'en-tête de l'infobulle (HTML)
  entete: (point: P & MatricePoint) => string[];
  // Étiquette posée à côté de la bulle (HTML court)
  etiquette: (point: P & MatricePoint) => string;
  // Mise en avant (contour épais, étiquette prioritaire)
  focus?: (point: P & MatricePoint) => boolean;
  serie: string;
  textes: MatriceTextes;
};

// Quadrants, tri des bulles et bornes des axes viennent du serveur. Seul le placement des étiquettes,
// qui dépend des positions en pixels, est calculé ici, à chaque rendu du graphique.
export default function getMatriceOptions<P, I extends string>(data: Matrice<P, I>, rendu: MatriceRendu<P>) {
  const { bornes, periodes, points, references } = data;
  const { textes } = rendu;
  const { dynamique, international, niveau } = references;
  const mentionColor = getCssColor("text-mention-grey");
  const halo = `3px ${getCssColor("background-default-grey")}`;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: 560,
      // Marge haute : le menu d'export ne recouvre pas le coin « Atouts en progression »
      marginTop: 48,
      marginRight: 24,
      zooming: ZOOM,
      events: {
        render: function (this: any) {
          dessinerAnnotations(this, {
            coins: {
              hd: getTitreQuadrant("hd", references),
              hg: getTitreQuadrant("hg", references),
              bd: getTitreQuadrant("bd", references),
              bg: getTitreQuadrant("bg", references),
            },
            // Hors du cadre : évolution exacte dans l'étiquette
            etiquette: (p: P & MatricePoint) => (p.hors_cadre ? `${rendu.etiquette(p)} (${formatDynamique(p.dynamique)})` : rendu.etiquette(p)),
            focus: rendu.focus,
          });
        },
      },
    },
    xAxis: {
      type: "logarithmic",
      gridLineWidth: 1,
      // Cadre ajusté aux données (plus la référence), avec une petite marge, au lieu des arrondis automatiques
      min: bornes.x[0] !== null ? bornes.x[0] * 100 : undefined,
      max: bornes.x[1] !== null ? bornes.x[1] * 100 : undefined,
      startOnTick: false,
      endOnTick: false,
      title: { text: textes.axeX },
      labels: { formatter: function () { return formatPart(Number(this.value) / 100); } },
      // Ligne nommée et chiffrée : « Médiane du groupe : 0,42 % » ; le commentaire dit d'où vient la valeur
      plotLines: [{
        value: (niveau.valeur ?? 0) * 100,
        color: mentionColor,
        dashStyle: "Dash",
        width: 1.5,
        zIndex: 3,
        label: {
          text: `${niveau.libelle} : ${formatPart(niveau.valeur)}`,
          rotation: 0,
          y: -4,
          x: 4,
          verticalAlign: "bottom",
          style: { color: mentionColor, fontSize: "11px", textOutline: halo },
        },
      }],
    },
    yAxis: {
      min: bornes.y[0],
      max: bornes.y[1],
      startOnTick: false,
      endOnTick: false,
      title: { text: textes.axeY },
      labels: { formatter: function () { return formatDynamique(Number(this.value)); } },
      // Trait plein : coupe les quadrants (étiquette à droite) ; pointillés : repère international (étiquette à gauche)
      plotLines: [
        {
          value: dynamique.valeur ?? 0,
          color: mentionColor,
          width: 1.5,
          zIndex: 3,
          label: { text: `${dynamique.libelle} : ${formatDynamique(dynamique.valeur)}`, align: "right", x: -4, y: -4, style: { color: mentionColor, fontSize: "11px", textOutline: halo } },
        },
        ...(international ? [{
          value: international.valeur,
          color: mentionColor,
          dashStyle: "Dot" as const,
          width: 1.5,
          zIndex: 3,
          label: { text: `${international.libelle} : ${formatDynamique(international.valeur)}`, align: "left" as const, x: 4, y: 12, style: { color: mentionColor, fontSize: "11px", textOutline: halo } },
        }] : []),
      ],
    },
    plotOptions: {
      bubble: {
        minSize: TAILLE_MIN,
        maxSize: TAILLE_MAX,
        marker: { fillOpacity: 0.5, lineWidth: 1.5 },
        // Infobulle seulement au survol d'une bulle, pas du point le plus proche n'importe où dans le cadre :
        // les zones vides restent libres pour sélectionner une zone à zoomer
        stickyTracking: false,
        // Pas d'étiquette au centre des bulles : elles sont posées à l'extérieur (événement render)
        dataLabels: { enabled: false },
      },
    },
    tooltip: {
      useHTML: true,
      formatter: function (this: any) {
        // Pendant la sélection d'une zone à zoomer, l'infobulle masquerait la zone visée
        if (this.series.chart.mouseIsDown) return false;
        const p = this.point.options.custom as P & MatricePoint;
        const quadrant = getTitreQuadrant(p.quadrant, references);
        return [
          ...rendu.entete(p),
          `<i>${quadrant}</i>`,
          `${textes.niveau} ${formatPeriode(periodes.arrivee)} : <b>${formatPart(p.niveau.valeur)}</b> = ${textes.calcul(p.niveau)}`,
          `${textes.niveau} ${formatPeriode(periodes.depart)} : ${formatPart(p.niveau_depart.valeur)} = ${textes.calcul(p.niveau_depart)}`,
          `Évolution relative : <b>${formatDynamique(p.dynamique)}</b>${p.hors_cadre ? ` (hors du cadre, posée sur le bord ${p.hors_cadre})` : ""}`,
          ...(international ? [`International : ${getTexteInternational(data, p)}`] : []),
          `Taille : ${textes.taille.format(p.taille)} ${textes.taille.unite} sur ${formatPeriode(periodes.arrivee)}${p.fiable ? "" : ` (peu fiable : ${textes.peuFiable})`}`,
        ].join("<br/>");
      },
    },
    series: [{
      type: "bubble",
      // Les points posés sur le bord du cadre restent entiers
      clip: false,
      name: rendu.serie,
      data: points.map((p) => {
        const color = rendu.couleur(p);
        const focus = rendu.focus?.(p) ?? false;
        // Hors du cadre : posé sur le bord, en triangle pointant vers sa vraie position, évolution dans l'étiquette
        const bord = p.hors_cadre === "haut" ? bornes.y[1] : p.hors_cadre === "bas" ? bornes.y[0] : null;
        return {
          x: p.niveau.valeur! * 100,
          y: bord ?? p.dynamique,
          z: p.taille,
          color,
          custom: p,
          labelrank: p.taille,
          // Sous le seuil de fiabilité : bulle vide, la position est peu fiable ; point mis en avant : contour épais
          marker: {
            ...(!p.fiable && { fillColor: "transparent" }),
            lineColor: color,
            ...(focus && { lineWidth: 3 }),
            ...(p.hors_cadre && { symbol: p.hors_cadre === "haut" ? "triangle" : "triangle-down" }),
          },
        };
      }),
    }],
  };

  return createChartOptions("bubble", newOptions);
}
