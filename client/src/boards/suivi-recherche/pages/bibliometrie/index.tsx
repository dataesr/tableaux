import { Alert, Container, Notice, SegmentedControl, SegmentedElement, Title, Toggle } from "@dataesr/dsfr-plus";
import { Link, Outlet, useLocation } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useBiblioDisciplines, useBiblioEntites, useBiblioMeta } from "../../api";
import { useBiblioOptions, useSelection } from "../../hooks/use-selection";
import { getOptionsLabel, PERIMETRE_LABELS } from "./context.ts";
import type { BibliometrieContext } from "./context.ts";

import "./styles.scss";

const BASE = "/suivi-recherche/bibliometrie";

// Une sous-page par question ; la sélection (paramètres d'URL) suit d'une sous-page à l'autre
const SOUS_PAGES = [
  { path: "profil", label: "Profil", question: "Où en est l'établissement sélectionné ?" },
  { path: "etablissements", label: "Établissements", question: "Comment se situe-t-il parmi des établissements comparables ?" },
  { path: "international", label: "International", question: "Comment se situe la France parmi les pays ?" },
] as const;

export default function BibliometrieLayout() {
  const { pathname, search } = useLocation();
  const pays = pathname.startsWith(`${BASE}/international`);
  const meta = useBiblioMeta();
  const disciplines = useBiblioDisciplines();
  const entites = useBiblioEntites();
  const { selection, setParams } = useSelection(meta.data, { pays });
  const options = useBiblioOptions(meta.data);

  const isLoading = meta.isLoading || disciplines.isLoading || entites.isLoading;
  const isError = meta.isError || disciplines.isError || entites.isError;
  const entiteNom = entites.data?.find((entite) => entite.entite_id === selection?.entiteId)?.nom ?? selection?.entiteId ?? "";
  const courante = SOUS_PAGES.find(({ path }) => pathname.startsWith(`${BASE}/${path}`));
  const optionsLabel = getOptionsLabel(options);

  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Bibliométrie</Title>
      <p className="fr-text--lead fr-mb-2w">
        Poids, influence et prestige des publications scientifiques, en part de la production mondiale.
      </p>

      <nav aria-label="Sections de la bibliométrie" className="sr-sous-nav fr-mb-3w">
        <ul>
          {SOUS_PAGES.map(({ path, label }) => (
            <li key={path}>
              <Link aria-current={courante?.path === path ? "page" : undefined} to={`${BASE}/${path}${search}`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        {courante && <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{courante.question}</p>}
      </nav>

      {isLoading && <DefaultSkeleton height="200px" label="Chargement des données" />}
      {isError && (
        <Alert
          description="Les données bibliométriques ne sont pas disponibles pour le moment. Réessayez plus tard."
          title="Erreur de chargement"
          variant="error"
        />
      )}

      {meta.data && disciplines.data && entites.data && (
        <>
          {/* Paramètres rarement changés : repliés, leur valeur courante reste lisible dans le résumé */}
          <details className="sr-details fr-mb-3w">
            <summary>
              <span className="fr-text--bold">Paramètres de calcul</span>
              <span className="fr-text--sm fr-text-mention--grey">{` · ${optionsLabel}`}</span>
            </summary>
            <div className="sr-details__contenu sr-parametres">
              <SegmentedControl className="fr-segmented--sm" label="Revues de référence" name="sr-perimetre">
                {meta.data.perimetres.map((perimetre) => (
                  <SegmentedElement
                    checked={options.perimetre === perimetre}
                    key={perimetre}
                    label={PERIMETRE_LABELS[perimetre] ?? perimetre}
                    onClick={() => setParams({ perimetre: perimetre === "revues_sjr" ? null : perimetre })}
                    value={perimetre}
                  />
                ))}
              </SegmentedControl>
              <Toggle
                checked={options.inclureMultidisciplinaires}
                hint={meta.data.revues_multidisciplinaires.join(", ")}
                id="sr-multidisciplinaires"
                label="Prestige : inclure les revues multidisciplinaires"
                onChange={(event) => setParams({ multi: event.target.checked ? null : "false" })}
              />
            </div>
          </details>

          {selection ? (
            <Outlet
              context={{
                disciplines: disciplines.data,
                entiteNom,
                entites: entites.data,
                meta: meta.data,
                options,
                selection,
              } satisfies BibliometrieContext}
            />
          ) : (
            <Notice closeMode="disallow" type="info">Choisissez un établissement dans la sélection ci-dessus.</Notice>
          )}

          {meta.data.methode.length > 0 && (
            <details className="sr-details fr-mt-6w">
              <summary>
                <span className="fr-text--bold">Méthode</span>
                <span className="fr-text--sm fr-text-mention--grey"> · périmètre, comptage, indicateurs, années provisoires</span>
              </summary>
              <ul className="sr-details__contenu">
                {meta.data.methode.map((texte) => <li key={texte}>{texte}</li>)}
              </ul>
            </details>
          )}
        </>
      )}
    </Container>
  );
}
