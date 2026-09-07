import { useSearchParams } from "react-router-dom";
import { Container, Row, Col, Title, Text, Link } from "@dataesr/dsfr-plus";
import i18n from "./i18n.json";
import "./styles.scss";

export default function LegalNoticePage() {
  const [searchParams] = useSearchParams();
  const lang = (searchParams.get("language") || "fr") as "fr" | "en";
  const t = (key: keyof typeof i18n) => i18n[key][lang] ?? i18n[key].fr;

  return (
    <div className="legal-notice-page">
      <section className="legal-notice-hero">
        <Container>
          <p className="legal-notice-hero__label">{t("heroLabel")}</p>
          <Title as="h1" look="h1" className="legal-notice-hero__title">
            {t("heroTitle")}
          </Title>
          <p className="legal-notice-hero__description">{t("heroDescription")}</p>
        </Container>
      </section>

      <Container as="main" id="main" className="legal-notice-content fr-mt-5w">
        <Row>
          <Col md="10" lg="8">
            <section className="legal-notice-section">
              <Title as="h2" look="h4">
                {t("editorTitle")}
              </Title>
              <Text>
                {t("editorOrg")}
                <br />
                {t("editorMinistry")}
                <br />
                {t("editorAddress")}
              </Text>
            </section>

            <section className="legal-notice-section">
              <Title as="h2" look="h4">
                {t("publisherTitle")}
              </Title>
              <Text>{t("publisherBody")}</Text>
            </section>

            <section className="legal-notice-section">
              <Title as="h2" look="h4">
                {t("ipTitle")}
              </Title>
              <Text>{t("ipBody")}</Text>
            </section>

            <section className="legal-notice-section">
              <Title as="h2" look="h4">
                {t("dataTitle")}
              </Title>
              <Text>
                {t("dataBody")}
                <Link href="/cookies">{t("dataLink")}</Link>
                {t("dataBodyAfter")}
              </Text>
            </section>

            <section className="legal-notice-section">
              <Title as="h2" look="h4">
                {t("a11yTitle")}
              </Title>
              <Text>
                {t("a11yBody")}
                <Link href="/accessibility">{t("a11yLink")}</Link>
                {t("a11yBodyAfter")}
              </Text>
            </section>

            <section className="legal-notice-section">
              <Title as="h2" look="h4">
                {t("contactTitle")}
              </Title>
              <Text>
                {t("contactBody")}
                <Link href="/contact">{t("contactLink")}</Link>
                {t("contactBodyAfter")}
              </Text>
            </section>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
