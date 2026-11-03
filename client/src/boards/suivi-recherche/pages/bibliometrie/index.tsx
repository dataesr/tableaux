import { Accordion, Alert, Container, SegmentedControl, SegmentedElement, Tab, Tabs, Title, Toggle } from "@dataesr/dsfr-plus";

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
import { SECTIONS, useSection } from "./sections.ts";

import "./styles.scss";

const CONTENUS = {
  profil: ProfilSection,
  etablissements: EtablissementsSection,
  international: InternationalSection,
} as const;

// Un onglet par question, choisi par le paramètre `section` ; la sélection suit d'un onglet à l'autre
export default function BibliometriePage() {
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
          <Accordion
            className="fr-mb-3w"
            title={`Paramètres de calcul · ${optionsLabel}`}
            titleAs="h2"
          >
            <div className="sr-parametres">
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
          </Accordion>

          {/* Onglet courant lu dans `section` ; `key` resynchronise les onglets quand l'URL change (précédent, lien) */}
          <Tabs
            defaultActiveIndex={SECTIONS.findIndex(({ id }) => id === courante.id)}
            key={courante.id}
            onTabChange={(index) => setParams({ section: index === 0 ? null : SECTIONS[index].id })}
          >
            {SECTIONS.map((section) => (
              <Tab key={section.id} label={section.label}>
                {/* Seul l'onglet affiché est rendu : les autres ne lancent pas leurs requêtes */}
                {section.id === courante.id && selection && (
                  <>
                    <p className="fr-text-mention--grey fr-mb-3w">{section.question}</p>
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
                  </>
                )}
              </Tab>
            ))}
          </Tabs>

          {meta.data.methode.length > 0 && (
            <Accordion className="fr-mt-6w" title="Méthode · périmètre, comptage, indicateurs, années provisoires" titleAs="h2">
              <ul>
                {meta.data.methode.map((texte) => <li key={texte}>{texte}</li>)}
              </ul>
            </Accordion>
          )}
        </>
      )}
    </Container>
  );
}
