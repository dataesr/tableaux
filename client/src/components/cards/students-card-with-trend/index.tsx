import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

import "./styles.scss";

type CardProps = {
  descriptionNode?: JSX.Element;
  label?: string;
  number: number | string;
  tagsNode?: JSX.Element;
  to?: string;
  trendGraph: JSX.Element;
};


export default function StudentsCardWithTrend({
  descriptionNode,
  label,
  number,
  tagsNode,
  to,
  trendGraph = <>trendGraph</>,
}: CardProps) {
  return (
    <div className="fr-card fr-enlarge-link fr-card--horizontal student-card-with-trend">
      <div className="fr-card__body">
        <div className="fr-card__content fr-pb-1w">
          <Container fluid>
            <Row>
              <Col>
                {to ? (
                  <Title as="h2" look="h3" className="fr-card__title">
                    <a href={to} className="fr-card__link">
                      {label ? (
                        <div className="students-label">{label}</div>
                      ) : (
                        <div className="students-label">
                          Etudiants
                          <br />
                          inscrits
                        </div>
                      )}
                      <div className="key-number">{number.toLocaleString("fr-FR")}</div>
                    </a>
                  </Title>
                ) : (
                  <Title as="h2" look="h3" className="fr-card__title">
                    {label ? (
                      <div className="students-label">{label}</div>
                    ) : (
                      <div className="students-label">
                        Etudiants
                        <br />
                        inscrits
                      </div>
                    )}
                    <div className="key-number">{number.toLocaleString("fr-FR")}</div>
                  </Title>
                )}
              </Col>
              <Col style={{ height: "80px" }}>{trendGraph}</Col>
            </Row>
          </Container>

          <div className="fr-card__desc card-description">{descriptionNode}</div>
          {tagsNode && <div className="fr-card__start">{tagsNode}</div>}
        </div>
      </div>
    </div>
  );
}
