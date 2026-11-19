import { Button } from "@dataesr/dsfr-plus";

import { Layout } from "../../../../layout/layout";

export default function GlobalLayout() {
  return (
    <Layout
      extra={
        <Button
          as="a"
          href="https://data.enseignementsup-recherche.gouv.fr/explore/assets/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/"
          icon="code-s-slash-line"
          iconPosition="left"
          rel="noreferer noopener"
          target="_blank"
        >
          Jeu de données
        </Button>
      }
      serviceName="Atlas des effectifs étudiants"
      serviceTag=""
    />
  );
}
