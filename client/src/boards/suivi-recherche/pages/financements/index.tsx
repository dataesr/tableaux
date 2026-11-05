import { Alert, Container, Notice, Tab, Tabs, Title } from "@dataesr/dsfr-plus";
import type { ComponentType } from "react";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useTitle } from "../../../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../../../utils";
import { useBiblioDisciplines, useBiblioEntites, useBiblioMeta } from "../../api";
import { useErcMeta } from "../../api/erc.ts";
import { useSelection } from "../../hooks/use-selection";
import i18n from "../../title-i18n.json";
import { FinancementsProvider } from "./context.ts";
import EtablissementsSection from "./etablissements/index.tsx";
import InternationalSection from "./international/index.tsx";
import ProfilSection from "./profil/index.tsx";
import { SECTIONS, useSection } from "./sections.ts";
import TestSection from "./test/index.tsx";

// Onglets dont le contenu est prêt ; les autres annoncent qu'ils sont en préparation
const CONTENUS: Partial<Record<(typeof SECTIONS)[number]["id"], ComponentType>> = {
  profil: ProfilSection,
  etablissements: EtablissementsSection,
  international: InternationalSection,
  test: TestSection,
};

// Un onglet par question, choisi par le paramètre `section`, sur le modèle de la page Bibliométrie ;
// la sélection (barre commune) suit d'un onglet à l'autre
export default function FinancementsPage() {
  const courante = useSection();
  useTitle(getI18nLabel(i18n, courante.titleKey));
  const meta = useBiblioMeta();
  const disciplines = useBiblioDisciplines();
  const entites = useBiblioEntites();
  const ercMeta = useErcMeta();
  const { selection, setParams } = useSelection(meta.data, entites.data, { pays: courante.id === "international" });

  const isLoading = meta.isLoading || disciplines.isLoading || entites.isLoading || ercMeta.isLoading;
  const isError = meta.isError || disciplines.isError || entites.isError || ercMeta.isError;
  const entiteNom = entites.data?.find((entite) => entite.entite_id === selection?.entiteId)?.nom ?? selection?.entiteId ?? "";
  const Contenu = CONTENUS[courante.id];

  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Financements</Title>
      <p className="fr-text--lead fr-mb-2w">
        Candidatures et lauréats des appels à projets compétitifs (ERC, puis ANR, IUF et médailles).
      </p>

      {isLoading && <DefaultSkeleton height="200px" label="Chargement des données" />}
      {isError && (
        <Alert
          description="Les données de financement ne sont pas disponibles pour le moment. Réessayez plus tard."
          title="Erreur de chargement"
          variant="error"
        />
      )}

      {disciplines.data && ercMeta.data && selection && (
        // Onglet courant lu dans `section` ; `key` resynchronise les onglets quand l'URL change (précédent, lien)
        <Tabs
          defaultActiveIndex={SECTIONS.findIndex(({ id }) => id === courante.id)}
          key={courante.id}
          onTabChange={(index) => setParams({ section: index === 0 ? null : SECTIONS[index].id })}
        >
          {SECTIONS.map((section) => (
            <Tab key={section.id} label={section.label}>
              {/* Seul l'onglet affiché est rendu : les autres ne lancent pas leurs requêtes */}
              {section.id === courante.id && (
                <>
                  <p className="fr-text-mention--grey fr-mb-3w">{section.question}</p>
                  <FinancementsProvider value={{ disciplines: disciplines.data, entiteNom, ercMeta: ercMeta.data, selection }}>
                    {Contenu ? <Contenu /> : (
                      <Notice closeMode="disallow" type="info">
                        Cet onglet est en préparation : les indicateurs de financement y seront ajoutés prochainement.
                      </Notice>
                    )}
                  </FinancementsProvider>
                </>
              )}
            </Tab>
          ))}
        </Tabs>
      )}
    </Container>
  );
}
