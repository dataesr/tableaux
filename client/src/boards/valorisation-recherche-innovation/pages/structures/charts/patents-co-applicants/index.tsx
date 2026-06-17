import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import ChartWrapper, { HighchartsOptions } from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx";
import { deepMerge } from "../../../../../../utils.tsx";
import { getEsQueryPatents, getYearRangeLabel } from "../../../../utils.ts";

const { VITE_APP_ES_INDEX_ORGANIZATIONS, VITE_APP_ES_INDEX_PATENTS, VITE_APP_SERVER_URL } = import.meta.env;

export default function PatentsCoApplicants({ name }: { name: string | undefined }) {
  const [searchParams] = useSearchParams();
  const structure = searchParams.get("structureId");
  const yearMax = searchParams.get("yearMax");
  const yearMin = searchParams.get("yearMin");
  const color = useChartColor();

  const { data: dataInfo } = useQuery({
    queryKey: ["valo-structure", structure],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`, {
        body: JSON.stringify({ size: 1, query: { bool: { filter: [ { term: { "id.keyword": structure } } ] } } }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });
  const structureIds = dataInfo?.hits?.hits?.[0]?._source?.externalIds.map((item) => item.id) ?? [];

  const body = {
    ...getEsQueryPatents({ structureIds, yearMax, yearMin }),
    aggregations: {
      by_co_applicants: {
        terms: {
          field: "applicants.id_name.keyword",
          size: 16,
        },
        aggregations: {
          by_class: {
            terms: {
              field: "cpc.classe.id_name.keyword",
            },
          },
        },
      },
    },
  };

  const { data, isLoading } = useQuery({
    queryKey: ["valo-patents-co-applicants", structure, structureIds, yearMax, yearMin],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PATENTS}`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });

  const filteredData = (data?.aggregations?.by_co_applicants?.buckets ?? []).filter((item) => !structureIds.includes(item.key.split('###')[0]));
  const categories = filteredData.map((bucket) => `${bucket?.key?.split('###')[1]} (${bucket?.key?.split('###')[2]})`);
  const series = [{ data: filteredData.map((item) => item.doc_count) }];
  const title = `Top 15 des co-déposants de brevets de l'établissement ${name} ${getYearRangeLabel({ yearMax, yearMin })}`;
  const tooltip = function (this: any) {
    return `<b>${this.y}</b> familles de brevets ont été déposées conjointement entre les établissements <b>${name}</b> et ${categories[this.x]}</b>`;
  };

  const config = {
    comment: { "fr": <>Ce graphique indique, par classe, les co-déposants de l'établissement {name}.</> },
    id: "patentsCoApplicants",
    integrationURL: `/integration?chart_id=patentsCoApplicants&${searchParams.toString()}`,
    title,
  };

  const options = {
    chart: { type: 'bar' },
    legend: { enabled: false },
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
      title: { text: "Co-déposant" },
    },
    yAxis: {
      stackLabels: { enabled: true },
      title: { text: 'Nombre de familles de brevets' },
    },
  };

  const optionsLocal: HighchartsOptions = deepMerge(createChartOptions("bar", { chart: { height: "600px" } }), options);

  return (
    <div className={`chart-container chart-container--${color}`} id="patents-co-applicants">
      <Title as="h2" look="h6">
        {title}
      </Title>
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapper config={config} hideTitle options={optionsLocal} />}
    </div>
  );
}
