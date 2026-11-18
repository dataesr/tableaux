import { Layout } from "../../../../layout/layout";

export default function GlobalLayout() {
  return (
    <Layout
      extra={
        <a
          className="fr-btn fr-icon-code-s-slash-line fr-btn--icon-left"
          href="https://data.enseignementsup-recherche.gouv.fr/explore/assets/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/"
          rel="noreferer noopener"
          target="_blank"
        >
          Jeu de données
        </a>
      }
      serviceName="Atlas des effectifs étudiants"
      serviceTag=""
    />
  );
}
