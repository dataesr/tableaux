import { useSearchParams } from "react-router-dom";

import { useQueryResponse } from "../hooks";
import { getLabel } from "../utils";
import bool from "./query";
import Template from "./template";
import { getOptions, getSeries } from "./utils";
import ChartWrapper from "../../../../components/chart-wrapper";

export default function IpbesAll() {
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useQueryResponse(bool, 20, "ipbes");
  const currentLang = searchParams.get("language") || "FR";

  if (isLoading || !data) return Template();

  const { series, categories } = getSeries(data);
  const title = getLabel("ipbes_all", "title", currentLang);

  const options = getOptions(
    series,
    categories,
    title,
    getLabel("ipbes_all", "format1", currentLang),
    getLabel("ipbes_all", "format2", currentLang),
    getLabel("ipbes_all", "title_x_axis", currentLang),
    getLabel("ipbes_all", "title_y_axis", currentLang)
  );

  const chartConfig = {
    id: "ipbes_all",
    title: {
      fr: title,
      en: title,
    },
  };
  return <ChartWrapper config={chartConfig} options={options} />;
}
