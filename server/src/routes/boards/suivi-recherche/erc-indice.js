import { getCollection } from "./collections.js";

// Indice de candidature ERC : candidatures observées / candidatures attendues.
// Candidatures attendues = Σ (discipline, année d'appel) articles de l'entité × taux de candidature de la référence,
// où le taux de candidature de la référence = candidatures / articles des pays de référence, dans la même discipline
// et pour le même appel. La correction par discipline évite de pénaliser une entité forte dans les disciplines qui
// publient peu dans les revues SJR. Même calcul pour les lauréats ; indice des lauréats = indice de candidature ×
// indice de réussite (taux de succès / taux de succès attendu avec le profil disciplinaire de l'entité).

const PERIMETRE = "revues_sjr";
const CLASSEMENT = "erc";
// Un appel est rapproché des articles des 3 années qui le précèdent (vivier des candidats de cet appel)
export const DECALAGE = 3;
// Vivier : articles du top 10 % des plus cités (défaut, l'ERC sélectionne l'excellence) ou tous les articles
export const VIVIERS = { top10: "nb_articles_top10_cites", articles: "nb_articles" };
export const VIVIER_DEFAUT = "top10";
// Référence : les pays de l'Union européenne parmi erc_meta.pays_compares. Les pays associés (Suisse, Royaume-Uni)
// ont été exclus de certains appels et les pays tiers n'accueillent pas de bourse ERC : ils feraient baisser le taux
// de candidature de référence.
const PAYS_UE = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
];

export function getPaysReference(meta) {
  return meta.pays_compares.filter((pays) => PAYS_UE.includes(pays));
}

// Seuls les types avec panel se comparent discipline par discipline (Synergy et Proof of Concept n'en ont pas)
export function getTypesAvecPanel(meta, types) {
  return meta.types_bourse.filter(({ code, avec_panel }) => avec_panel && types.includes(code)).map(({ code }) => code);
}

// Années de publication du vivier d'un appel
export function getAnneesVivier(appel) {
  return Array.from({ length: DECALAGE }, (_, index) => appel - DECALAGE + index);
}

// Candidatures, lauréats (types avec panel) et articles du vivier des entités demandées et des pays de référence,
// par entité, année et discipline
export async function loadIndiceEffectifs({ champs, disciplineMatch, periode }, typesPanel, entiteIds, vivier) {
  const [debut, fin] = periode;
  const disciplines = disciplineMatch ? { discipline_code: disciplineMatch } : {};
  const group = (annee) => ({ entite_id: "$entite_id", annee, discipline: "$discipline_code" });

  const [erc, biblio] = await Promise.all([
    (await getCollection("erc_effectifs")).aggregate([{
      $match: {
        entite_id: { $in: entiteIds },
        annee_appel: { $gte: debut, $lte: fin },
        type_bourse: { $in: typesPanel },
        discipline_code: { $ne: null },
        ...disciplines,
      },
    }, {
      $group: {
        _id: group("$annee_appel"),
        candidatures: { $sum: `$${champs.candidatures}` },
        laureats: { $sum: `$${champs.laureats}` },
      },
    }]).toArray(),
    (await getCollection("biblio_effectifs")).aggregate([{
      $match: {
        entite_id: { $in: entiteIds },
        perimetre: PERIMETRE,
        classement: CLASSEMENT,
        annee_publication: { $gte: debut - DECALAGE, $lte: fin - 1 },
        ...disciplines,
      },
    }, {
      $group: { _id: group("$annee_publication"), articles: { $sum: `$${VIVIERS[vivier]}` } },
    }]).toArray(),
  ]);
  return { erc, biblio };
}

// Effectifs additionnés d'un groupe d'entités, par cellule (année d'appel, discipline)
function sommerParCellule({ erc, biblio }, entiteIds, annees) {
  const cellules = new Map();
  const cellule = (appel, discipline) => {
    const cle = `${appel}|${discipline}`;
    if (!cellules.has(cle)) cellules.set(cle, { candidatures: 0, laureats: 0, articles: 0 });
    return cellules.get(cle);
  };

  erc
    .filter(({ _id }) => entiteIds.includes(_id.entite_id) && annees.includes(_id.annee))
    .forEach(({ _id, candidatures, laureats }) => {
      const somme = cellule(_id.annee, _id.discipline);
      somme.candidatures += candidatures;
      somme.laureats += laureats;
    });
  biblio
    .filter(({ _id }) => entiteIds.includes(_id.entite_id))
    .forEach(({ _id, articles }) => {
      annees
        .filter((appel) => getAnneesVivier(appel).includes(_id.annee))
        .forEach((appel) => { cellule(appel, _id.discipline).articles += articles; });
    });
  return cellules;
}

function ratio(numerateur, denominateur) {
  return { valeur: denominateur ? numerateur / denominateur : null, numerateur, denominateur };
}

// On additionne d'abord (candidatures observées, candidatures attendues), on divise ensuite.
// `fiable` : au moins `seuil` candidatures attendues. Une entité sans candidature mais avec un vivier important
// donne un signal fiable de sous-candidature ; c'est l'attendu, pas l'observé, qui compte.
export function computeIndices(effectifs, entiteId, annees, paysReference, seuil) {
  const entite = sommerParCellule(effectifs, [entiteId], annees);
  const reference = sommerParCellule(effectifs, paysReference, annees);

  let candidatures = 0;
  let laureats = 0;
  let candidaturesAttendues = 0;
  let laureatsAttendus = 0;
  entite.forEach((somme, cle) => {
    candidatures += somme.candidatures;
    laureats += somme.laureats;
    const ref = reference.get(cle);
    if (ref?.articles) {
      candidaturesAttendues += (somme.articles * ref.candidatures) / ref.articles;
      laureatsAttendus += (somme.articles * ref.laureats) / ref.articles;
    }
  });

  const taux = candidatures ? laureats / candidatures : null;
  const tauxAttendu = candidaturesAttendues ? laureatsAttendus / candidaturesAttendues : null;
  return {
    fiable: candidaturesAttendues >= seuil,
    candidature: ratio(candidatures, candidaturesAttendues),
    laureats: ratio(laureats, laureatsAttendus),
    // Taux de succès / taux attendu : numérateur et dénominateur sont des taux (null sans candidature)
    reussite: { valeur: taux !== null && tauxAttendu ? taux / tauxAttendu : null, numerateur: taux, denominateur: tauxAttendu },
    // Taux de succès sur les mêmes candidatures (types avec panel), pour le croisement avec l'indice
    taux_succes: ratio(laureats, candidatures),
  };
}

// Taux de succès des pays de référence, sur les mêmes candidatures que les indices
export function computeTauxReference(effectifs, paysReference, annees) {
  let candidatures = 0;
  let laureats = 0;
  sommerParCellule(effectifs, paysReference, annees).forEach((somme) => {
    candidatures += somme.candidatures;
    laureats += somme.laureats;
  });
  return ratio(laureats, candidatures);
}
