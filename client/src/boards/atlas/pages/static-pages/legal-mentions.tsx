import { 
  Breadcrumb,
  Container, Row, Col,
  Link,
  Title,
  Text,
} from "@dataesr/dsfr-plus";

export default function LegalMentions() {
  return (
    <Container as="main" id="main" className="fr-mt-2w">
      <Row>
        <Col>
        <Breadcrumb>
          <Link href="/atlas">Atlas des effectifs étudiant-e-s</Link>
          <Link>Mentions légales</Link>
        </Breadcrumb>
        </Col>
      </Row>
      <Row>
        <Col>
          <Title as="h2">Mentions légales</Title>
          <Title as="h3">Éditeur du site</Title>
          <Text>
            Ministère de l'Enseignement Supérieur, de la Recherche et de l'Espace<br />
            Direction générale de l'enseignement supérieur<br />
            Délégation au numérique et aux données (DENUM)<br />
            Département Ingénierie et science des données
            <br />
            <br />
            1 rue Descartes<br />
            75231 Paris cedex 05
          </Text>
          <Title as="h3">Hébergement</Title>
          <Text>
            OVH<br />
            RCS Roubaix – Tourcoing 424 761 419 00045<br />
            Code APE 6202A<br />
            N° TVA : FR 22 424 761 419<br />
            Siège social : 2 rue Kellermann - 59100 Roubaix - France.
          </Text>
          <Title as="h3">Conception et gestion du site</Title>
          <Text>
            Le suivi éditorial et graphique ainsi que la conception technique du site et son ergonomie sont exclusivement assurés par le département ingénierie et science des données du Ministère de l'Enseignement Supérieur, de la Recherche et de l'Espace.
          </Text>
          <Title as="h3">Gestionnaire des statistiques</Title>
          <Text>
            Le site utilise Matomo, un outil libre, paramétré pour effectuer un suivi statistique anonyme de l’utilisation de l’application. Il respecte les conditions d’exemption du consentement de l’internaute définies par la Commission nationale informatique et libertés (CNIL). Les données brutes anonymisées sont conservées 15 jours avant agrégation.
          </Text>
          <Title as="h3">Réutilisation des contenus et liens</Title>
          <Text>
            Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous <Link href="https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf" target="_blank">licence ouverte Etalab 2.0</Link>.
            <br />
            <br />
            Vous êtes notamment libres de les reproduire, copier, modifier, extraire, transformer, communiquer diffuser, redistribuer, publier, transmettre et exploiter sous réserve de mentionner leur source, leur date de dernière mise à jour et ne pas induire en erreur des tiers quant aux informations qui y figurent.
            <br />
            <br />
            Tout site public ou privé est autorisé à établir, sans autorisation préalable, un lien (y compris profond) vers les informations diffusées sur ce site.
          </Text>
          <Title as="h3">Clause de responsabilité</Title>
          <Text>
            Les informations proposées sur ce site le sont à titre de service rendu au public. Malgré tout le soin apporté au traitement des référentiels, à l'alignement et à l'inter-connexion des données présentées, les éléments mis en ligne sur le site des l'atlas des effectifs étudiants ne sauraient, de quelque manière que ce soit, prétendre à l’exactitude et engager la responsabilité du Ministère de l'Enseignement Supérieur, de la Recherche et de l'Espace.
            <br />
            <br />
            Les informations et/ou documents disponibles sur ce site sont susceptibles d’être modifiés à tout moment, et font l’objet de mises à jour régulières.
            <br />
            <br />
            Le Ministère de l'Enseignement Supérieur, de la Recherche et de l'Espace ne pourra en aucun cas être tenu responsable de tout dommage de quelque nature qu’il soit résultant de l’interprétation ou de l’utilisation des informations et/ou documents disponibles sur ce site.
          </Text>
          <Title as="h3">Accessibilité</Title>
            Le site de l'atlas des effectifs étudiants est développé selon les recommandations du Référentiel Général d'Amélioration de l'Accessibilité (RGAA). Nous nous sommes engagés à améliorer en permanence l’accessibilité de nos contenus pour que l’accès à l’information soit facilité.
            <br />
            <Link href="/atlas/accessibilite">En savoir plus sur l'accessibilité</Link>
        </Col>
      </Row>


    </Container>
  );
}