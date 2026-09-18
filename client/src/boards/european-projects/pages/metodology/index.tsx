import { Container, Title, Text } from "@dataesr/dsfr-plus";
import Breadcrumb from "../../../../components/breadcrumb";
import navigationConfig from "../../navigation-config.json";

export default function Methodology() {
  return (
    <Container as="main">
      <Breadcrumb config={navigationConfig} />

      <Title as="h1" look="h3">
        Informations
      </Title>
      <Title as="h2" look="h4">
        Périmètre des données sélectionées
      </Title>
      <Text>
        <ul>
          <li>
            <strong>Projets évalués</strong>
            <br />
            Les projets évalués sont toutes les propositions déposées et évaluées hors propositions inadmissibles, inéligibles, rétitées, ou sans information de leur état d'évaluation.
          </li>
          <li>
            <strong>Projets lauréats</strong>
            <br />
            Les projets lauréats sont tous les projets retenus sauf les projets rejetés lors de la négociation. Cette synthèse prend en compte les projets signés, suspendus, terminés, clôturés et en cours de négociation.
          </li>
          <li>
            <strong>Programmes</strong>
            <br />
            Le programme EURATOM n'est pas intégré aux SI Corda pour le PCRI actuel (2021-2027). Il est donc exclus es indicateurs pour les PCRI précédents.
          </li>
        </ul>
      </Text>

      <Title as="h2" look="h4">
        Indicateurs
      </Title>
      <Text>
        <ul>
          <li>
            <strong>Nombre de projets (ou projets)</strong>
            <br />
            Un projet correspond à un contrat signé entre un consortium de partenaires et la Commission. Le décompte du nombre de projets par pays correspond au nombre de projets dans lequel au moins une entité du pays participe (par exemple : si
            trois institutions françaises participent à un projet, alors on compte un seul projet pour la France).
          </li>
          <li>
            <strong>Nombre de participants (ou candidats) dans les projets</strong>
            <br />
            Une participation est enregistrée pour chaque candidature formelle d'une organisation disposant de la personnalité juridique.
            <br />
            Le décompte du nombre de participations d'un pays dans un projet donné correspond au nombre d'entités indépendantes de ce pays participant à un projet donné (par exemple : si trois institutions françaises participent à un projet, alors la
            France compte trois participants dans le projet).
          </li>
          <li>
            <strong>Nombre de projets coordonnés (ou coordinations)</strong>
            <br />
            Dans la plupart des projets du PCRI, les candidats sont invités à constituer des consortiums composés d'un coordinateur, interlocuteur privilégié de la commission (en particulier durant la phase de négociation et plus généralement tout au
            long de la vie du projet) et de participants. <br />
            Participation du pays dans un projet donné en tant que coordinateur : Si le projet est coordonné par une institution française, la France compte un projet coordonné.
            <br />
            Sont exclus du décompte des coordinations de projets individuels (les ERC sauf SyG, les projets Postdoctoral Fellowships (Maris-Curie), les projets EIC Accelerator et les projets portés par l'association COST).
          </li>
          <li>
            <strong>Subvention obtenue dans les projets (ou subventions demandées ou obtenues)</strong>
            <br />
            Chaque participant déclare le coût total qu'il doit assumer dans un projet proposé et sollicite un financement de la part de l'Union Européenne. C'est ce dernier qui est repris dans ce document d'analyse.
            <br />
            Subvention allouée par la commission européenne pour le financement d'une participation dans un projet donné.
          </li>
        </ul>
      </Text>

      <Title as="h2" look="h4">
        Entités européennes et internationales
      </Title>
      <Text>
        Le repérage des entité européennes et internationales permet de proposer deux visions de la participation des acteurs au programme-cadre. Une vision proche de celle de la CE en les conservant dans le calcul des indicateurs ou une vision plus
        nationale en les excluant.
        <br />
        Ces entités sont repérés manuellement. La liste n'est pas exhaustive et peut évoluer en fonction des échanges entre les services.
        <br />
        <br />
        Les entités européennes et internationales comprennent :
        <ul style={{ listStyle: "inherit", paddingLeft: "1.2rem" }}>
          <li>les organisations internationales (OIE)</li>
          <li>les organisation intergouvernementales (OIG)</li>
          <li>les agences liées à la CE</li>
          <li>les structures communes comme le CERN, l'ESA</li>
          <li>les réseaux EIT, GEANT ou COST</li>
        </ul>
        La liste complète des entités identifiées est disponible ci-dessous
        <br />
        ...
        {/* TODO: list of entities */}
      </Text>
    </Container>
  );
}
