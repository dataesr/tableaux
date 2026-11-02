import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useChartColor } from "../../../../../../hooks/useChartColor.tsx";

const { VITE_APP_SERVER_URL } = import.meta.env;

// Server-routed chart example: the browser calls only the board's own route.
// The route serves fixtures; the fixture items are { label, value } pairs.
// Copy this pattern; do not query /elasticsearch from the browser.
export default function FundedLabsExample() {
  const color = useChartColor();

  const { data, isLoading } = useQuery({
    queryKey: ["template-funded-labs-example"],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/template/overview/funded-labs`).then((response) =>
        response.json(),
      ),
  });
  if (isLoading || !data?.data) return <DefaultSkeleton />;

  const items: { label: string; value: number }[] = data.data;

  const config = {
    id: "fundedLabsExample",
    integrationURL: "/integration?chart_id=fundedLabsExample",
    title: "Top laboratoires par nombre de financements (données fictives)",
  };

  const options = {
    title: { text: "" },
    chart: { height: "400px", type: "bar" },
    legend: { enabled: false },
    exporting: { enabled: false },
    xAxis: {
      categories: items.map((item) => item.label),
      title: { text: "" },
    },
    yAxis: { title: { text: "Nombre de financements" } },
    tooltip: { format: "<b>{point.name}</b>: <b>{point.y}</b> financements" },
    series: [{ name: "Financements", data: items.map((item) => item.value) }],
    credits: { enabled: false },
  };

  return (
    <div className={`chart-container chart-container--${color}`} id="funded-labs-example">
      <ChartWrapper config={config} options={options} />
    </div>
  );
}
