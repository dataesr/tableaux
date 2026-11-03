import { Container, Title } from "@dataesr/dsfr-plus";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";

const { VITE_APP_SERVER_URL } = import.meta.env;


export default function FinancementsPage() {
  const [options, setOptions] = useState({})
  const [searchParams] = useSearchParams()
  // Établissement (identifiant ROR), voir plugins/tableaux/reference/url-parameters.md
  const rorId = searchParams.get("ror_id")

  const { data, isLoading } = useQuery({
    queryKey: ["suivi-recherche", "financements"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/suivi-recherche/financements?ror_id=${rorId}`).then((response) => response.json()),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data) {
      const types = [...new Set(data.map((d) => d.type))]
      const YEAR_MAX = 2025
      const YEAR_MIN = 2010
      const years = [...Array(YEAR_MAX - YEAR_MIN + 1).keys()].map((year) => year + YEAR_MIN)
      const series = types.map((type) => ({
        name: type,
        data: years.map((year) => data.find((d) => d.type === type && d.year === year)?.count ?? 0)
      }))
      const options = {
        series,
        xAxis: { categories: years },
        yAxis: { title: "Nombre de projets" },
      }
      setOptions(options)
    }
  }, [data])

  const config = {
    id: "suivi-recherche-bibliometrie-evolution",
    title: { fr: `Évolution annuelle des parts mondiales`, look: "h5" as const },
    // comment: {
    //   fr: (
    //     <>
    //       Ceci est un commentaire en français
    //     </>
    //   ),
    // },
  };

  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Financements</Title>
      <p className="fr-text--lead">
        Suivi par financements de projets (ERC, ANR PIA).
      </p>
      {isLoading
        ? <DefaultSkeleton height="200px" label="Chargement des données" />
        : <ChartWrapper constructorType="chart" config={config} options={options} />}
    </Container>
  );
}