// Géométrie du graphique en rubans de la comparaison internationale, calculée côté serveur :
// le client reçoit, pour chaque pays, les bornes [bas, haut] de chaque point (série Highcharts « arearange »),
// et une fois pour toutes les séries les abscisses [x, j] de ces points (j : indice de l'année).
// Unités arbitraires de 0 à HAUTEUR (axe inversé côté client : rang 1 en haut).
// Épaisseur minimale + écart ≈ 2 unités, soit ~16 px par pays sur un tracé de 800 px : les noms ne se chevauchent pas.
export const HAUTEUR = 100;
const EPAISSEUR_MIN = 1.6;
const ECART = 0.4;
export const DEMI_COLONNE = 0.18;
const PAS_TRANSITION = 12;

// Courbe en S entre deux années (même allure qu'une courbe de Bézier horizontale)
const lisser = (t) => (1 - Math.cos(Math.PI * t)) / 2;
// 0,01 unité ≈ 0,1 px : sans effet visible, et une réponse plus légère
const arrondi = (nombre) => Math.round(nombre * 100) / 100;

// Abscisses des points, communes à tous les rubans : deux par année (la colonne), puis la transition vers la suivante
export function computeAbscisses(annees) {
  return annees.flatMap((annee, j) => {
    const colonne = [[annee - DEMI_COLONNE, j], [annee + DEMI_COLONNE, j]];
    if (j === annees.length - 1) return colonne;
    const transition = Array.from({ length: PAS_TRANSITION - 1 }, (_, k) => [annee + DEMI_COLONNE + ((k + 1) / PAS_TRANSITION) * (1 - 2 * DEMI_COLONNE), j]);
    return [...colonne, ...transition];
  }).map(([x, j]) => [arrondi(x), j]);
}

/**
 * @param {number[]} annees années triées
 * @param {{ entite_id: string, nom: string }[]} pays
 * @param {(entiteId: string, j: number) => { valeur: number | null } | undefined} ratio ratio d'un pays pour l'année d'indice j
 * @returns {{ series: object[], etiquettes: { debut: object[], fin: object[] } }}
 */
export function computeRubans(annees, pays, ratio) {
  const valeur = (id, j) => ratio(id, j)?.valeur ?? 0;

  // Chaque année, les pays sont empilés du premier au dernier ; l'épaisseur suit la part
  const colonnes = annees.map((_, j) => pays.map(({ entite_id: id }) => ({ id, v: valeur(id, j) })).sort((a, b) => b.v - a.v));
  const sommeMax = Math.max(0, ...colonnes.map((colonne) => colonne.reduce((total, p) => total + p.v, 0)));
  const echelle = (HAUTEUR - pays.length * EPAISSEUR_MIN - (pays.length - 1) * ECART) / (sommeMax || 1);

  const geo = new Map(pays.map(({ entite_id: id }) => [id, []]));
  colonnes.forEach((colonne, j) => {
    let y = 0;
    colonne.forEach((p, rang) => {
      const h = EPAISSEUR_MIN + p.v * echelle;
      geo.get(p.id)[j] = { y0: y, y1: y + h, rang: rang + 1, v: p.v };
      y += h + ECART;
    });
  });

  const series = pays.map(({ entite_id: id, nom }) => {
    const g = geo.get(id);
    // Même ordre de points que computeAbscisses
    const data = annees.flatMap((_, j) => {
      const { y0, y1 } = g[j];
      const colonne = [[y0, y1], [y0, y1]];
      const suivant = g[j + 1];
      if (!suivant) return colonne;
      // Transition vers l'année suivante, en courbe en S
      const transition = Array.from({ length: PAS_TRANSITION - 1 }, (_, k) => {
        const e = lisser((k + 1) / PAS_TRANSITION);
        return [y0 + e * (suivant.y0 - y0), y1 + e * (suivant.y1 - y1)];
      });
      return [...colonne, ...transition];
    });
    return {
      entite_id: id,
      nom,
      data: data.map(([low, high]) => [arrondi(low), arrondi(high)]),
      // Valeurs par année (indice j des points), pour l'infobulle
      annees: g.map(({ rang }, j) => ({ rang, ratio: ratio(id, j) ?? null })),
    };
  });

  // Noms à l'extérieur du tracé, au milieu de chaque ruban, en début et en fin de période
  const etiquettes = (j) => pays.map(({ entite_id: id, nom }) => {
    const { y0, y1, v } = geo.get(id)[j];
    return { entite_id: id, nom, valeur: v, y: Math.round(((y0 + y1) / 2) * 1000) / 1000 };
  });

  return {
    series,
    etiquettes: annees.length ? { debut: etiquettes(0), fin: etiquettes(annees.length - 1) } : { debut: [], fin: [] },
  };
}
