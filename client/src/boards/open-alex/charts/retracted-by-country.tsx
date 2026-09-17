import { useQuery } from '@tanstack/react-query';
import * as Highcharts from "highcharts";
import HighchartsReact from 'highcharts-react-official';

export default function RetractedByCountry() {
  const { data, isLoading } = useQuery({
    queryKey: ['OpenAlexRetractionsByCountry'],
    queryFn: () => fetch('https://api.openalex.org/works?page=1&filter=is_retracted:true&group_by=authorships.countries').then((response) => response.json())
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const series = (data?.group_by?.slice(0, 20) ?? []).map((country) => ({
    color: country.key.slice(-2) === 'FR' ? '#cc0000' : '#808080',
    name: country.key_display_name,
    y: country.count,
  }));
  const categories = series.map((country) => country.name);

  const options = {
    chart: { type: 'column' },
    legend: { enabled: false },
    plotOptions: { column: { dataLabels: { enabled: true } } },
    series: [{ data: series }],
    title: { text: 'Number of retracted publications by country (top 20)' },
    tooltip: { format: '<b>{point.y}</b> publications from <b>{point.name}</b> have been retracted' },
    xAxis: { categories, title: { text: 'Country' } },
    yAxis: { title: { text: 'Number of retracted publications' } }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}