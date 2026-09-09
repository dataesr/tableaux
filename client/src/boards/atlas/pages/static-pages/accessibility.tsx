import { 
  Breadcrumb,
  Container, Row, Col,
  Link,
  Title,
  Text,
} from "@dataesr/dsfr-plus";

export default function Accessibility() {
  return (
    <Container as="main" id="main" className="fr-mt-2w">
      <Row>
        <Col>
        <Breadcrumb>
          <Link href="/atlas">Atlas des effectifs étudiant-e-s</Link>
          <Link>Accessibilité</Link>
        </Breadcrumb>
        </Col>
      </Row>
      <Row>
        <Col>
          <Title as="h2">Accessibilité</Title>
          <Title as="h3">Déclaration de conformité</Title>
          <Text>
            Le Ministère de l'Enseignement Supérieur, de la Recherche et de l'Espace s’engage à rendre son site de l'« Atlas des effectifs étudiant-e-s » accessible conformément à l’article 47 de la loi n° 2005-102 du 11 février 2005. À cette fin, elle met en œuvre la stratégie et les actions suivantes : réalisation d'un audit de conformité en 2023.
            <br />
            <br />
            Cette déclaration d’accessibilité s’applique au site de l'« atlas des effectifs étudiant-e-s ».
          </Text>
          <Title as="h3">État de conformité</Title>
          <Text>
            Le site de l'« Atlas des effectifs étudiant-e-s » n’est pas encore conforme au RGAA.
            L'audit de conformité est en cours de réalisation.
          </Text>
          <Title as="h3">Résultats des tests</Title>
          <Text>
            Les tests de conformité sont en cours de réalisation.
          </Text>
          <Title as="h3">Retour d'information et contact</Title>
          <Text>
            Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable du site pour être orienté vers une alternative accessible ou obtenir le contenu sous une autre forme.
            <br />
            <br />
            Vous pouvez également signaler tout défaut d’accessibilité que vous rencontrez.
            <br />
            <br />
            <strong>Contacter le responsable du site</strong>
            {/* // TODO: Add contact form to ticket-office */}

          </Text>
          <Title as="h3">Voies de recours</Title>
          <Text>
            Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du site un défaut d’accessibilité qui vous empêche d’accéder à un contenu ou à un des services du portail et vous n’avez pas obtenu de réponse satisfaisante.
            <br />
            <br />
            Vous pouvez :
            <ul style={{ listStyleType: "disc" }}>
              <li>
                Joindre par téléphone un Défenseur des droits : 
                +33 (0) 9 69 39 00 00 du lundi au vendredi de 8h30 à 19h30 (coût d’un appel local)
                <br />
              </li>
              <li>Contacter le délégué du Défenseur des droits dans votre région. <Link href="https://www.defenseurdesdroits.fr/carte-des-delegues" target="_blank">Liste des délégués de votre région avec leurs informations de contact directs</Link></li>
              <li>Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) : Le Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07</li>
            </ul>
          </Text>
        </Col>
      </Row>
    </Container>
  );
}