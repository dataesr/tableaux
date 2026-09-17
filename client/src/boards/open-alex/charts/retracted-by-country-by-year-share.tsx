import { useQueries, useQuery } from '@tanstack/react-query';
import * as Highcharts from "highcharts";
import HighchartsReact from 'highcharts-react-official';

export default function RetractedByCountryByYearShare() {
  const { data: data1, isLoading: isLoading1 } = useQuery({
    queryKey: ['OpenAlexRetractionsByCountry'],
    queryFn: () => fetch('https://api.openalex.org/works?page=1&filter=is_retracted:true&group_by=authorships.countries').then((response) => response.json())
  });

  const countries = (data1?.group_by?.slice(0, 20) ?? []).map((item) => ({ iso2: item.key.slice(-2), name: item.key_display_name }));
  const retractionsByCountryByYear:{data:{group_by:{count:number, key:string}[]}, isLoading:boolean}[] = useQueries({
    queries: countries.map((country:{iso2:string,name:string}, index:number) => {
      return {
        queryKey: ['OpenAlexRetractionsByCountryByYear', country.iso2],
        queryFn: () => fetch(`https://api.openalex.org/works?page=1&filter=is_retracted:true,institutions.country_code:${country.iso2},publication_year:2000-&group_by=publication_year`).then((response) => response.json()),
        retry: 3,
        retryDelay: (attempt) => index * attempt * 1000,
      }
    }),
  });
  const publicationsByCountryByYear:{data:{group_by:{count:number, key:string}[]}, isLoading:boolean}[] = useQueries({
    queries: countries.map((country:{iso2:string,name:string}, index:number) => {
      return {
        queryKey: ['OpenAlexPublicationsByCountryByYear', country.iso2],
        queryFn: () => fetch(`https://api.openalex.org/works?page=1&filter=institutions.country_code:${country.iso2},publication_year:2000-&group_by=publication_year`).then((response) => response.json()),
        retry: 3,
        retryDelay: (attempt) => index * attempt * 1000,
      }
    }),
  });

  if (isLoading1 || retractionsByCountryByYear.some((query:{isLoading:boolean}) => query.isLoading)) {
    return <div>Loading...</div>;
  }

  const years = [...Array(25).keys()].map((item) => item + 2000);

  const series:Array<object> = [];
  countries.map((country:{iso2:string, name:string}, indexCountry:number) => {
    series[country.iso2] = []
    const data:Array<number> = [];
    years.forEach((year:number) => {
      const retractionsCount = (retractionsByCountryByYear?.[indexCountry]?.data?.group_by ?? [])?.find((item) => item.key === year.toString())?.count ?? 0;
      const publicationsCount = (publicationsByCountryByYear?.[indexCountry]?.data?.group_by ?? [])?.find((item) => item.key === year.toString())?.count ?? 0;
      data.push(retractionsCount / publicationsCount * 10000);
    });
    series.push({ name: country.name, data });
  });

  const options = {
    legend: { align: 'right', layout: 'vertical', verticalAlign: 'middle' },
    plotOptions: { series: { label: { connectorAllowed: false } } },
    series,
    title: { text: 'Part of retracted publications by country by publication year in ‱ since 2000 (top 20)' },
    tooltip: { format: '<b>{point.y:.2f} ‱</b> of the publications from <b>{series.name}</b> have been retracted in <b>{key}</b>' },
    xAxis: { categories: years, title: { text: 'Publication year' } },
    yAxis: { title: { text: 'Part of retracted publications (‱)' } }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
}