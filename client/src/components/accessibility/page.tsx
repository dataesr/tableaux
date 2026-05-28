import { Breadcrumb, Container, Link, Text, Title } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

import AuditComponent from "./audit-component";
import Callout from "../callout";

const i18n = {
  home: {
    fr: "Accueil",
    en: "Home",
  },
  title: {
    fr: "Accessibilité",
    en: "Accessibility",
  },
  callout: {
    fr: "Nous nous engageons à rendre notre site web accessible à tous les utilisateurs, y compris ceux ayant des besoins spécifiques en matière d'accessibilité. Nous avons mis en place des mesures pour garantir que notre contenu est utilisable par tous, conformément aux normes d'accessibilité du Web.",
    en: "We are committed to making our website accessible to all users, including those with specific accessibility needs. We have implemented measures to ensure that our content is usable by everyone, in accordance with web accessibility standards.",
  },
  "engagement-title": {
    fr: "Engagement d'accessibilité numérique",
    en: "Digital Accessibility Commitment",
  },
  "engagement-text": {
    fr: (
      <>
        {" "}
        Le Ministère de l'Enseignement supérieur, de la Recherche et de l'Espace s’engage à rendre accessibles ses sites web conformément à l’
        <Link href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037388867" target="_blank">
          {" "}
          article 47 de la loi n°2005-102 du 11 février 2005.
        </Link>
      </>
    ),
    en: (
      <>
        The Ministry of Higher Education, Research and Space is committed to making its websites accessible in accordance with Article 47 of Law No. 2005-102 of February 11, 2005.
        <Link href="https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000037388867" target="_blank">
          {" "}
          Read more about the law here.
        </Link>
      </>
    ),
  },
  "feedback-title": {
    fr: "Retour d'information et contact",
    en: "Feedback and Contact",
  },
  "feedback-text": {
    fr: (
      <>
        Si vous rencontrez des problèmes d'accessibilité sur notre site ou si vous avez des suggestions pour l'améliorer, n'hésitez pas à nous contacter en suivant le lien ci-dessous :
        <br />
        <Link href="/contact">Contactez-nous</Link>
      </>
    ),
    en: (
      <>
        If you encounter accessibility issues on our site or have suggestions for improvement, please feel free to contact us using the link below:
        <br />
        <Link href="/contact">Contact Us</Link>
      </>
    ),
  },
  "recourse-title": {
    fr: "Voies de recours",
    en: "Recourse Options",
  },
  "recourse-text": {
    fr: (
      <>
        Cette procédure est à utiliser dans le cas suivant : vous avez signalé au responsable du site internet un défaut d’accessibilité qui vous empêche d’accéder à un contenu ou à un des services du portail et vous n’avez pas obtenu de réponse
        satisfaisante.
        <ul>
          <li>
            Écrire un message au{" "}
            <Link href="https://formulaire.defenseurdesdroits.fr/" target="_blank">
              Défenseur des droits
            </Link>
          </li>
          <li>
            Contacter le{" "}
            <Link href="https://www.defenseurdesdroits.fr/saisir/delegues" target="_blank">
              délégué du Défenseur des droits
            </Link>{" "}
            dans votre région
          </li>
          <li>Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) à Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07</li>
        </ul>
      </>
    ),
    en: (
      <>
        This procedure should be used in the following case: you have reported an accessibility issue to the website administrator that prevents you from accessing content or services on the portal and you have not received a satisfactory response.
        <ul>
          <li>
            Write a message to the{" "}
            <Link href="https://formulaire.defenseurdesdroits.fr/" target="_blank">
              Defender of Rights
            </Link>
          </li>
          <li>
            Contact the{" "}
            <Link href="https://www.defenseurdesdroits.fr/saisir/delegues" target="_blank">
              Defender of Rights delegate
            </Link>{" "}
            in your region
          </li>
          <li>Send a letter by mail (free, do not put a stamp) to Defender of Rights, Libre réponse 71120, 75342 Paris CEDEX 07</li>
        </ul>
      </>
    ),
  },
};

export default function AccessibilityPage() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const from = searchParams.get("from") || "general";

  return (
    <Container as="main" className="fr-py-8w" role="main">
      <Breadcrumb>
        <Link href="/">{i18n.home[currentLang]}</Link>
        <Link>{i18n.title[currentLang]}</Link>
      </Breadcrumb>
      <Title>{i18n.title[currentLang]}</Title>
      <Callout>{i18n.callout[currentLang]}</Callout>
      <Title as="h2">{i18n["engagement-title"][currentLang]}</Title>
      <Text>{i18n["engagement-text"][currentLang]}</Text>
      <AuditComponent idSite={`tableaux_${from}`} />
      <Title as="h2">{i18n["feedback-title"][currentLang]}</Title>
      <Text>{i18n["feedback-text"][currentLang]}</Text>
      <Title as="h2">{i18n["recourse-title"][currentLang]}</Title>
      <Text>{i18n["recourse-text"][currentLang]}</Text>
    </Container>
  );
}
