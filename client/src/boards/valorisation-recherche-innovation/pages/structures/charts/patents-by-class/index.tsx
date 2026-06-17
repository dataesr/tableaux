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

export default function PatentsByClass({ name }: { name: string | undefined }) {
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
      by_class: {
        terms: {
          field: "cpc.classe.id_name.keyword",
          size: 15,
        },
        aggregations: {
          by_international: {
            terms: {
              field: "isInternational",
            },
          },
        },
      },
    },
  };

  const { data, isLoading } = useQuery({
    queryKey: ["valo-patents-by-class", structure, structureIds, yearMax, yearMin],
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

  const categories = (data?.aggregations?.by_class?.buckets ?? []).map((bucket) => bucket?.key.split('###')[1].charAt(0).toUpperCase() + bucket?.key.split('###')[1].slice(1).toLowerCase());
  const isInternational: Number[] = [];
  const isNotInternational: Number[] = [];
  (data?.aggregations?.by_class?.buckets ?? []).forEach((bucket) => {
    isInternational.push(bucket?.by_international?.buckets?.find((item) => item.key_as_string === 'true')?.doc_count ?? 0);
    isNotInternational.push(bucket?.by_international?.buckets?.find((item) => item.key_as_string === 'false')?.doc_count ?? 0);
  });
  const series = [{ color: 'green', data: isInternational, name: 'International' }, { color: 'blue', data: isNotInternational, name: 'Non international' }];
  const title = `Top 15 des classes de familles de brevets ${getYearRangeLabel({ yearMax, yearMin })}`;
  const tooltip = function (this: any) {
    return `<b>${this.y}</b> familles de brevets de statut ${this.series.name.toLowerCase()} et liées à l'établissement <b>${name}</b> ont été crées en classe <b>${categories[this.x]}</b>`;
  };

  const config = {
    comment: { "fr": <>Ce graphique indique, par classe, le nombre de brevets liées à l'établissement {name}.</> },
    id: "patentsByClass",
    integrationURL: `/integration?chart_id=patentsByClass&${searchParams.toString()}`,
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
      title: { text: "Classe" },
    },
    yAxis: {
      stackLabels: { enabled: true },
      title: { text: 'Nombre de familles de brevets' },
    },
  };

  const optionsLocal: HighchartsOptions = deepMerge(createChartOptions("bar", { chart: { height: "600px" } }), options);

  return (
    <div className={`chart-container chart-container--${color}`} id="patents-by-class">
      <Title as="h2" look="h6">
        {title}
      </Title>
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapper config={config} hideTitle options={optionsLocal} />}
    </div>
  );
}
