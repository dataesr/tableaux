// Regroupement des pays par similarité de leur profil de spécialisation, calculé côté serveur.
// Classification ascendante hiérarchique : on part d'un groupe par pays et on fusionne, tant qu'il en reste plus d'un,
// les deux groupes les plus proches. Distance entre deux pays : 1 − corrélation de Pearson des logarithmes de leurs
// indices (deux pays sont proches s'ils sont sur- et sous-représentés dans les mêmes disciplines, quelle que soit
// l'ampleur) ; entre deux groupes : moyenne des distances entre leurs pays (lien moyen).
// L'ordre d'affichage suit l'arbre des fusions, si bien que chaque groupe occupe des lignes contiguës. À chaque fusion,
// la branche qui contient le pays mis en avant passe en premier : il est en tête, suivi des pays au profil le plus proche.

// Indice nul (aucun article) : remplacé par ce plancher avant le logarithme
const INDICE_PLANCHER = 0.01;

function correlation(a, b) {
  const moyenne = (valeurs) => valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length;
  const ma = moyenne(a);
  const mb = moyenne(b);
  let covariance = 0;
  let va = 0;
  let vb = 0;
  a.forEach((x, k) => {
    covariance += (x - ma) * (b[k] - mb);
    va += (x - ma) ** 2;
    vb += (b[k] - mb) ** 2;
  });
  return va && vb ? covariance / Math.sqrt(va * vb) : 0;
}

/**
 * @param {{ id: string, nb_articles: number, indices: (number | null)[] }[]} profils un profil par pays, mêmes disciplines
 * @param {{ focusId: string, nbGroupes: number }} options
 * @returns {{ ordre: string[], groupes: string[][] }} identifiants dans l'ordre d'affichage, et groupes dans cet ordre
 */
export function grouperProfils(profils, { focusId, nbGroupes }) {
  if (profils.length === 0) return { ordre: [], groupes: [] };
  const logs = profils.map(({ indices }) => indices.map((indice) => Math.log(Math.max(indice ?? 0, INDICE_PLANCHER))));
  const distances = logs.map((a) => logs.map((b) => 1 - correlation(a, b)));
  const lien = (a, b) => {
    let somme = 0;
    a.membres.forEach((i) => b.membres.forEach((j) => { somme += distances[i][j]; }));
    return somme / (a.membres.length * b.membres.length);
  };

  let groupes = profils.map((profil, i) => ({
    membres: [i],
    ordre: [i],
    nb_articles: profil.nb_articles,
    focus: profil.id === focusId,
  }));
  let decoupage = groupes.length <= nbGroupes ? groupes : null;

  while (groupes.length > 1) {
    let paire = [0, 1];
    let minimum = Infinity;
    groupes.forEach((a, i) => groupes.slice(i + 1).forEach((b, k) => {
      const distance = lien(a, b);
      if (distance < minimum) {
        minimum = distance;
        paire = [i, i + 1 + k];
      }
    }));
    const [a, b] = paire.map((index) => groupes[index]);
    // Branche du pays mis en avant d'abord, sinon la plus grande en nombre d'articles
    const [premier, second] = a.focus || (!b.focus && a.nb_articles >= b.nb_articles) ? [a, b] : [b, a];
    const fusion = {
      membres: [...a.membres, ...b.membres],
      ordre: [...premier.ordre, ...second.ordre],
      nb_articles: a.nb_articles + b.nb_articles,
      focus: a.focus || b.focus,
    };
    groupes = [...groupes.filter((_, index) => !paire.includes(index)), fusion];
    if (groupes.length === nbGroupes) decoupage = groupes;
  }

  const ordre = groupes[0].ordre;
  const position = new Map(ordre.map((index, rang) => [index, rang]));
  const groupesOrdonnes = decoupage
    .map(({ membres }) => [...membres].sort((i, j) => position.get(i) - position.get(j)))
    .sort((a, b) => position.get(a[0]) - position.get(b[0]));

  return {
    ordre: ordre.map((index) => profils[index].id),
    groupes: groupesOrdonnes.map((membres) => membres.map((index) => profils[index].id)),
  };
}
