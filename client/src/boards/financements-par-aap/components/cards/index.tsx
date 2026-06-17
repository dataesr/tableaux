import { Col, Row, Text, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { formatCompactNumber, funders, getCssColor, getEsQuery, getYearRangeLabel, years } from "../../utils.ts";
import ChartCard from "../chart-card";

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env;


export default function Cards() {
  const [searchParams] = useSearchParams()
  const region = searchParams.get("region")
  const structure = searchParams.get("structureId")
  const yearMax = searchParams.get("yearMax")
  const yearMin = searchParams.get("yearMin")

  const body = {
    ...getEsQuery({ regions: [region], structures: [structure] }),
    aggregations: {
      by_project_type: {
        terms: {
          field: "project_type.keyword",
          size: 50,
        },
        aggregations: {
          by_project_year: {
            terms: {
              field: "project_year",
              size: 25,
            },
            aggregations: {
              by_unique_project: {
                cardinality: {
                  field: "project_id.keyword",
                },
              },
              should_ignore_budget: {
                terms: {
                  field: structure ? "participant_ignore_total_budget" : "region_ignore_total_budget",
                  missing: 0,
                },
                aggregations: {
                  sum_budget: {
                    sum: {
                      field: "project_budgetFinanced",
                    },
                  },
                },
              },
              should_ignore_funding: {
                terms: {
                  field: structure ? "participant_ignore_funding" : "region_ignore_funding",
                  missing: 0,
                },
                aggregations: {
                  sum_funding: {
                    sum: {
                      field: "participation_funding",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const { data, isLoading } = useQuery({
    queryKey: ["funding-cards", structure, region],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then((response) => response.json()),
  });

  const dataFunders = {};
  funders.forEach((funder) => {
    const dataByFunder = (data?.aggregations?.by_project_type?.buckets ?? []).find((bucket) => bucket.key === funder);
    dataFunders[funder] = {
      budget: years.map((year) => ({
        x: year,
        y: dataByFunder?.by_project_year?.buckets?.find((bucket) => bucket.key === year)?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0,
        yDisplay: dataByFunder?.by_project_year?.buckets?.find((bucket) => bucket.key === year)?.should_ignore_budget?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_budget?.value ?? 0,
      })),
      funding: years.map((year) => ({
        x: year,
        y: dataByFunder?.by_project_year?.buckets?.find((bucket) => bucket.key === year)?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0,
        yDisplay: dataByFunder?.by_project_year?.buckets?.find((bucket) => bucket.key === year)?.should_ignore_funding?.buckets?.find((bucket) => bucket.key.toString() === '0')?.sum_funding?.value ?? 0,
      })),
      projects: years.map((year) => ({
        x: year,
        y: dataByFunder?.by_project_year?.buckets?.find((bucket) => bucket.key === year)?.by_unique_project?.value ?? 0,
        yDisplay: dataByFunder?.by_project_year?.buckets.find((bucket) => bucket.key === year)?.by_unique_project?.value ?? 0,
      })),
    };
  });

  const maxBudget: number = Math.max.apply(null, Object.values(dataFunders).map((dataFunder: any) => dataFunder.budget.map((budget) => budget.y)).flat());
  const maxFunding: number = Math.max.apply(null, Object.values(dataFunders).map((dataFunder: any) => dataFunder.funding.map((funding) => funding.y)).flat());
  const maxProjects: number = Math.max.apply(null, Object.values(dataFunders).map((dataFunder: any) => dataFunder.projects.map((project) => project.y)).flat());

  return (
    <>
      <Row gutters style={{ clear: "both" }}>
        <Col xs="12" md="2" />
        {Object.keys(dataFunders).map((funder) => (
          <Col xs="12" md="2" key={`header-${funder}`}>
            <Text
              size="sm"
              bold
              className="fr-mb-0"
              style={{
                color: getCssColor({ name: funder, prefix: "funder" }),
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {funder}
              <span aria-hidden="true" style={{ display: "block", fontSize: "0.75rem", opacity: 0.5 }}>▼</span>
            </Text>
          </Col>
        ))}
      </Row>
      <Row gutters>
        <Col xs="12" md="2" key={`card-projects-intro`}>
          <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Title as="h2" className="fr-mb-0" style={{ fontSize: "0.8rem", letterSpacing: "0.3px", lineHeight: 1.3, textTransform: "uppercase" }}>
              Nombre de projets financés auxquels {structure ? "l'établissement" : "la région"} participe
              <span aria-hidden="true" style={{ display: "inline-block", marginLeft: "0.5rem", opacity: 0.4 }}>→</span>
            </Title>
          </div>
        </Col>
        {Object.keys(dataFunders).map((funder) => (
          <Col xs="12" md="2" key={`card-projects-${funder}`}>
            {isLoading ? <DefaultSkeleton height="250px" /> :
              <ChartCard
                color={getCssColor({ name: funder, prefix: "funder" })}
                data={dataFunders[funder].projects}
                detail={getYearRangeLabel({ yearMax, yearMin })}
                title={`Projets ${funder}`}
                titleAs="h3"
                tooltipFormatter={function (this: any) {
                  return `${this.y} ${this.y > 1 ? "projets" : "projet"} ${funder} en ${this.key}`;
                }}
                value={`${dataFunders[funder].projects.filter((project) => yearMin && yearMax && project.x >= yearMin && project.x <= yearMax).reduce((acc, cur) => acc + cur.yDisplay, 0)} projet${dataFunders[funder].projects.filter((project) => yearMin && yearMax && project.x >= yearMin && project.x <= yearMax).reduce((acc, cur) => acc + cur.yDisplay, 0) > 1 ? 's' : ''}`}
                yAxisMax={maxProjects}
              />
            }
          </Col>
        ))}
      </Row>
      <Row gutters>
        <Col xs="12" md="2" key={`card-budget-intro`}>
          <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Title as="h2" className="fr-mb-0" style={{ fontSize: "0.8rem", letterSpacing: "0.3px", lineHeight: 1.3, textTransform: "uppercase" }}>
              Financements globaux des projets auxquels {structure ? "l'établissement" : "la région"} participe
              <span aria-hidden="true" style={{ display: "inline-block", marginLeft: "0.5rem", opacity: 0.4 }}>→</span>
            </Title>
          </div>
        </Col>
        {Object.keys(dataFunders).map((funder) => (
          <Col xs="12" md="2" key={`card-budget-${funder}`}>
            {isLoading ? <DefaultSkeleton height="250px" /> :
              <ChartCard
                color={getCssColor({ name: funder, prefix: "funder" })}
                data={dataFunders[funder].budget}
                detail={getYearRangeLabel({ yearMax, yearMin })}
                title={`Financement global des projets ${funder}`}
                titleAs="h3"
                tooltipFormatter={function (this: any) { return `${formatCompactNumber(this.y)} € par ${funder} en ${this.key}` }}
                value={`${formatCompactNumber(dataFunders[funder].budget.filter((budget) => yearMin && yearMax && budget.x >= yearMin && budget.x <= yearMax).reduce((acc, cur) => acc + cur.yDisplay, 0))} €`}
                yAxisMax={maxBudget}
              />
            }
          </Col>
        ))}
      </Row>
      <Row gutters>
        <Col xs="12" md="2" key={`card-funding-intro`}>
          <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Title as="h2" className="fr-mb-0" style={{ fontSize: "0.8rem", letterSpacing: "0.3px", lineHeight: 1.3, textTransform: "uppercase" }}>
              Financements perçus pour les projets auxquels {structure ? "l'établissement" : "la région"} participe
              <span aria-hidden="true" style={{ display: "inline-block", marginLeft: "0.5rem", opacity: 0.4 }}>→</span>
            </Title>
          </div>
        </Col>
        {Object.keys(dataFunders).map((funder) => (
          <Col xs="12" md="2" key={`card-funding-${funder}`}>
            {isLoading ? <DefaultSkeleton height="250px" /> :
              <ChartCard
                color={getCssColor({ name: funder, prefix: "funder" })}
                data={dataFunders[funder].funding}
                detail={getYearRangeLabel({ yearMax, yearMin })}
                title={`Financements perçus des projets ${funder}`}
                titleAs="h3"
                tooltipFormatter={function (this: any) { return `${formatCompactNumber(this.y)} € par ${funder} en ${this.key}` }}
                value={`${formatCompactNumber(dataFunders[funder].funding.filter((funding) => yearMin && yearMax && funding.x >= yearMin && funding.x <= yearMax).reduce((acc, cur) => acc + cur.yDisplay, 0))} €`}
                yAxisMax={maxFunding}
              />
            }
          </Col>
        ))}
      </Row>
    </>
  )
}
