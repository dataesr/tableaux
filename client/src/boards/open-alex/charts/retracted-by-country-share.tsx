import { useQuery } from '@tanstack/react-query';
import * as Highcharts from "highcharts";
import HighchartsReact from 'highcharts-react-official';

export default function RetractedByCountryShare() {
  const { data: data1, isLoading: isLoading1 } = useQuery({
    queryKey: ['OpenAlexRetractionsByCountry'],
    queryFn: () => fetch('https://api.openalex.org/works?page=1&filter=is_retracted:true&group_by=authorships.countries').then((response) => response.json())
  });

  const { data: data2, isLoading: isLoading2 } = useQuery({
    queryKey: ['OpenAlexPublicationsByCountry'],
    queryFn: () => fetch('https://api.openalex.org/works?page=1&group_by=authorships.countries').then((response) => response.json())
  });

  if (isLoading1 || isLoading2) {
    return <div>Loading...</div>;
  }

  const series = (data1?.group_by?.slice(0, 20) ?? []).map((country) => {
    const total = data2.group_by.find((item) => item.key === country.key).count;
    return ({
      color: country.key.slice(-2) === 'FR' ? '#cc0000' : '#808080',
      name: country.key_display_name,
      total,
      y: country.count / total * 10000,
    })
  }).sort((a, b) => b.y - a.y);
  const categories = series.map((country) => country.name);

  const options = {
    chart: { type: 'column' },
    legend: { enabled: false },
    plotOptions: { column: { dataLabels: { enabled: true, format: '{y:.2f} ‱' } } },
    series: [{ data: series }],
    title: { text: 'Part of retracted publications by country in ‱ (top 20)' },
    tooltip: { format: '<b>{point.y:.2f} ‱</b> of the publications from <b>{point.name}</b> have been retracted' },
    xAxis: { categories, title: { text: 'Country' } },
    yAxis: { title: { text: 'Part of retracted publications (‱)' } }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}