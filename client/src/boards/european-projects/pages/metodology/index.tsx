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
        Le périmètre des données retenues pour l'analyse
      </Title>
      <Text>
        <ul>
          <li>
            <strong>Projets évalués</strong>
            <br />
            Ensemble des propositions déposées et évaluées, hors propositions inadmissibles, inéligibles, retirées ou sans information sur leur état d’évaluation.
          </li>
          <li>
            <strong>Projets lauréats</strong>
            <br />
            Ensemble des projets lauréats, hors projets rejetés lors de la négociation. Sont pris en compte les projets signés, suspendus, terminés, clôturés et en cours de négociation.
          </li>
          <li>
            <strong>Programmes</strong>
            <br />
            Le programme EURATOM n'est pas intégré aux données eCorda pour Horizon Europe (2021-2027). Il est donc exclu des calculs pour les PCRI précédents.
            <br />
            Pour les évolutions, l'analyse couvre l'ensemble des PCRI depuis le FP6 (2002-2006). Pour le FP6 sont uniquement disponibles les projets lauréats.
          </li>
        </ul>
      </Text>

      <Title as="h2" look="h4">
        Les 4 indicateurs de base
      </Title>
      <Text>
        Chaque indicateur peut être mesuré à deux stades : sur les{' '}
        <strong>projets évalués</strong> (ce qui a été demandé) et sur les{' '}
        <strong>projets lauréats</strong> (ce qui a été obtenu).
      </Text>
      <Text>
        <ul>
          <li>
            <strong>Nombre de projets</strong>
            <br />
            Un projet est soit un projet lauréat, soit une proposition évaluée (dite projet évalué).
            Pour un pays, on compte les projets (ou propositions) dans lesquels au moins une de ses entités participe 
            (trois institutions françaises dans un même projet = un seul projet pour la France).
          </li>
          <li>
            <strong>Nombre de participants (ou candidats)</strong>
            <br />
            Une participation est enregistrée pour chaque candidature formelle d'une organisation disposant de la personnalité juridique.
            <br />
            Pour un pays, on compte le nombre d’entités indépendantes qui participent à un projet donné 
            (trois institutions françaises dans un même projet = trois participations pour la France).
          </li>
          <li>
            <strong>Nombre de projets coordonnés (ou coordinations)</strong>
            <br />
            Dans la plupart des projets du PCRI, les candidats constituent un consortium composé d’un coordinateur, interlocuteur privilégié de la Commission 
            (en particulier pendant la négociation, puis tout au long du projet), et de participants. 
            Si le projet est coordonné par une institution française, la France compte une coordination. 
            <br />
            Sont exclus du décompte des coordinations de projets individuels : ERC, Postdoctoral Fellowships (Marie Skłodowska-Curie), EIC Accelerator et projets portés par l’association COST et GEANT.
          </li>
          <li>
            <strong>Financements demandés ou obtenus</strong>
            <br />
            Chaque participant déclare le coût total qu’il doit assumer dans un projet et sollicite une aide de l’Union européenne.
            C’est ce montant, demandé (projets évalués) ou obtenu (projets lauréats), qui est repris dans les analyses. 
            <br />
            Un financement obtenu correspond au financement alloué par la Commission européenne pour une participation à un projet donné. 
            Il s'agit d'un engagement, et non de sommes effectivement versées.
          </li>
        </ul>
      </Text>

      <Title as="h2" look="h4">
        Des indicateurs de base aux indicateurs dérivés
      </Title>
      <Text>
        Tous les autres indicateurs du site sont calculés à partir de ces quatre mesures.
      </Text>
      <Text>
        <ul>
          <li>
            <strong>Parts</strong>
            <br />
            Une part rapporte la valeur d’un pays à celle d’un ensemble de référence (l'ensemble des pays, par exemple),
            pour chacun des quatre indicateurs, au stade évalué comme au stade lauréat.
            <br />
            <em>
              Part des financements obtenus par la France = financements obtenus par la France ÷ ensemble des
              financements obtenus tous pays confondus
            </em>
          </li>
          <li>
            <strong>Taux de succès</strong>
            <br />
            Un taux de succès compare ce qui a été obtenu à ce qui a été évalué, pour chacun des quatre indicateurs.
            <br />
            <em>Taux de succès en projets = projets lauréats ÷ projets évalués</em>
            <br />
            <em>Taux de succès en financements = financements obtenus ÷ financements demandés</em>
          </li>
          <li>
            <strong>Collaborations</strong>
            <br />
            Les collaborations se déduisent des projets et des participations : deux pays collaborent lorsqu’ils figurent dans
            un même projet. Le nombre de projets en commun mesure l’intensité de la collaboration, et la répartition des 
            coordinations au sein des consortiums en précise la nature.
          </li>
        </ul>
      </Text>


      <Title as="h2" look="h4">
        Entités européennes et internationales
      </Title>
      <Text>
        Le repérage des entités européennes et internationales permet de proposer deux visions de la participation des acteurs
        au programme-cadre : une vision proche de celle de la Commission européenne, qui les conserve dans le calcul des
        indicateurs, ou une vision plus nationale, qui les exclut.
        <br />
          Ces entités sont repérées manuellement. La liste n’est pas exhaustive et peut évoluer en fonction des échanges entre les services.
        <br />
        <br />
        Les entités européennes et internationales comprennent :
        <ul style={{ listStyle: "inherit", paddingLeft: "1.2rem" }}>
          <li>les organisations internationales</li>
          <li>les organisation intergouvernementales</li>
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
