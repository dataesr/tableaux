import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import ChartWrapper, { HighchartsOptions } from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx";
import { deepMerge } from "../../../../../../utils.tsx";
import { getEsQueryPublications, getYearRangeLabel } from "../../../../utils.ts";

const { VITE_APP_ES_INDEX_ORGANIZATIONS, VITE_APP_ES_INDEX_PUBLICATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function PublicationsByTopic({ name }: { name: string | undefined }) {
  const [searchParams] = useSearchParams();
  const structure = searchParams.get("structureId");
  const yearMax = searchParams.get("yearMax");
  const yearMin = searchParams.get("yearMin");
  const color = useChartColor();

  const { data: dataInfo } = useQuery({
    queryKey: ["valo-structure", structure],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`, {
        body: JSON.stringify({ size: 1, query: { bool: { filter: [{ term: { "id.keyword": structure } }] } } }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });
  const structureIds = dataInfo?.hits?.hits?.[0]?._source?.externalIds.map((item) => item.id) ?? [];

  const body = {
    ...getEsQueryPublications({ structureIds, yearMax, yearMin }),
    size: 0,
    aggregations: {
      by_topic: {
        terms: {
          field: "topics.field.display_name.keyword",
        },
        aggregations: {
          by_company: {
            terms: {
              field: "structured_acknowledgments.private_companies.entity.keyword",
            },
          },
        },
      },
    },
  };

  const { data, isLoading } = useQuery({
    queryKey: ["valo-publications-by-topic", structure, structureIds, yearMax, yearMin],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PUBLICATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });

  const categories = (data?.aggregations?.by_topic?.buckets ?? []).map((bucket) => bucket?.key);
  let companies = (data?.aggregations?.by_topic?.buckets ?? []).map((bucket) => bucket.by_company.buckets.map((bucket2) => bucket2.key));
  companies = [...new Set(companies.flat())]
  const d = {};
  companies.forEach((company) => {
    if (!Object.keys(d).includes((company))) {
      d[company] = [];
    }
    categories.forEach((category) => {
      d[company].push(data?.aggregations?.by_topic?.buckets?.find((item) => item.key === category)?.by_company?.buckets?.find((item) => item.key === company)?.doc_count ?? 0);
    });
  });
  const series = Object.keys(d).map((a) => ({ data: d[a], name: a }));
  const title = `Nombre de publications affiliées à la structure ${name} remerciant une société privée, par domaine thématique parues ${getYearRangeLabel({ yearMax, yearMin })}`;
  const tooltip = function (this: any) {
    return `<b>${this.y}</b> publications par la société <b>${this.series.name}</b> et liées à l'établissement <b>${name}</b> ont été crées en <b>${categories[this.x]}</b>`;
  };

  const config = {
    comment: { "fr": <>Ce graphique indique, par années de création, le nombre de familles de brevets liées à l'établissement {name}.</> },
    id: "publicationsByTopic",
    integrationURL: `/integration?chart_id=publicationsByTopic&${searchParams.toString()}`,
    title,
  };

  const options = {
    chart: { type: 'bar' },
    legend: { enabled: true },
    plotOptions: {
      bar: {
        dataLabels: { enabled: false },
        stacking: 'normal',
      },
    },
    series,
    title: { text: "" },
    tooltip: { formatter: tooltip },
    xAxis: {
      categories,
      title: { text: 'Domaine thématique' },
    },
    yAxis: {
      stackLabels: { enabled: true },
      title: { text: 'Nombre de publications' },
    },
  };

  const optionsLocal: HighchartsOptions = deepMerge(createChartOptions("bar", { chart: { height: "1000px" } }), options);

  return (
    <div className={`chart-container chart-container--${color}`} id="publications-by-topic">
      <Title as="h2" look="h6">
        {title}
      </Title>
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapper config={config} hideTitle options={optionsLocal} />}
    </div>
  );
}
