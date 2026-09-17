import { useQuery } from '@tanstack/react-query';
import * as Highcharts from "highcharts";
import HighchartsReact from 'highcharts-react-official';

export default function RetractedFrenchByYearShare() {
  const { data: data1, isLoading: isLoading1 } = useQuery({
    queryKey: ['OpenAlexFrenchRetractions'],
    queryFn: () => fetch('https://api.openalex.org/works?page=1&filter=is_retracted:true,institutions.country_code:FR,publication_year:2000-&group_by=publication_year').then((response) => response.json())
  });

  const { data: data2, isLoading: isLoading2 } = useQuery({
    queryKey: ['OpenAlexFrenchPublications'],
    queryFn: () => fetch('https://api.openalex.org/works?page=1&filter=institutions.country_code:FR,publication_year:2000-&group_by=publication_year').then((response) => response.json())
  });

  if (isLoading1 || isLoading2) {
    return <div>Loading...</div>;
  }

  const series = (data1?.group_by?.sort((a, b) => a.key - b.key) ?? []).map((item) => {
    const total = data2.group_by.find((item) => item.key === item.key).count;
    return ({
      color: '#808080',
      name: item.key_display_name,
      total,
      y: item.count / total * 10000,
    });
  });
  const categories = series.map((item) => item.name);

  const options = {
    chart: { type: 'column' },
    legend: { enabled: false },
    plotOptions: { column: { dataLabels: { enabled: true, format: '{y:.2f} ‱' } } },
    series: [{ data: series }],
    title: { text: 'Part of French retracted publications by publication year in ‱ since 2000' },
    tooltip: { format: '<b>{point.y:.2f} ‱</b> of the French publications have been retracted in <b>{point.name}</b>' },
    xAxis: { categories, title: { text: 'Publication year' } },
    yAxis: { title: { text: 'Part of retracted publications (‱)' } }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}