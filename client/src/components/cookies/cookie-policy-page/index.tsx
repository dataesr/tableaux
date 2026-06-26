import { Button, ButtonGroup, Col, Container, Link, Modal, ModalContent, ModalTitle, Row, Text, Title } from "@dataesr/dsfr-plus";
import { useState } from "react";

import { useCookieConsent } from "../../../hooks/useCookieConsent";
import HeaderDatasupR from "../../../layout/header";
import { getI18nLabel } from "../../../utils";
import Footer from "../../footer";
import i18n from "../cookie-consent/i18n.json";
import { CookieConsentModalContent } from "../cookie-consent/index";

export default function CookiePolicyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { resetConsent, consent, acceptAll, refuseAll, savePreferences } = useCookieConsent();

  const handleOpenPreferences = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAcceptAllFromModal = () => {
    acceptAll();
    setIsModalOpen(false);
  };

  const handleRefuseAllFromModal = () => {
    refuseAll();
    setIsModalOpen(false);
  };

  const handleSavePreferences = (preferences: Parameters<typeof savePreferences>[0]) => {
    savePreferences(preferences);
    setIsModalOpen(false);
  };

  const handleResetConsent = () => {
    if (confirm(getI18nLabel(i18n, "page.resetConsent.confirm"))) {
      resetConsent();
    }
  };

  return (
    <>
      <HeaderDatasupR />
      <Container>
        <Row>
          <Col>
            <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
              <button className="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-1">
                Voir le fil d'Ariane
              </button>
              <div className="fr-collapse" id="breadcrumb-1">
                <ol className="fr-breadcrumb__list">
                  <li>
                    <a className="fr-breadcrumb__link" href="/">
                      Accueil
                    </a>
                  </li>
                  <li>
                    <a className="fr-breadcrumb__link" aria-current="page">
                      {getI18nLabel(i18n, "page.title")}
                    </a>
                  </li>
                </ol>
              </div>
            </nav>

            <Title as="h1">{getI18nLabel(i18n, "page.title")}</Title>
            <Text size="lead">{getI18nLabel(i18n, "page.introduction")}</Text>

            <Title as="h2" look="h3">
              {getI18nLabel(i18n, "page.whatAreCookies.title")}
            </Title>
            <Text>{getI18nLabel(i18n, "page.whatAreCookies.content")}</Text>

            <Title as="h2" look="h3">
              {getI18nLabel(i18n, "page.cookieTypes.title")}
            </Title>

            <div className="fr-accordion">
              <h3 className="fr-accordion__title">
                <button className="fr-accordion__btn" aria-expanded="false" aria-controls="accordion-necessary">
                  {getI18nLabel(i18n, "categories.necessary.title")}
                </button>
              </h3>
              <div className="fr-collapse" id="accordion-necessary">
                <div className="fr-accordion__body">
                  <p>{getI18nLabel(i18n, "categories.necessary.description")}</p>
                  <p>
                    <strong>Exemples :</strong>
                  </p>
                  <ul>
                    <li>Cookies de session pour maintenir votre connexion</li>
                    <li>Cookies de sécurité pour prévenir les attaques</li>
                    <li>Cookies de préférences linguistiques</li>
                  </ul>
                  <p>
                    <strong>Durée de conservation :</strong> Session ou selon la fonctionnalité
                  </p>
                </div>
              </div>
            </div>

            <div className="fr-accordion">
              <h3 className="fr-accordion__title">
                <button className="fr-accordion__btn" aria-expanded="false" aria-controls="accordion-functional">
                  {getI18nLabel(i18n, "categories.functional.title")}
                </button>
              </h3>
              <div className="fr-collapse" id="accordion-functional">
                <div className="fr-accordion__body">
                  <p>{getI18nLabel(i18n, "categories.functional.description")}</p>
                  <p>
                    <strong>Exemples :</strong>
                  </p>
                  <ul>
                    <li>
                      <code>Favoris géographques de l'altlas des effectifs étudiants</code> : Sauvegarde vos favorie afin de pouvoir les récupérer lors de votre prochaine viste
                    </li>
                  </ul>
                  <p>
                    <strong>Durée de conservation :</strong> 30 jours
                  </p>
                </div>
              </div>
            </div>

            <div className="fr-accordion">
              <h3 className="fr-accordion__title">
                <button className="fr-accordion__btn" aria-expanded="false" aria-controls="accordion-analytics">
                  {getI18nLabel(i18n, "categories.analytics.title")}
                </button>
              </h3>
              <div className="fr-collapse" id="accordion-analytics">
                <div className="fr-accordion__body">
                  <p>{getI18nLabel(i18n, "categories.analytics.description")}</p>
                  <p>
                    <strong>Note :</strong> Les cookies analytiques ne sont pas encore implémentés sur ce site, mais cette catégorie est prévue pour de futurs outils d'analyse d'audience anonymisés.
                  </p>
                  <p>
                    <strong>Durée de conservation prévue :</strong> 13 mois maximum
                  </p>
                </div>
              </div>
            </div>

            <Title as="h3" look="h4" className="fr-mt-4w">
              {getI18nLabel(i18n, "page.managePreferences.title")}
            </Title>
            <Text>{getI18nLabel(i18n, "page.managePreferences.content")}</Text>
            <ButtonGroup>
              <Button onClick={handleOpenPreferences}>{getI18nLabel(i18n, "page.managePreferences.button")}</Button>
              <Button variant="secondary" onClick={handleResetConsent}>
                {getI18nLabel(i18n, "page.resetConsent.button")}
              </Button>
            </ButtonGroup>

            <Title as="h2" look="h3">
              Vos droits
            </Title>
            <Text>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</Text>
            <ul>
              <li>
                <strong>Droit d'accès :</strong> Vous pouvez demander quelles données personnelles nous détenons sur vous
              </li>
              <li>
                <strong>Droit de rectification :</strong> Vous pouvez demander la correction de données inexactes
              </li>
              <li>
                <strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données
              </li>
              <li>
                <strong>Droit d'opposition :</strong> Vous pouvez vous opposer à l'utilisation de certains cookies
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> Vous pouvez récupérer vos données dans un format structuré
              </li>
            </ul>

            <Title as="h2" look="h3" className="fr-mt-4w">
              {getI18nLabel(i18n, "page.contact.title")}
            </Title>
            <Text>{getI18nLabel(i18n, "page.contact.content")}</Text>
            <div className="fr-highlight">
              <p>
                <strong>Contact :</strong>
              </p>
              <p>
                Ministère de l'Enseignement supérieur, de la Recherche et de l'Espace
                <br />
                <Link href="/contact" target="_blank">
                  Nous contacter
                </Link>
              </p>
            </div>

            <Text size="sm">
              <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString("fr-FR")}
            </Text>
          </Col>
        </Row>

        <Modal isOpen={isModalOpen} hide={handleCloseModal} size="lg">
          <ModalTitle>{getI18nLabel(i18n, "modal.title")}</ModalTitle>
          <ModalContent>
            <CookieConsentModalContent onAcceptAll={handleAcceptAllFromModal} onRefuseAll={handleRefuseAllFromModal} onSavePreferences={handleSavePreferences} consent={consent} />
          </ModalContent>
        </Modal>
      </Container>
      <Footer />
    </>
  );
}
