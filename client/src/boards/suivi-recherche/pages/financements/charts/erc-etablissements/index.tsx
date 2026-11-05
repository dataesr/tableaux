import { Col, Row, SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";
import { useMemo } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import { getCssColor } from "../../../../../../utils/colors";
import type { GroupeEtablissements } from "../../../../api";
import type { ErcPositionnementMatrice, IndicateurMatrice } from "../../../../api/erc.ts";
import LegendeTailles from "../../../../components/matrice/legende-tailles.tsx";
import getMatriceOptions from "../../../../components/matrice/options.tsx";
import Quadrants from "../../../../components/matrice/quadrants.tsx";
import { getNomCourt } from "../../../../components/matrice/utils.tsx";
import type { MatriceTextes } from "../../../../components/matrice/utils.tsx";
import { formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { UNITES } from "../../comptage.ts";

import "../../../../components/matrice/styles.scss";

type Point = ErcPositionnementMatrice["points"][number];

export const INDICATEURS_MATRICE: { key: IndicateurMatrice; label: string }[] = [
  { key: "part_laureats", label: "Part des lauréats" },
  { key: "taux_succes", label: "Taux de succès" },
];

const cle = (p: Point) => p.entite_id;
const nomCourt = (p: Point) => p.sigle ?? p.nom;
// Établissement choisi en orange, comme dans les autres graphiques ERC (le bleu Marianne est réservé à la France)
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

// Libellés de la matrice ERC : niveau = part des lauréats français ou taux de succès, taille = lauréats
function getTextes(data: ErcPositionnementMatrice): MatriceTextes {
  const unites = UNITES[data.comptage];
  const taux = data.indicateur === "taux_succes";
  const arrivee = formatPeriode(data.periodes.arrivee);
  return {
    axeX: taux
      ? `Niveau : taux de succès ${arrivee} (échelle logarithmique)`
      : `Niveau : part des ${unites.laureats} ERC français ${arrivee} (échelle logarithmique)`,
    axeY: `Dynamique : évolution relative ${taux ? "du taux de succès" : "de la part"} depuis ${formatPeriode(data.periodes.depart)}`,
    calcul: ({ numerateur, denominateur }) => (taux
      ? `${formatNombre(numerateur)} ${unites.laureats} / ${formatNombre(denominateur)} ${unites.candidatures}`
      : `${formatNombre(numerateur)} / ${formatNombre(denominateur)} ${unites.laureats} français`),
    niveau: taux ? "Taux de succès" : "Part",
    peuFiable: `moins de ${data.seuil_fiabilite} ${taux ? unites.candidatures : unites.laureats} sur l'une des deux périodes`,
    taille: { colonne: unites.Laureats, format: formatNombre, unite: unites.laureats },
  };
}

type ControlesProps = {
  groupe: string | undefined;
  groupes: GroupeEtablissements[];
  indicateur: IndicateurMatrice;
  onGroupe: (groupe: string) => void;
  onIndicateur: (indicateur: IndicateurMatrice) => void;
};

// Niveau et groupe comparé : hors du grisé, utilisables pendant le recalcul
export function ControlesMatrice({ groupe, groupes, indicateur, onGroupe, onIndicateur }: ControlesProps) {
  return (
    <Row gutters className="fr-mb-1w">
      <Col xs="12" md="6">
        <SegmentedControl className="fr-segmented--sm" label="Niveau" name="sr-erc-etablissements-indicateur">
          {INDICATEURS_MATRICE.map(({ key, label }) => (
            <SegmentedElement checked={indicateur === key} key={key} label={label} onClick={() => onIndicateur(key)} value={key} />
          ))}
        </SegmentedControl>
      </Col>
      <Col xs="12" md="6">
        {groupes.length > 0 && (
          <Select label="Établissements comparés" onChange={(key) => onGroupe(String(key))} value={groupe}>
            {groupes.map((g) => <SelectOption key={g.code}>{`${g.libelle} (${g.nb})`}</SelectOption>)}
          </Select>
        )}
      </Col>
    </Row>
  );
}

type ErcEtablissementsProps = {
  data: ErcPositionnementMatrice;
  disciplineLabel: string;
  entiteNom: string;
};

// Matrice niveau × dynamique des établissements d'un groupe : même lecture que la matrice de la bibliométrie
export default function ErcEtablissements({ data, disciplineLabel, entiteNom }: ErcEtablissementsProps) {
  const textes = useMemo(() => getTextes(data), [data]);
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

  const label = INDICATEURS_MATRICE.find(({ key }) => key === data.indicateur)?.label ?? "";
  const groupeLibelle = data.groupes.find(({ code }) => code === data.groupe)?.libelle ?? "";
  const { reference } = data;
  const referenceTexte = data.indicateur === "taux_succes"
    ? `taux de succès de la France (${formatPart(reference.valeur)} = ${textes.calcul({ valeur: reference.valeur, numerateur: reference.numerateur ?? 0, denominateur: reference.denominateur ?? 0 })})`
    : `médiane des établissements représentés (${formatPart(reference.valeur)})`;

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
      {chartOptions ? (
        <>
          <ChartWrapper
            config={{
              id: "suivi-recherche-financements-erc-etablissements",
              title: {
                fr: `${label} ERC des établissements · ${groupeLibelle} · ${disciplineLabel} · appels ${formatPeriode(data.periodes.depart)} → ${formatPeriode(data.periodes.arrivee)}`,
                look: "h5" as const,
              },
              comment: {
                fr: (
                  <>
                    {`Horizontal : ${label.toLowerCase()} de chaque établissement sur les appels ${formatPeriode(data.periodes.arrivee)}, en échelle logarithmique. `}
                    {`Ligne pointillée : ${referenceTexte} ; à droite, ceux qui font mieux. `}
                    {`Vertical : valeur d'arrivée ÷ valeur des appels ${formatPeriode(data.periodes.depart)} − 1 ; au-dessus de 0, l'établissement progresse. `}
                    {`Taille : ${textes.taille.unite} des appels ${formatPeriode(data.periodes.arrivee)}. Appels consolidés seulement (résultats tous publiés). `}
                    {"Un même ERC compte pour plusieurs établissements (tutelles) : les parts ne s'additionnent pas. "}
                    {data.provisoire && " Attention : la période d'arrivée contient des appels provisoires."}
                    {data.exclus.length > 0 && ` ${data.exclus.length} établissement(s) non représenté(s) : aucun lauréat sur une période ou évolution non calculable.`}
                  </>
                ),
              },
            }}
            legend={legend}
            options={chartOptions}
          />
          <Quadrants cle={cle} colonne="Établissement" data={data} libelle={libelle} textes={textes} vide="Aucun établissement." />
        </>
      ) : (
        <p className="fr-text--sm">
          Aucun établissement de ce groupe n'est représentable pour cette sélection : élargissez la période, la discipline ou changez de groupe.
        </p>
      )}
    </>
  );
}
