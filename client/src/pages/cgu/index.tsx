import { useSearchParams } from "react-router-dom";
import { Container, Row, Col, Title, Text, Link } from "@dataesr/dsfr-plus";
import i18n from "./i18n.json";
import "./styles.scss";

export default function CGUPage() {
  const [searchParams] = useSearchParams();
  const lang = (searchParams.get("language") || "fr") as "fr" | "en";
  const t = (key: keyof typeof i18n) => i18n[key][lang] ?? i18n[key].fr;

  return (
    <div className="cgu-page">
      <section className="cgu-hero">
        <Container>
          <p className="cgu-hero__label">{t("heroLabel")}</p>
          <Title as="h1" look="h1" className="cgu-hero__title">
            {t("heroTitle")}
          </Title>
          <p className="cgu-hero__description">{t("heroDescription")}</p>
        </Container>
      </section>

      <Container as="main" id="main" className="cgu-content fr-mt-5w">
        <Row>
          <Col md="10" lg="8">
            <section className="cgu-section">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cumque repellendus molestiae qui, modi quia eaque nulla ad a, vitae odio distinctio amet aperiam eius exercitationem similique tempore, asperiores dolores illo.
            </section>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
