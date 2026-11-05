import { useSearchParams } from "react-router-dom";

import { Layout as AppLayout } from "../../../../layout/layout";

export function Layout({ languageSelector = false }) {
  const [searchParams] = useSearchParams();
  const isEnglish = searchParams.get("language")?.toLowerCase() === "en";

  return (
    <AppLayout
      extra={
        <a
          className="fr-btn fr-icon-code-s-slash-line fr-btn--icon-left"
          href="https://data.enseignementsup-recherche.gouv.fr/explore/assets/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/"
          rel="noreferer noopener"
          target="_blank"
        >
          {isEnglish ? "Dataset" : "Jeu de données"}
        </a>
      }
      languageSelector={languageSelector}
      serviceName="Atlas des effectifs étudiants"
    />
  );
}
