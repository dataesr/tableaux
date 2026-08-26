import { Header, Logo, Service } from "@dataesr/dsfr-plus";

export default function HeaderTableaux() {
  return (
    <Header>
      <Logo text={import.meta.env.VITE_MINISTER_NAME} />
      <Service name="Tableaux" tagline="Ensemble de tableaux de bord de l'enseignement supérieur, de la recherche et de l'espace" />
    </Header>
  );
}
