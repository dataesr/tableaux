import { useSearchParams } from "react-router-dom";
import { Container, Row, Col, Title, Text, Link } from "@dataesr/dsfr-plus";
import i18n from "./i18n.json";
import "./styles.scss";

export default function PersonalDataPage() {
  const [searchParams] = useSearchParams();
  const lang = (searchParams.get("language") || "fr") as "fr" | "en";
  const t = (key: keyof typeof i18n) => i18n[key][lang] ?? i18n[key].fr;

  return (
    <div className="personal-data-page">
      <section className="personal-data-hero">
        <Container>
          <p className="personal-data-hero__label">{t("heroLabel")}</p>
          <Title as="h1" look="h1" className="personal-data-hero__title">
            {t("heroTitle")}
          </Title>
          <p className="personal-data-hero__description">
            {t("heroDescription")}
          </p>
        </Container>
      </section>

      <Container as="main" id="main" className="personal-data-content fr-mt-5w">
        <Row>
          <Col md="10" lg="8">
            <section className="personal-data-section">
              <Title as="h2" look="h4">
                {t("controllerTitle")}
              </Title>
              <Text>
                {t("controllerOrg")}
                <br />
                {t("controllerAddress")}
              </Text>
            </section>

            <section className="personal-data-section">
              <Title as="h2" look="h4">
                {t("purposeTitle")}
              </Title>
              <Text>{t("purposeBody")}</Text>
            </section>

            <section className="personal-data-section">
              <Title as="h2" look="h4">
                {t("collectedTitle")}
              </Title>
              <Text>{t("collectedBody")}</Text>
            </section>

            <section className="personal-data-section">
              <Title as="h2" look="h4">
                {t("legalBasisTitle")}
              </Title>
              <Text>{t("legalBasisBody")}</Text>
            </section>

            <section className="personal-data-section">
              <Title as="h2" look="h4">
                {t("rightsTitle")}
              </Title>
              <Text>
                {t("rightsBody")}
                <Link href="/contact">{t("rightsLink")}</Link>
                {t("rightsBodyAfter")}
              </Text>
            </section>

            <section className="personal-data-section">
              <Title as="h2" look="h4">
                {t("cookiesTitle")}
              </Title>
              <Text>
                {t("cookiesBody")}
                <Link href="/cookies">{t("cookiesLink")}</Link>
                {t("cookiesBodyAfter")}
              </Text>
            </section>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
