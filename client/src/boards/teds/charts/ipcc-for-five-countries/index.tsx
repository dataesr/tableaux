import { useSearchParams } from "react-router-dom";

import { useQueryResponse } from "../hooks";
import { getLabel } from "../utils";
import useQuery from "./query";
import Template from "./template";
import { getOptions } from "./utils";
import ChartWrapper from "../../../../components/chart-wrapper";

export default function Ipcc5countries() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "FR";

  const { filter_ipcc, filters } = useQuery(currentLang);

  const countries = ["USA", "GBR", "DEU", "FRA", "CHN"];

  // request the data from elasticsearch for each filter (ex: wg1, wg1 & wg2, etc...)
  const responses = [
    useQueryResponse(filters[0].body, 50, filters[0].name),
    useQueryResponse(filters[1].body, 50, filters[1].name),
    useQueryResponse(filters[2].body, 50, filters[2].name),
    useQueryResponse(filters[3].body, 50, filters[3].name),
    useQueryResponse(filters[4].body, 50, filters[4].name),
    useQueryResponse(filters[5].body, 50, filters[5].name),
    useQueryResponse(filters[6].body, 50, filters[6].name),
  ];

  //request without any filter (all ipcc publications)
  const response_total = useQueryResponse(
    filter_ipcc.body,
    50,
    filter_ipcc.name
  );

  // tests all responses if loaded
  if (
    responses.map((response) => response.isLoading).some((item) => item) ||
    response_total.isLoading
  ) {
    return Template();
  }

  // filter on countries for the five countries ('FR', 'US', 'UK', 'DE', 'CN')
  const buckets = responses.map((response) =>
    response.data.aggregations?.by_countries?.buckets?.filter((country) =>
      countries.includes(country.key)
    )
  );

  // count number of publications for each country and for each filter
  const values: { name: string; data: number[] }[] = [];
  filters.map((filter, index) => {
    values.push({
      name: filter.name,
      data: [
        buckets[index]?.find((country) => country.key === countries[0])
          .doc_count,
        buckets[index]?.find((country) => country.key === countries[1])
          .doc_count,
        buckets[index]?.find((country) => country.key === countries[2])
          .doc_count,
        buckets[index]?.find((country) => country.key === countries[3])
          .doc_count,
        buckets[index]?.find((country) => country.key === countries[4])
          .doc_count,
      ],
    });
  });

  values.push({
    name: "Multi WG",
    data: countries.map(
      (item) =>
        response_total.data?.aggregations?.by_countries.buckets?.find(
          (country) => country.key === item
        ).doc_count -
        responses
          .map(
            (response) =>
              response?.data?.aggregations?.by_countries?.buckets?.find(
                (country) => country.key === item
              ).doc_count
          )
          .reduce((accumulator, currentValue) => accumulator + currentValue)
    ),
  });

  const title = getLabel("ipcc_five_countries", "title", currentLang);

  const options = getOptions(
    values,
    countries,
    title,
    getLabel("ipcc_five_countries", "title_x_axis", currentLang),
    getLabel("ipcc_five_countries", "title_y_axis", currentLang)
  );
  const chartConfig = {
    id: "ipcc_five_countries",
    title: {
      fr: title,
      en: title,
    },
  };

  return (
    <ChartWrapper
      config={chartConfig}
      options={options}
    />
  );
}
