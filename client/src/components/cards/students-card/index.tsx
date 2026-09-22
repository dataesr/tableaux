import { Badge, Col, Row, Title } from "@dataesr/dsfr-plus";

import "./styles.scss";

type CardProps = {
  descriptionNode?: React.JSX.Element;
  label?: string;
  number: number | string;
  tagsNode?: React.JSX.Element;
  to?: string;
  year?: string;
};


export default function StudentsCard({
  descriptionNode,
  label,
  number,
  tagsNode,
  to = "#",
  year,
}: CardProps) {
  return (
    <div className="fr-card fr-enlarge-link fr-card--horizontal students-card">
      <div className="fr-card__body">
        <div className="fr-card__content fr-pb-1w">
          <Row>
            <Col>
              {tagsNode && <div className="fr-card__start">{tagsNode}</div>}
            </Col>
            {year && (
              <Col md={2} style={{ textAlign: "right" }}>
                <Badge color="yellow-tournesol" size="sm">
                  {year}
                </Badge>
              </Col>
            )}
          </Row>
          <p className="fr-card__desc card-description">{descriptionNode}</p>
          <Title as="h3" className="fr-card__title">
            {to !== "#" ? (
              <a href={to} className="fr-card__link">
                <div className="key-number">
                  {number.toLocaleString("fr-FR")}
                </div>
                {label ? (
                  <div className="students-label">{label}</div>
                ) : (
                  <div className="students-label">
                    Etudiants
                    <br />
                    inscrits
                  </div>
                )}
              </a>
            ) : (
              <>
                <div className="key-number">
                  {number.toLocaleString("fr-FR")}
                </div>
                {label ? (
                  <div className="students-label">{label}</div>
                ) : (
                  <div className="students-label">
                    Etudiants
                    <br />
                    inscrits
                  </div>
                )}
              </>
            )}
          </Title>
        </div>
      </div>
    </div>
  );
}
