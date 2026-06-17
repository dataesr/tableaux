import { Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import ChartWrapper, { HighchartsOptions } from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx";
import { deepMerge } from "../../../../../../utils.tsx";
import { getEsQueryStartups, getYearRangeLabel } from "../../../../utils.ts";

const { VITE_APP_ES_INDEX_ORGANIZATIONS, VITE_APP_SERVER_URL } = import.meta.env;

export default function StartupsByIncubator({ name }: { name: string | undefined }) {
  const [searchParams] = useSearchParams();
  const structure = searchParams.get("structureId");
  const yearMax = searchParams.get("yearMax");
  const yearMin = searchParams.get("yearMin");
  const color = useChartColor();

  const body = {
    ...getEsQueryStartups({ structures: [structure], yearMax, yearMin }),
    aggregations: {
      by_incubator: {
        terms: {
          field: "incubateurs.denormalized.encoded_key.keyword",
          size: 20,
        },
        aggregations: {
          by_status: {
            terms: {
              field: "status.keyword",
            },
          },
        },
      },
    },
  };

  const { data, isLoading } = useQuery({
    queryKey: ["valo-startups-by-incubator", structure, yearMax, yearMin],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_ORGANIZATIONS}`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        method: "POST",
      }).then((response) => response.json()),
  });

  const categories = (data?.aggregations?.by_incubator?.buckets ?? []).map((bucket) => Object.fromEntries(new URLSearchParams(bucket.key)).label);
  const actives: Number[] = [];
  const notActives: Number[] = [];
  (data?.aggregations?.by_incubator?.buckets ?? []).forEach((bucket) => {
    actives.push(bucket?.by_status?.buckets?.find((item) => item.key === 'active')?.doc_count ?? 0);
    notActives.push(bucket?.by_status?.buckets?.find((item) => item.key === 'old')?.doc_count ?? 0);
  });
  const series = [{ color: 'green', data: actives, name: 'Actives' }, { color: 'blue', data: notActives, name: 'Non actives' }];
  const title = `Nombre de start-ups par incubateur ${getYearRangeLabel({ yearMax, yearMin })}`;
  const tooltip = function (this: any) {
    return `<b>${this.y}</b> start-ups de statut ${this.series.name.toLowerCase()} et liées à l'établissement <b>${name}</b> sont dans l'incubateur <b>${categories[this.x]}</b>`;
  };

  const config = {
    comment: { "fr": <>Ce graphique indique, par incubateur, le nombre de start-ups liées à l'établissement {name}.</> },
    id: "startupsByIncubator",
    integrationURL: `/integration?chart_id=startupsByIncubator&${searchParams.toString()}`,
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
      title: { text: "Incubateur" },
    },
    yAxis: {
      stackLabels: { enabled: true },
      title: { text: 'Nombre de start-ups' },
    },
  };

  const optionsLocal: HighchartsOptions = deepMerge(createChartOptions("bar", { chart: { height: "600px" } }), options);

  return (
    <div className={`chart-container chart-container--${color}`} id="startups-by-incubator">
      <Title as="h2" look="h6">
        {title}
      </Title>
      {isLoading ? <DefaultSkeleton height="600px" /> : <ChartWrapper config={config} hideTitle options={optionsLocal} />}
    </div>
  );
}
