import { Select, SelectOption } from "@dataesr/dsfr-plus";
import { useMemo } from "react";
import type { JSX } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import { getCssColor } from "../../../../../../utils/colors";
import type { EtablissementPoint, GroupeEtablissements, Matrice, SourceDonnees } from "../../../../api";
import LegendeTailles from "../../../../components/matrice/legende-tailles.tsx";
import getMatriceOptions from "../../../../components/matrice/options.tsx";
import Quadrants from "../../../../components/matrice/quadrants.tsx";
import { getLectureMatrice, getNomCourt } from "../../../../components/matrice/utils.tsx";
import type { MatriceTextes } from "../../../../components/matrice/utils.tsx";
import { getChartSources } from "../../../../components/sources.tsx";

import "../../../../components/matrice/styles.scss";

type Donnees = Matrice<EtablissementPoint, string> & { groupe: string; groupes: GroupeEtablissements[] };
type Point = Donnees["points"][number];

const cle = (p: Point) => p.entite_id;
const nomCourt = (p: Point) => p.sigle ?? p.nom;
// Établissement choisi en orange, comme dans les autres graphiques des financements (le bleu Marianne est réservé à la France)
const couleur = (p: Point) => getCssColor(p.focus ? "sr-etablissement-selectionne" : "sr-etablissement");

const libelle = (p: Point) => (
  <>
    <svg aria-hidden="true" className="fr-mr-1w" height="10" width="10">
      <circle cx="5" cy="5" fill={couleur(p)} r="5" />
    </svg>
    {p.focus ? <strong>{p.nom}</strong> : p.nom}
    {p.sigle && <span className="fr-text-mention--grey">{` ${p.sigle}`}</span>}
  </>
);

type ChoixGroupeProps = {
  groupe: string | undefined;
  groupes: GroupeEtablissements[];
  onGroupe: (groupe: string) => void;
};

// Groupe d'établissements comparés, commun aux matrices de l'onglet : hors du grisé, utilisable pendant le recalcul
export function ChoixGroupe({ groupe, groupes, onGroupe }: ChoixGroupeProps) {
  if (groupes.length === 0) return null;
  return (
    <Select label="Établissements comparés" onChange={(key) => onGroupe(String(key))} value={groupe}>
      {groupes.map((g) => <SelectOption key={g.code}>{`${g.libelle} (${g.nb})`}</SelectOption>)}
    </Select>
  );
}

type MatriceEtablissementsProps = {
  commentaire: JSX.Element;
  data: Donnees;
  entiteNom: string;
  id: string;
  sources: SourceDonnees[];
  textes: MatriceTextes;
  titre: string;
};

// Matrice niveau × dynamique des établissements d'un groupe (ERC, IUF) : même lecture que la matrice de la bibliométrie
export default function MatriceEtablissements({ commentaire, data, entiteNom, id, sources, textes, titre }: MatriceEtablissementsProps) {
  const chartOptions = useMemo(() => (data.points.length > 0
    ? getMatriceOptions(data, {
      serie: "Établissements",
      textes,
      couleur,
      etiquette: (p) => (p.focus ? `<b>${getNomCourt(nomCourt(p), 22)}</b>` : getNomCourt(nomCourt(p), 22)),
      entete: (p) => [`<b>${p.nom}</b>${p.sigle ? ` (${p.sigle})` : ""}`, p.categorie],
      focus: (p) => p.focus,
    })
    : null), [data, textes]);
  const groupeLibelle = data.groupes.find(({ code }) => code === data.groupe)?.libelle ?? "";
  // Exemple de lecture : l'établissement sélectionné, sinon la plus grosse bulle
  const pointLu = data.points.find((p) => p.focus) ?? data.points[0];

  if (!chartOptions) {
    return (
      <p className="fr-text--sm">
        Aucun établissement de ce groupe n'est représentable pour cette sélection : élargissez la période, la discipline ou changez de groupe.
      </p>
    );
  }

  const legend = (
    <div className="sr-matrice-legende">
      <ul aria-label="Couleur" className="fr-text--sm fr-mb-0">
        {data.points.some((p) => p.focus) && (
          <li>
            <svg aria-hidden="true" height="14" width="14">
              <circle cx="7" cy="7" fill="var(--sr-etablissement-selectionne)" fillOpacity="0.5" r="5.5" stroke="var(--sr-etablissement-selectionne)" strokeWidth="3" />
            </svg>
            {entiteNom}
          </li>
        )}
        <li>
          <svg aria-hidden="true" height="14" width="14">
            <circle cx="7" cy="7" fill="var(--sr-etablissement)" fillOpacity="0.5" r="6" stroke="var(--sr-etablissement)" strokeWidth="1.5" />
          </svg>
          {groupeLibelle}
        </li>
      </ul>
      <LegendeTailles data={data} textes={textes} />
    </div>
  );

  return (
    <>
      <ChartWrapper
        config={{
          id,
          title: { fr: titre, look: "h5" as const },
          comment: { fr: commentaire },
          readingKey: { fr: <>{getLectureMatrice(data, textes, pointLu, pointLu.nom)}</> },
          sources: getChartSources(sources),
        }}
        legend={legend}
        options={chartOptions}
      />
      <Quadrants cle={cle} colonne="Établissement" data={data} libelle={libelle} textes={textes} vide="Aucun établissement." />
    </>
  );
}
