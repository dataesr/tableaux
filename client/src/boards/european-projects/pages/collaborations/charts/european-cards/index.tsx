import { Badge, Col, Row, Text } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { isAnEuropeanUnionCountry } from "../../../../../../utils/countries";
import { CollaborationData, getEuropeanCollaborations } from "./query";
import { useGetParams } from "./utils";

import "../../../../../../components/charts-skeletons/styles.scss";
import "./styles.scss";

export default function EuropeanCards() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();

  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery<CollaborationData[]>({
    queryKey: ["getEuropeanCollaborations", params],
    queryFn: () => getEuropeanCollaborations(params),
  });

  // Filter data to only include EU countries and sort by collaborations
  const euData =
    data?.filter((item) => isAnEuropeanUnionCountry(item.country_code)).sort((a, b) => b.total_collaborations - a.total_collaborations) || [];

  // Calculate totals
  const totalCollaborations = euData.reduce((acc, item) => acc + item.total_collaborations, 0);
  const totalCountries = euData.length;
  const top5Countries = euData.slice(0, 5);

  // Calculate average collaborations per country
  const avgCollaborations = totalCountries > 0 ? Math.round(totalCollaborations / totalCountries) : 0;

  if (isLoading) {
    return (
      <Row gutters>
        <Col xs={12}>
          <div className="default-skeleton european-cards__skeleton" />
        </Col>
        {[1, 2, 3].map((i) => (
          <Col key={i} xs={12} md={4}>
            <div className="default-skeleton european-cards__skeleton--card" />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutters>
      {/* Reading key */}
      <Col xs={12}>
        <div className="fr-card european-cards__reading-key">
          <div className="fr-card__body">
            <div className="fr-card__content">
              <span className="fr-icon-information-fill european-cards__reading-key-icon" aria-hidden="true" />
              <div>
                <Text size="sm" className="fr-mb-0">
                  {currentLang === "fr"
                    ? "Ces données représentent les collaborations entre le pays sélectionné et les autres pays de l'Union Européenne dans le cadre des projets européens. Une collaboration est comptabilisée lorsqu'au moins deux entités de pays différents participent au même projet. Les chiffres affichés correspondent au nombre de projets communs avec chaque pays partenaire."
                    : "This data represents collaborations between the selected country and other European Union countries within European projects. A collaboration is counted when at least two entities from different countries participate in the same project. The figures displayed correspond to the number of joint projects with each partner country."}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Col>

      {/* Total collaborations */}
      <Col xs={12} md={4}>
        <div className="fr-card european-cards__stat-card">
          <div className="fr-card__body">
            <div className="fr-card__content">
              <div className="european-cards__stat-header">
                <span className="fr-icon-team-fill european-cards__stat-icon" aria-hidden="true" />
                <Text size="sm" className="fr-mb-0 european-cards__text-grey">
                  {currentLang === "fr" ? "Collaborations UE" : "EU Collaborations"}
                </Text>
              </div>
              <div className="european-cards__stat-number">{totalCollaborations.toLocaleString(currentLang)}</div>
              <Text size="xs" className="fr-mt-1w fr-mb-0 european-cards__text-grey">
                {currentLang === "fr"
                  ? `Moyenne : ${avgCollaborations.toLocaleString(currentLang)} par pays`
                  : `Average: ${avgCollaborations.toLocaleString(currentLang)} per country`}
              </Text>
            </div>
          </div>
        </div>
      </Col>

      {/* Countries count */}
      <Col xs={12} md={4}>
        <div className="fr-card european-cards__stat-card">
          <div className="fr-card__body">
            <div className="fr-card__content">
              <div className="european-cards__stat-header">
                <span className="fr-icon-earth-fill european-cards__stat-icon" aria-hidden="true" />
                <Text size="sm" className="fr-mb-0 european-cards__text-grey">
                  {currentLang === "fr" ? "Pays partenaires" : "Partner countries"}
                </Text>
              </div>
              <div className="european-cards__stat-number">{totalCountries}</div>
              <Text size="xs" className="fr-mt-1w fr-mb-0 european-cards__text-grey">
                {currentLang === "fr" ? "sur 27 pays de l'UE" : "out of 27 EU countries"}
              </Text>
            </div>
          </div>
        </div>
      </Col>

      {/* Top 5 partners */}
      <Col xs={12} md={4}>
        <div className="fr-card european-cards__stat-card">
          <div className="fr-card__body">
            <div className="fr-card__content">
              <div className="european-cards__stat-header european-cards__stat-header--top5">
                <span className="fr-icon-trophy-fill european-cards__stat-icon" aria-hidden="true" />
                <Text size="sm" className="fr-mb-0 european-cards__text-grey">
                  {currentLang === "fr" ? "Top 5 partenaires" : "Top 5 partners"}
                </Text>
              </div>
              <div className="european-cards__top5-list">
                {top5Countries.map((country, index) => (
                  <div key={country.country_code} className="european-cards__top5-item">
                    <div className="european-cards__top5-item-left">
                      <Badge
                        size="sm"
                        color={
                          index === 0 ? "yellow-tournesol" : index === 1 ? "beige-gris-galet" : index === 2 ? "orange-terre-battue" : "blue-ecume"
                        }
                      >
                        {index + 1}
                      </Badge>
                      <Text size="sm" className="fr-mb-0" bold={index === 0}>
                        {currentLang === "fr" ? country.country_name_fr : country.country_name_en}
                      </Text>
                    </div>
                    <Text size="sm" className="fr-mb-0 european-cards__text-grey">
                      {country.total_collaborations.toLocaleString(currentLang)}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}
