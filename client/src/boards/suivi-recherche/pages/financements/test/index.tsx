import { Alert, Notice } from "@dataesr/dsfr-plus";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../components/chart-wrapper/index.tsx";
import { createChartOptions } from "../../../../../components/chart-wrapper/default-options.ts";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { useRenderTransition } from "../../../hooks/use-render-transition";

const { VITE_APP_SERVER_URL } = import.meta.env;

type Financement = { count: number; type: string; year: number };

const YEAR_MIN = 2010;
const YEAR_MAX = 2025;
const YEARS = [...Array(YEAR_MAX - YEAR_MIN + 1).keys()].map((year) => year + YEAR_MIN);

async function fetchFinancements(rorId: string): Promise<Financement[]> {
  const response = await fetch(`${VITE_APP_SERVER_URL}/suivi-recherche/financements?${new URLSearchParams({ ror_id: rorId })}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

// Prototype : nombre de projets financés de l'établissement sélectionné, par type et par année
export default function TestSection() {
  const [searchParams] = useSearchParams();
  // Établissement (identifiant ROR), voir plugins/tableaux/reference/url-parameters.md
  const rorId = searchParams.get("ror_id");

  const { data, isError, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["suivi-recherche", "financements", rorId],
    queryFn: () => fetchFinancements(rorId as string),
    enabled: Boolean(rorId),
    placeholderData: keepPreviousData,
  });
  const { applied, busy } = useRenderTransition(data);

  const options = useMemo(() => {
    if (!applied) return null;
    const types = [...new Set(applied.map((d) => d.type))];
    return createChartOptions("line", {
      legend: { enabled: true },
      xAxis: { categories: YEARS.map(String) },
      yAxis: { title: { text: "Nombre de projets" } },
      series: types.map((type) => ({
        type: "line",
        name: type,
        data: YEARS.map((year) => applied.find((d) => d.type === type && d.year === year)?.count ?? 0),
      })),
    });
  }, [applied]);

  if (!rorId) {
    return (
      <Notice closeMode="disallow" type="info">
        Choisissez un établissement dans la sélection pour afficher ses projets financés.
      </Notice>
    );
  }
  if (isError) {
    return <Alert description="Les projets financés n'ont pas pu être chargés." title="Erreur de chargement" variant="error" />;
  }
  if (isLoading || !applied || !options) return <DefaultSkeleton height="200px" label="Chargement des données" />;
  if (applied.length === 0) {
    return (
      <Notice closeMode="disallow" type="info">
        Aucun projet financé trouvé pour cet établissement.
      </Notice>
    );
  }

  const config = {
    id: "suivi-recherche-financements-test",
    title: { fr: "Évolution annuelle du nombre de projets financés, par type", look: "h5" as const },
  };

  return (
    <ChartBusy busy={isPlaceholderData || busy}>
      <ChartWrapper config={config} options={options} />
    </ChartBusy>
  );
}
