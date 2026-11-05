import { Col, Row, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { CONTINENT_NAMES, getContinentFromCountryCode } from "../../../../../../utils/continents";
import { getDonutOptions } from "./options";
import { CollaborationData, getCollaborations } from "./query";
import { useGetParams } from "./utils";

import "./styles.scss";

export default function CollaborationsByContinent() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery({
    queryKey: ["CollaborationsByContinent", params],
    queryFn: () => getCollaborations(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  // Agréger les données par continent
  const continentData = data.reduce((acc: Record<string, { collaborations: number }>, item: CollaborationData) => {
    const continent = getContinentFromCountryCode(item.country_code);
    if (!acc[continent]) {
      acc[continent] = { collaborations: 0 };
    }
    acc[continent].collaborations += item.total_collaborations;
    return acc;
  }, {});

  // Convertir en format pour le chart
  const chartData = Object.entries(continentData)
    .map(([continent, values]) => ({
      name: CONTINENT_NAMES[continent]?.[currentLang] || continent,
      y: values.collaborations,
      continentKey: continent,
    }))
    .sort((a, b) => b.y - a.y);

  const title = "Collaborations";

  const chartTitle = currentLang === "fr" ? "Répartition par continent" : "Distribution by continent";

  return (
    <div>
      <Row className="fr-mt-4w collaborations-by-continent__header">
        <Col>
          <Title as="h3" look="h6" className="fr-mb-0">
            {chartTitle}
          </Title>
        </Col>
      </Row>
      <ChartWrapper config={{ id: "CollaborationsByContinent" }} options={getDonutOptions(chartData, title)} />
      <div className="collaborations-by-continent__legend">
        <ul className="collaborations-by-continent__legend-list">
          {chartData.map((item) => (
            <li key={item.name} className="collaborations-by-continent__legend-item">
              <span>{item.name}</span>
              <span className="collaborations-by-continent__legend-value">
                {item.y.toLocaleString(currentLang)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
