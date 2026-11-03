import { Alert, Container, SegmentedControl, SegmentedElement, Title, Toggle } from "@dataesr/dsfr-plus";
import { Link, useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useTitle } from "../../../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../../../utils";
import { useBiblioDisciplines, useBiblioEntites, useBiblioMeta } from "../../api";
import { useBiblioOptions, useSelection } from "../../hooks/use-selection";
import i18n from "../../title-i18n.json";
import { BibliometrieProvider, getOptionsLabel, PERIMETRE_LABELS } from "./context.ts";
import EtablissementsSection from "./etablissements/index.tsx";
import InternationalSection from "./international/index.tsx";
import ProfilSection from "./profil/index.tsx";
import { getSectionSearch, SECTIONS, useSection } from "./sections.ts";

import "./styles.scss";

const CONTENUS = {
  profil: ProfilSection,
  etablissements: EtablissementsSection,
  international: InternationalSection,
} as const;

// Un onglet par question, choisi par le paramètre `section` ; la sélection suit d'un onglet à l'autre
export default function BibliometriePage() {
  const [searchParams] = useSearchParams();
  const courante = useSection();
  useTitle(getI18nLabel(i18n, courante.titleKey));
  const meta = useBiblioMeta();
  const disciplines = useBiblioDisciplines();
  const entites = useBiblioEntites();
  const { selection, setParams } = useSelection(meta.data, entites.data, { pays: courante.id === "international" });
  const options = useBiblioOptions(meta.data);

  const isLoading = meta.isLoading || disciplines.isLoading || entites.isLoading;
  const isError = meta.isError || disciplines.isError || entites.isError;
  const entiteNom = entites.data?.find((entite) => entite.entite_id === selection?.entiteId)?.nom ?? selection?.entiteId ?? "";
  const optionsLabel = getOptionsLabel(options);
  const Contenu = CONTENUS[courante.id];

  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Bibliométrie</Title>
      <p className="fr-text--lead fr-mb-2w">
        Poids, influence et prestige des publications scientifiques, en part de la production mondiale.
      </p>

      <nav aria-label="Sections de la bibliométrie" className="sr-sous-nav fr-mb-3w">
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <Link
                aria-current={courante.id === section.id ? "page" : undefined}
                to={{ search: getSectionSearch(searchParams, section) }}
              >
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{courante.question}</p>
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
                onChange={(event) => setParams({ inclure_multidisciplinaires: event.target.checked ? null : "false" })}
              />
            </div>
          </details>

          {selection && (
            <BibliometrieProvider
              value={{
                disciplines: disciplines.data,
                entiteNom,
                entites: entites.data,
                meta: meta.data,
                options,
                selection,
              }}
            >
              <Contenu />
            </BibliometrieProvider>
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
