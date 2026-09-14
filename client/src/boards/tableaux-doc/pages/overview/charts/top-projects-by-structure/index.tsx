import { Col, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx";
import { getOptions, getSeries } from "./utils.tsx";

const { VITE_APP_SERVER_URL } = import.meta.env;


export default function TopProjectsByStructure() {
  const [selectedStructure, setSelectedStructure] = useState<string>("180089013");
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
              participant_isFrench: true
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
          },
          {
            term: {
              "participant_id.keyword": selectedStructure
            }
          }
        ]
      }
    },
    aggs: {
      unique_projects: {
        cardinality: {
          field: "project_id.keyword"
        }
      }
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: [`fundings-top-projects-by-structure`, selectedStructure, selectedYearEnd, selectedYearStart],
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
    id: "topProjectsByStructure",
    integrationURL: "/integration?chart_id=topProjectsByStructure",
    title: `Principaux projets pour ${selectedStructure} sur la période ${selectedYearStart}-${selectedYearEnd}`,
  };

  const options: object = getOptions(
    series,
    categories,
    '',
    'a financé',
    `projet(s) auquel(s) prend part ${selectedStructure} sur la période ${selectedYearStart}-${selectedYearEnd}`,
    '',
    'Nombre de projets financés',
  );

  const structures = [
    { name: "Centre national de la recherche scientifique", id: "180089013" },
    { name: "Université de Montpellier", id: "130029796" }
  ]
  const years = Array.from(Array(25).keys()).map((item) => item + 2000);

  return (
    <div className={`chart-container chart-container--${color}`} id="top-funders-by-structure">
      <Row gutters className="form-row">
        <Col md={12}>
          <select
            name="fundings-structure"
            id="fundings-structure"
            className="fr-mb-2w fr-select"
            value={selectedStructure}
            onChange={(e) => setSelectedStructure(e.target.value)}
          >
            <option disabled value="">
              Sélectionnez une structure
            </option>
            {structures.map((structure) => (
              <option key={structure.id} value={structure.id}>
                {structure.name}
              </option>
            ))}
          </select>
        </Col>
      </Row>
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
