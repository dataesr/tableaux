import type { Ratio, Specialisation, SpecialisationCellule, SpecialisationIndice, SpecialisationVue } from "../../../../api";
import { formatArticles, formatIndice, formatPart, formatPeriode } from "../../../../utils";

type Discipline = Specialisation["disciplines"][number];
type Pays = Specialisation["pays"][number];

// « 5,02 % (38 612 / 769 189) »
const formatPartCalcul = (part: Ratio) => `${formatPart(part.valeur)} (${formatArticles(part.numerateur)} / ${formatArticles(part.denominateur)})`;

// Variation compacte pour une case : « +26 % », « −8 % » (espace fine insécable)
export function formatVariation(valeur: number): string {
  const arrondi = Math.round(valeur);
  const signe = arrondi > 0 ? "+" : arrondi < 0 ? "−" : "±";
  return `${signe}${Math.abs(arrondi)} %`;
}

// Ce qui distingue les deux vues : valeur colorée, texte de la case, calcul en toutes lettres
export type VueSpecialisation = {
  // Valeur portée par la couleur (échelle logarithmique centrée sur 1) ; null : case sans couleur
  couleur: (cellule: SpecialisationCellule) => number | null;
  etiquette: (cellule: SpecialisationCellule) => string;
  fiable: (cellule: SpecialisationCellule) => boolean;
  // Lignes de l'infobulle (HTML) et description pour les lecteurs d'écran
  infobulle: (cellule: SpecialisationCellule, discipline: Discipline) => string;
  description: (cellule: SpecialisationCellule, discipline: Discipline) => string;
  // Tableau : valeur et calcul d'une case, et ligne de référence du monde
  cellule: (cellule: SpecialisationCellule) => string;
  monde: (discipline: Discipline) => string;
  legende: string;
  couleurs: [string, string, string];
  graduation: (valeur: number) => string;
};

export function getVue(vue: SpecialisationVue, data: Specialisation): VueSpecialisation {
  return vue === "niveau" ? getVueNiveau(data) : getVueEvolution(data);
}

function getVueNiveau(data: Specialisation): VueSpecialisation {
  const fiabilite = (fiable: boolean) => (fiable ? "" : `<br/><b>Peu fiable</b> : moins de ${data.seuil_fiabilite} articles`);
  return {
    couleur: (cellule) => cellule.indice || null,
    etiquette: (cellule) => {
      if (cellule.indice === null) return "—";
      const valeur = cellule.indice.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return cellule.fiable ? valeur : `${valeur}*`;
    },
    fiable: (cellule) => cellule.fiable,
    infobulle: (cellule, discipline) => `Indice de spécialisation : <b>${formatIndice(cellule.indice)}</b><br/>`
      + "= part dans le pays ÷ part dans le monde<br/>"
      + `Pays : ${formatPartCalcul(cellule.part)} articles<br/>`
      + `Monde : ${formatPartCalcul(discipline.part_monde)} articles`
      + fiabilite(cellule.fiable),
    description: (cellule, discipline) => `indice ${formatIndice(cellule.indice)} = ${formatPartCalcul(cellule.part)} des articles du pays`
      + ` ÷ ${formatPartCalcul(discipline.part_monde)} des articles mondiaux`,
    cellule: (cellule) => (cellule.indice === null ? "—" : `${formatIndice(cellule.indice)} · ${formatPartCalcul(cellule.part)}`),
    monde: (discipline) => formatPartCalcul(discipline.part_monde),
    legende: "Indice de spécialisation (1 = comme le monde)",
    couleurs: ["sr-specialisation-sous", "sr-specialisation-neutre", "sr-specialisation-sur"],
    graduation: formatIndice,
  };
}

function getVueEvolution(data: Specialisation): VueSpecialisation {
  const { depart: periodeDepart, arrivee: periodeArrivee } = data.periodes!;
  const fiabilite = (fiable: boolean) => (fiable ? "" : `<br/><b>Peu fiable</b> : moins de ${data.seuil_fiabilite} articles sur l'une des périodes`);
  const indice = ({ indice: valeur }: SpecialisationIndice) => formatIndice(valeur);
  const variation = (cellule: SpecialisationCellule) => {
    const valeur = cellule.evolution?.valeur;
    return valeur === null || valeur === undefined ? "—" : formatVariation(valeur);
  };
  const periode = (libelle: string, annees: [number, number], pays: SpecialisationIndice, monde: Ratio) => [
    `${libelle} ${formatPeriode(annees)} : indice ${indice(pays)}`,
    `· pays ${formatPartCalcul(pays.part)} articles`,
    `· monde ${formatPartCalcul(monde)} articles`,
  ].join("<br/>");
  return {
    couleur: (cellule) => {
      const valeur = cellule.evolution?.valeur;
      return valeur === null || valeur === undefined || valeur <= -100 ? null : 1 + valeur / 100;
    },
    etiquette: (cellule) => (cellule.evolution?.fiable === false && cellule.evolution.valeur !== null ? `${variation(cellule)}*` : variation(cellule)),
    fiable: (cellule) => cellule.evolution?.fiable ?? false,
    infobulle: (cellule, discipline) => {
      const { arrivee, depart, fiable } = cellule.evolution!;
      const monde = discipline.part_monde_evolution!;
      return [
        `Évolution de l'indice : <b>${variation(cellule)}</b> (${indice(depart)} → ${indice(arrivee)})`,
        periode("Départ", periodeDepart, depart, monde.depart),
        periode("Arrivée", periodeArrivee, arrivee, monde.arrivee),
      ].join("<br/>") + fiabilite(fiable);
    },
    description: (cellule, discipline) => {
      const { arrivee, depart } = cellule.evolution!;
      const monde = discipline.part_monde_evolution!;
      return `évolution de l'indice ${variation(cellule)}, de ${indice(depart)} (${formatPartCalcul(depart.part)} des articles du pays`
        + ` ÷ ${formatPartCalcul(monde.depart)} des articles mondiaux) à ${indice(arrivee)} (${formatPartCalcul(arrivee.part)}`
        + ` ÷ ${formatPartCalcul(monde.arrivee)})`;
    },
    cellule: (cellule) => {
      if (!cellule.evolution || cellule.evolution.valeur === null) return "—";
      const { arrivee, depart } = cellule.evolution;
      return `${variation(cellule)} · ${indice(depart)} ${formatPartCalcul(depart.part)} → ${indice(arrivee)} ${formatPartCalcul(arrivee.part)}`;
    },
    monde: (discipline) => {
      const monde = discipline.part_monde_evolution!;
      return `${formatPartCalcul(monde.depart)} → ${formatPartCalcul(monde.arrivee)}`;
    },
    legende: `Évolution de l'indice de spécialisation entre ${formatPeriode(periodeDepart)} et ${formatPeriode(periodeArrivee)}`,
    couleurs: ["sr-specialisation-recul", "sr-specialisation-neutre", "sr-specialisation-progression"],
    // La couleur porte le rapport arrivée / départ : graduation en variation
    graduation: (valeur) => formatVariation((valeur - 1) * 100),
  };
}

// Exemple de lecture : discipline de plus forte spécialisation (niveau) ou de plus forte progression (évolution)
// du pays mis en avant, avec son calcul
export function getLectureSpecialisation(data: Specialisation, vue: SpecialisationVue, paysId: string): string | null {
  const pays = data.pays.find(({ entite_id: id }) => id === paysId);
  const code = vue === "niveau" ? pays?.discipline_max : pays?.discipline_max_evolution;
  const index = data.disciplines.findIndex(({ discipline_code: c }) => c === code);
  if (!pays || index < 0) return null;
  const discipline = data.disciplines[index];
  const cellule = pays.cellules[index];
  const nomDiscipline = `${discipline.discipline_code} (${discipline.discipline_nom})`;
  if (vue === "niveau") {
    return `Sur ${formatPeriode(data.periode)}, ${pays.nom} est le plus spécialisé en ${nomDiscipline} : `
      + `indice ${formatIndice(cellule.indice)}, soit ${formatPartCalcul(cellule.part)} des articles du pays`
      + ` ÷ ${formatPartCalcul(discipline.part_monde)} des articles mondiaux.`;
  }
  const { arrivee, depart, valeur } = cellule.evolution!;
  const monde = discipline.part_monde_evolution!;
  const { depart: periodeDepart, arrivee: periodeArrivee } = data.periodes!;
  return `Entre ${formatPeriode(periodeDepart)} et ${formatPeriode(periodeArrivee)}, la plus forte progression de ${pays.nom} est en ${nomDiscipline} : `
    + `indice ${formatIndice(depart.indice)} → ${formatIndice(arrivee.indice)} (${formatVariation(valeur!)}). `
    + `Part de la discipline dans les articles du pays : ${formatPartCalcul(depart.part)} → ${formatPartCalcul(arrivee.part)} ; `
    + `dans les articles mondiaux : ${formatPartCalcul(monde.depart)} → ${formatPartCalcul(monde.arrivee)}.`;
}

// Domaines et plages de codes, pour lire les en-têtes de colonnes : « LS1–LS9 : Sciences de la vie »
function getDomaines(disciplines: Discipline[]): { code: string; nom: string; plage: string }[] {
  const domaines = new Map<string, Discipline[]>();
  disciplines.forEach((discipline) => domaines.set(discipline.domaine_code, [...(domaines.get(discipline.domaine_code) ?? []), discipline]));
  return [...domaines.entries()].map(([code, liste]) => ({
    code,
    nom: liste[0].domaine_nom,
    plage: `${liste[0].discipline_code}–${liste[liste.length - 1].discipline_code}`,
  }));
}

const LIBELLES_COULEURS: Record<SpecialisationVue, [string, string]> = {
  niveau: [
    "Indice supérieur à 1 : discipline sur-représentée dans les articles du pays",
    "Indice inférieur à 1 : discipline sous-représentée",
  ],
  evolution: [
    "Indice en hausse : le pays se renforce dans la discipline, relativement au monde",
    "Indice en baisse : il s'y renforce moins vite que le monde, ou s'en retire",
  ],
};

// Groupes de pays au profil proche : membres et disciplines les plus sur-représentées dans leurs articles
function ListeGroupes({ data }: { data: Specialisation }) {
  const nomDe = new Map(data.pays.map(({ entite_id: id, nom }) => [id, nom]));
  return (
    <ul aria-label="Groupes de pays au profil proche" className="fr-text--sm fr-mb-0 fr-mt-2w">
      {data.groupes.map(({ disciplines, numero, pays }) => (
        <li key={numero}>
          <span className="fr-text--bold">{`Groupe ${numero}`}</span>
          {` : ${pays.map((id) => nomDe.get(id) ?? id).join(", ")}`}
          {disciplines.length > 0 && ` — disciplines les plus sur-représentées : ${disciplines.join(", ")}`}
        </li>
      ))}
    </ul>
  );
}

export function LegendeSpecialisation({ data, vue }: { data: Specialisation; vue: SpecialisationVue }) {
  const [haut, bas] = LIBELLES_COULEURS[vue];
  const [couleurBas, , couleurHaut] = getVue(vue, data).couleurs;
  return (
    <>
      <ul aria-label="Légende" className="sr-legende fr-text--sm fr-mb-0">
        <li>
          <svg aria-hidden="true" height="12" width="24"><rect fill={`var(--${couleurHaut})`} height="12" width="24" /></svg>
          {haut}
        </li>
        <li>
          <svg aria-hidden="true" height="12" width="24"><rect fill={`var(--${couleurBas})`} height="12" width="24" /></svg>
          {bas}
        </li>
        {getDomaines(data.disciplines).map(({ code, nom, plage }) => (
          <li key={code}>{`${plage} : ${nom}`}</li>
        ))}
      </ul>
      <ListeGroupes data={data} />
    </>
  );
}

type TableProps = { caption: string; data: Specialisation; vue: SpecialisationVue };

// Vue tableau : une ligne de référence (part mondiale de chaque discipline), puis une ligne par pays
export function TableSpecialisation({ caption, data, vue }: TableProps) {
  const textes = getVue(vue, data);
  const contenu = (pays: Pays, j: number) => {
    const cellule = pays.cellules[j];
    const texte = textes.cellule(cellule);
    return texte !== "—" && !textes.fiable(cellule) ? `${texte} · peu fiable` : texte;
  };

  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{caption}</caption>
              <thead>
                <tr>
                  <th scope="col">Pays</th>
                  <th scope="col">Groupe</th>
                  <th scope="col">Articles, toutes disciplines</th>
                  {data.disciplines.map(({ discipline_code: code, discipline_nom: nom }) => (
                    <th key={code} scope="col">
                      {code}
                      <span className="fr-sr-only"> {nom}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Monde (référence, indice 1)</th>
                  <td>—</td>
                  <td>{formatArticles(data.nb_articles_monde)}</td>
                  {data.disciplines.map((discipline) => <td key={discipline.discipline_code}>{textes.monde(discipline)}</td>)}
                </tr>
                {data.pays.map((pays) => (
                  <tr key={pays.entite_id}>
                    <th scope="row">{pays.nom}</th>
                    <td>{pays.groupe}</td>
                    <td>{formatArticles(pays.nb_articles)}</td>
                    {data.disciplines.map(({ discipline_code: code }, j) => <td key={code}>{contenu(pays, j)}</td>)}
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
