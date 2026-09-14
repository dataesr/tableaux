function getGeneralOptions(title: any, categories: any, title_x_axis: any, title_y_axis: any) {
  return {
    title: { text: title },
    chart: { height: "600px", type: "bar" },
    legend: { enabled: false },
    exporting: { enabled: false },
    plotOptions: {
      column: {
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          format: "{point.y}",
        },
      },
    },
    xAxis: { categories, title: { text: title_x_axis } },
    yAxis: {
      title: { text: title_y_axis },
    },
    credits: {
      enabled: false,
    },
  };
}

function getSeries(data: { aggregations: { by_funder_type: { buckets: any; }; }; }) {
  const series = (data?.aggregations?.by_funder_type?.buckets ?? []).map(
    (item: {
      unique_projects: any; key: string; doc_count: number;
}) => ({
      color: "#cccccc",
      name: item.key,
      y: item.unique_projects.value,
    })
  );

  const categories = series.map((item: { name: any; }) => item.name);

  return { categories, series };
}

function getOptions(
  series: any,
  categories: any,
  title: string,
  format1: string,
  format2: string,
  title_x_axis: string,
  title_y_axis: string
) {
  const generalOptions = getGeneralOptions(
    title,
    categories,
    title_x_axis,
    title_y_axis
  );
  return {
    ...generalOptions,
    tooltip: {
      format: `<b>{point.name}</b> ${format1} <b>{point.y}</b> ${format2}`,
    },
    series: [{ data: series }],
  };
}

export {
  getSeries,
  getOptions,
};
