import { Col, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx";
import { getOptions, getSeries } from "./utils.tsx";

const { VITE_APP_SERVER_URL } = import.meta.env;


export default function FundedStructuresEurope() {
  const [selectedYearEnd, setSelectedYearEnd] = useState<string>("2024");
  const [selectedYearStart, setSelectedYearStart] = useState<string>("2022");
  const color = useChartColor();

  const body = {
    size: 0,
    query: {
      bool: {
        filter: [
          {
            range: {
              project_year: {
                gte: selectedYearStart,
                lte: selectedYearEnd
              }
            }
          },
          {
            term: {
              participant_isFrench: false
            }
          },
          {
            term: {
              participant_status: "active"
            }
          },
          {
            term: {
              participant_type: "institution"
            }
          }
        ]
      }
    },
    aggs: {
      by_participant: {
        terms: {
          field: "participant_id_name.keyword",
          size: 25
        }
      }
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: [`fundings-funded-structures-europe`, selectedYearEnd, selectedYearStart],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=scanr-participations`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });
  if (isLoading || !data) return <DefaultSkeleton />;
  const { categories, series } = getSeries(data);

  const config = {
    id: "fundedStructuresEurope",
    integrationURL: "/integration?chart_id=fundedStructuresEurope",
    title: `Top 25 des structures NON françaises par nombre de financements sur la période ${selectedYearStart}-${selectedYearEnd}`,
  };

  const options: object = getOptions(
    series,
    categories,
    '',
    'a obtenu',
    `financements sur la période ${selectedYearStart}-${selectedYearEnd}`,
    '',
    'Nombre de projets financés',
  );

  const years = Array.from(Array(25).keys()).map((item) => item + 2000);

  return (
    <div className={`chart-container chart-container--${color}`} id="funded-structures">
      <Row gutters className="form-row">
        <Col md={6}>
          <select
            name="fundings-year-start"
            id="fundings-year-start"
            className="fr-mb-2w fr-select"
            value={selectedYearStart}
            onChange={(e) => setSelectedYearStart(e.target.value)}
          >
            <option disabled value="">
              Sélectionnez une année de début
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Col>
        <Col md={6}>
          <select
            name="fundings-year-end"
            id="fundings-year-end"
            className="fr-mb-2w fr-select"
            value={selectedYearEnd}
            onChange={(e) => setSelectedYearEnd(e.target.value)}
          >
            <option disabled value="">
              Sélectionnez une année de fin
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Col>
      </Row>
      <ChartWrapper config={config} options={options} />
    </div>
  );
}
