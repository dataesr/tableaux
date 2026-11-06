import { Badge, Notice, SelectableTag, TagGroup, Title } from "@dataesr/dsfr-plus";
import { Fragment, useId } from "react";
import type { ReactNode } from "react";

import { DISPOSITIFS, useDispositifs } from "../../dispositifs.ts";
import type { Dispositif, DispositifId } from "../../dispositifs.ts";
import "./styles.scss";

// Contenu d'un dispositif dans un onglet : son bloc, ou l'annonce d'un bloc sans données pour l'instant.
// `description` remplace la description générale du dispositif quand l'onglet n'en montre qu'une partie.
// Un dispositif absent de `contenus` n'existe pas dans l'onglet : ni tag, ni bloc.
export type ContenuDispositif =
  | { bloc: ReactNode; description?: string }
  | { enPreparation: true };

type BlocDispositifProps = {
  children: ReactNode;
  description?: string;
  dispositif: Dispositif;
};

// En-tête commun : nature du dispositif (badge), nom, ce qu'il mesure ; puis le contenu du bloc (réglages, chiffres, graphiques, méthode)
function BlocDispositif({ children, description, dispositif }: BlocDispositifProps) {
  const titreId = useId();
  return (
    <section aria-labelledby={titreId}>
      <div className="sr-bloc-dispositif__titre fr-mb-1w">
        <Title as="h2" className="fr-mb-0" id={titreId} look="h4">{dispositif.label}</Title>
        <Badge color={dispositif.couleur} noIcon size="sm">{dispositif.nature}</Badge>
      </div>
      <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">{description ?? dispositif.description}</p>
      {children}
    </section>
  );
}

// Choix des dispositifs affichés (paramètre `dispositif`) : les blocs masqués ne sont pas rendus et ne lancent pas leurs requêtes
function ChoixDispositifs({ disponibles }: { disponibles: Dispositif[] }) {
  const { basculer, estAffiche, affiches } = useDispositifs(disponibles.map(({ id }) => id));
  const labelId = useId();
  return (
    <div aria-labelledby={labelId} className="fr-mb-2w" role="group">
      <p className="fr-text--sm fr-mb-1w" id={labelId}>Dispositifs affichés</p>
      <TagGroup>
        {disponibles.map(({ id, label }) => {
          // Le dernier dispositif affiché ne peut pas être masqué
          const seul = affiches.length === 1 && estAffiche(id);
          return (
            <SelectableTag disabled={seul} key={id} onClick={() => basculer(id)} selected={estAffiche(id)}>
              {label}
            </SelectableTag>
          );
        })}
      </TagGroup>
    </div>
  );
}

// Blocs d'un onglet, un par dispositif qu'il traite, séparés et filtrables (choix masqué s'il n'y en a qu'un)
export default function Dispositifs({ contenus }: { contenus: Partial<Record<DispositifId, ContenuDispositif>> }) {
  const disponibles = DISPOSITIFS.filter(({ id }) => id in contenus);
  const { estAffiche } = useDispositifs(disponibles.map(({ id }) => id));
  const affiches = disponibles.filter(({ id }) => estAffiche(id));

  return (
    <>
      {disponibles.length > 1 && <ChoixDispositifs disponibles={disponibles} />}
      {affiches.map((dispositif, index) => {
        const contenu = contenus[dispositif.id] as ContenuDispositif;
        return (
          <Fragment key={dispositif.id}>
            <hr className={`fr-hr ${index === 0 ? "fr-mt-2w" : "fr-mt-6w"} fr-pb-4w`} />
            {"enPreparation" in contenu ? (
              <BlocDispositif dispositif={dispositif}>
                <Notice closeMode="disallow" type="info">
                  {`${dispositif.label} : en préparation, les indicateurs seront ajoutés prochainement.`}
                </Notice>
              </BlocDispositif>
            ) : (
              <BlocDispositif description={contenu.description} dispositif={dispositif}>{contenu.bloc}</BlocDispositif>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
