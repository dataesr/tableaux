import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { Matrice, MatricePoint } from "../../api";
import { createChartOptions } from "../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../utils/colors";
import { formatDynamique, formatPart, formatPeriode } from "../../utils";
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

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// Quadrants, tri des bulles et bornes des axes viennent du serveur. Seul le placement des étiquettes,
// qui dépend des positions en pixels, est calculé ici, à chaque rendu du graphique.
export default function getMatriceOptions<P, I extends string>(data: Matrice<P, I>, rendu: MatriceRendu<P>) {
  const { bornes, periodes, points, references } = data;
  const { textes } = rendu;
  const { dynamique, international, niveau } = references;
  const mentionColor = getCssColor("text-mention-grey");
  const titleColor = getCssColor("text-title-grey");
  const halo = `3px ${getCssColor("background-default-grey")}`;

  const newOptions: HighchartsInstance.Options = {
    chart: {
      height: 560,
      // Marge haute : le menu d'export ne recouvre pas le coin « Atouts en progression »
      marginTop: 48,
      marginRight: 24,
      // Zoom à la souris : glisser pour sélectionner une zone, dans les deux directions
      zooming: {
        type: "xy",
        // En haut à gauche, au-dessus du cadre : ne recouvre ni le menu d'export ni le nom d'un quadrant
        resetButton: { relativeTo: "spacingBox", position: { align: "left", verticalAlign: "top", x: 0, y: 8 } },
      },
      events: {
        render: function (this: any) {
          // Le libellé du bouton vient des options globales (en anglais) : on le traduit ici
          this.resetZoomButton?.attr({ text: "Réinitialiser le zoom", title: "Revenir à la vue d'ensemble" });
          (this.srElements ?? []).forEach((element) => element.destroy());
          this.srElements = [];
          const { plotLeft: left, plotTop: top, plotWidth: width, plotHeight: height, renderer } = this;
          const add = (element) => { this.srElements.push(element); return element; };

          // Noms des quadrants, discrets, dans les coins
          const occupied: Box[] = [];
          const corner = (titre: string, droite: boolean, haut: boolean) => {
            const text = add(renderer
              .text(titre, droite ? left + width - 6 : left + 6, haut ? top + 14 : top + height - 6)
              .attr({ align: droite ? "right" : "left", zIndex: 2 })
              .css({ color: mentionColor, fontSize: "11px", fontStyle: "italic" })
              .add());
            // Écran étroit : un titre plus large que la moitié du graphique chevaucherait son voisin ;
            // on garde son premier mot (« Atouts »), le titre complet reste dans les tableaux des quadrants
            if (text.getBBox().width > width / 2 - 12) text.attr({ text: titre.split(",")[0] });
            occupied.push(text.getBBox());
          };
          corner(getTitreQuadrant("hd", references), true, true);
          corner(getTitreQuadrant("hg", references), false, true);
          corner(getTitreQuadrant("bd", references), true, false);
          corner(getTitreQuadrant("bg", references), false, false);

          // Une étiquette par bulle, posée hors des bulles avec un trait de rappel.
          // Recherche autour de la bulle, de plus en plus loin, en privilégiant la direction opposée au centre du nuage.
          // Après un zoom, seules les bulles restées dans le cadre sont dessinées et étiquetées
          const allPoints = (this.series[0]?.points ?? []).filter((p) => p.isInside !== false);
          const circles = allPoints.map((p) => ({ cx: left + p.plotX, cy: top + p.plotY, r: p.marker?.radius ?? 0 }));
          const hitsCircle = (b: Box) => circles.some(({ cx, cy, r }) => {
            const nx = Math.max(b.x, Math.min(cx, b.x + b.width));
            const ny = Math.max(b.y, Math.min(cy, b.y + b.height));
            return (nx - cx) ** 2 + (ny - cy) ** 2 < (r + 2) ** 2;
          });
          const inside = (b: Box) => b.x >= left + 2 && b.y >= top + 2 && b.x + b.width <= left + width - 2 && b.y + b.height <= top + height - 2;
          const centreX = circles.reduce((total, c) => total + c.cx, 0) / (circles.length || 1);
          const centreY = circles.reduce((total, c) => total + c.cy, 0) / (circles.length || 1);
          const DISTANCES = [6, 14, 26, 42, 62, 88, 120, 160];
          const ANGLES = Array.from({ length: 16 }, (_, i) => (i * Math.PI) / 8);

          // Le point mis en avant, puis les grosses bulles : ils obtiennent les meilleures places
          const prioritaire = (p) => (rendu.focus?.(p.options.custom) ? 1 : 0);
          allPoints.sort((a, b) => prioritaire(b) - prioritaire(a) || b.z - a.z).forEach((p) => {
            const r = p.marker?.radius ?? 0;
            const cx = left + p.plotX;
            const cy = top + p.plotY;
            const label = add(renderer
              .text(p.options.custom.hors_cadre
                ? `${rendu.etiquette(p.options.custom)} (${formatDynamique(p.options.custom.dynamique)})`
                : rendu.etiquette(p.options.custom), 0, 0)
              .css({ color: titleColor, fontSize: "11px", textOutline: halo })
              .attr({ zIndex: 6 })
              .add());
            const { width: w, height: h } = label.getBBox();
            const dehors = Math.atan2(cy - centreY, cx - centreX);
            const angles = [...ANGLES].sort((a, b) => Math.abs(Math.cos(a - dehors) - 1) - Math.abs(Math.cos(b - dehors) - 1));

            let place: Box | null = null;
            for (const distance of DISTANCES) {
              for (const angle of angles) {
                const ax = cx + Math.cos(angle) * (r + distance);
                const ay = cy + Math.sin(angle) * (r + distance);
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const box = {
                  x: cos > 0.35 ? ax : cos < -0.35 ? ax - w : ax - w / 2,
                  y: sin > 0.35 ? ay : sin < -0.35 ? ay - h : ay - h / 2,
                  width: w,
                  height: h,
                };
                if (inside(box) && !hitsCircle(box) && !occupied.some((o) => intersects(o, box))) {
                  place = box;
                  break;
                }
              }
              if (place) break;
            }
            if (!place) {
              label.destroy();
              this.srElements.pop();
              return;
            }
            label.attr({ x: place.x, y: place.y + h * 0.75 });
            occupied.push(place);
            // Trait du bord de la bulle au point le plus proche de l'étiquette
            const tx = Math.max(place.x, Math.min(cx, place.x + place.width));
            const ty = Math.max(place.y, Math.min(cy, place.y + place.height));
            const angle = Math.atan2(ty - cy, tx - cx);
            if (Math.hypot(tx - cx, ty - cy) - r > 4) {
              add(renderer
                .path(["M", cx + r * Math.cos(angle), cy + r * Math.sin(angle), "L", tx, ty])
                .attr({ stroke: mentionColor, "stroke-width": 1, zIndex: 5 })
                .add());
            }
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
