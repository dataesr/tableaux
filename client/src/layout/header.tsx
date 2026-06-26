import { Button, Header, Logo, Service, FastAccess } from "@dataesr/dsfr-plus";

export default function HeaderTableaux() {
  return (
    <Header>
      <Logo text={import.meta.env.VITE_MINISTER_NAME} />
      <Service name="Tableaux" tagline="Ensemble de tableaux de bord de l'enseignement supérieur, de la recherche et de l'espace" />
      <FastAccess>
        <Button as="a" href="https://github.com/dataesr/react-dsfr" target="_blank" rel="noreferer noopener" icon="github-fill" size="sm" variant="text">
          Github
        </Button>
      </FastAccess>
    </Header>
  );
}
