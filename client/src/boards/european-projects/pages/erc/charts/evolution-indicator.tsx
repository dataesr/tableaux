import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import type { EvolutionMetric, EvolutionRatio } from "./evolution-global/query";
import { formatRatio } from "./evolution-global/utils";
import type { ChartConfig } from "../../../../../components/chart-wrapper";

export const metricLabels: Record<EvolutionMetric, { fr: string; en: string }> = {
  pi: { fr: "Porteurs de projets", en: "Project PIs" },
  funding: { fr: "Financements", en: "Funding" },
  projects: { fr: "Projets", en: "Projects" },
};

export const metricFields = {
  pi: "total_pi",
  funding: "total_funding_project",
  projects: "total_projects",
} as const;

export function calculateRatio(numerator: number | undefined, denominator: number | undefined): EvolutionRatio | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return { value: Math.round((numerator / denominator) * 1000) / 10, numerator, denominator };
}

export function evolutionConfig(base: ChartConfig, type: "weight" | "successRate", metric: EvolutionMetric, dimension: { fr: string; en: string }, years: string[], series: { name: string; data: (EvolutionRatio | null)[] }[]): ChartConfig {
  const label = metricLabels[metric];
  const example = series.flatMap((item) => item.data.map((point, index) => ({ point, year: years[index], name: item.name }))).find((item) => item.point);
  return {
    ...base,
    title: {
      fr: `${type === "weight" ? "Poids" : "Taux de succès"} : ${label.fr.toLowerCase()} par ${dimension.fr}`,
      en: `${type === "weight" ? "Share" : "Success rate"}: ${label.en.toLowerCase()} by ${dimension.en}`,
      className: "fr-my-1w fr-ml-1w",
    },
    comment:
      type === "weight"
        ? {
            fr: (
              <>
                Part des {label.fr.toLowerCase()} associés aux projets lauréats du pays sélectionné dans le total européen, par {dimension.fr}.
              </>
            ),
            en: (
              <>
                Share of {label.en.toLowerCase()} associated with successful projects in the selected country compared with the European total, by {dimension.en}.
              </>
            ),
          }
        : {
            fr: (
              <>
                Rapport entre les {label.fr.toLowerCase()} associés aux projets lauréats et aux projets évalués du pays sélectionné, par {dimension.fr}.
              </>
            ),
            en: (
              <>
                Ratio of {label.en.toLowerCase()} associated with successful projects to those associated with evaluated projects in the selected country, by {dimension.en}.
              </>
            ),
          },
    readingKey: example?.point
      ? {
          fr: (
            <>
              En {example.year}, pour {example.name} : {formatRatio(example.point, metric, "fr")}.
            </>
          ),
          en: (
            <>
              In {example.year}, for {example.name}: {formatRatio(example.point, metric, "en")}.
            </>
          ),
        }
      : undefined,
  };
}

export function useEvolutionMetric(param: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(param);
  const metric: EvolutionMetric = value === "funding" || value === "projects" ? value : "pi";
  const setMetric = (nextMetric: string) => {
    if (nextMetric !== "pi" && nextMetric !== "funding" && nextMetric !== "projects") return;
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (nextMetric === "pi") next.delete(param);
        else next.set(param, nextMetric);
        return next;
      },
      { replace: true },
    );
  };
  return { metric, setMetric };
}

export function EvolutionIndicator({ metric, setMetric, currentLang, name }: { metric: EvolutionMetric; setMetric: (value: string) => void; currentLang: string; name: string }) {
  return (
    <SegmentedControl className="fr-segmented--sm fr-mb-2w" name={name} label={currentLang === "en" ? "Indicator" : "Choix de l'indicateur"} onChangeValue={setMetric}>
      {(["pi", "funding", "projects"] as const).map((value) => (
        <SegmentedElement key={value} checked={metric === value} label={metricLabels[value][currentLang === "en" ? "en" : "fr"]} value={value} />
      ))}
    </SegmentedControl>
  );
}

export function EvolutionDataTable({ years, series, metric, currentLang, caption }: { years: string[]; series: { name: string; data: (EvolutionRatio | null)[] }[]; metric: EvolutionMetric; currentLang: string; caption: string }) {
  return (
    <table className="fr-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{currentLang === "en" ? "Year" : "Année"}</th>
          {series.map((item) => (
            <th key={item.name} scope="col">
              {item.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {years.map((year, index) => (
          <tr key={year}>
            <th scope="row">{year}</th>
            {series.map((item) => {
              const point = item.data[index];
              return <td key={item.name}>{point ? formatRatio(point, metric, currentLang) : "–"}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
