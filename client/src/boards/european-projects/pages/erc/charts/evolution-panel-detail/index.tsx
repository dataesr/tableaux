import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Title, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import OptionsEvolution from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

// Labels des domaines scientifiques
export const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  LS: { fr: "Sciences de la vie", en: "Life Sciences" },
  PE: { fr: "Sciences physiques et ingénierie", en: "Physical Sciences & Engineering" },
  SH: { fr: "Sciences sociales et humaines", en: "Social Sciences & Humanities" },
};

// Variables CSS pour les couleurs de domaine
export const DOMAIN_CSS_VARS: Record<string, string> = {
  LS: "var(--erc-domain-ls-color)",
  PE: "var(--erc-domain-pe-color)",
  SH: "var(--erc-domain-sh-color)",
};

// Ordre des domaines
export const DOMAIN_ORDER = ["LS", "PE", "SH"];

function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);

  const currentLang = searchParams.get("language") || "fr";

  return { params: params.join("&"), currentLang };
}

interface EvolutionPanelDetailProps {
  countryCode?: string;
  currentLang?: string;
}

const configWeight = {
  id: "ercEvolutionPanelDetailWeight",
  idQuery: "ercEvolutionPanelDetail",
  title: {
    en: "Share of successful projects by panel",
    fr: "Poids des projets lauréats par panel",
    className: "fr-mt-2w fr-ml-1w",
  },
  comment: {
    fr: <>Ce graphique présente l'évolution du poids des projets lauréats du pays sélectionné par rapport au total européen, ventilé par panel ERC au sein du domaine scientifique sélectionné.</>,
    en: <>This chart shows the evolution of the share of successful projects from the selected country compared to the European total, broken down by ERC panel within the selected scientific domain.</>,
  },
  readingKey: {
    fr: <>Un poids de 10% signifie que le pays représente 10% des porteurs de projets lauréats au niveau européen pour ce panel.</>,
    en: <>A share of 10% means that the country represents 10% of successful project PIs at the European level for this panel.</>,
  },
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-detail-weight",
};

const configSuccessRate = {
  id: "ercEvolutionPanelDetailSuccessRate",
  idQuery: "ercEvolutionPanelDetail",
  title: {
    en: "Success rate by panel",
    fr: "Taux de succès par panel",
    className: "fr-mt-2w fr-ml-1w",
  },
  comment: {
    fr: <>Ce graphique présente l'évolution du taux de succès des projets du pays sélectionné, calculé comme le ratio entre projets lauréats et projets évalués, ventilé par panel ERC au sein du domaine scientifique sélectionné.</>,
    en: <>This chart shows the evolution of the success rate of projects from the selected country, calculated as the ratio of successful to evaluated projects, broken down by ERC panel within the selected scientific domain.</>,
  },
  readingKey: {
    fr: <>Un taux de succès de 20% signifie que 20% des projets soumis et évalués ont été retenus pour ce panel.</>,
    en: <>A success rate of 20% means that 20% of submitted and evaluated projects were selected for this panel.</>,
  },
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-detail-success-rate",
};

export default function EvolutionPanelDetail({ currentLang: propLang }: EvolutionPanelDetailProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;
  const [selectedDomain, setSelectedDomain] = useState(DOMAIN_ORDER[0]);

  const { data, isLoading } = useQuery({
    queryKey: ["ercPanelDetailEvolution", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  // Vérifier quels domaines ont des données
  const availableDomains = DOMAIN_ORDER.filter(
    (domain) =>
      data.country.successful.some((item) => item.domaine_scientifique === domain) ||
      data.country.evaluated.some((item) => item.domaine_scientifique === domain),
  );

  if (availableDomains.length === 0) return null;

  // S'assurer que le domaine sélectionné est disponible
  const effectiveDomain = availableDomains.includes(selectedDomain) ? selectedDomain : availableDomains[0];

  const weightOptions = OptionsEvolution({
    data,
    domain: effectiveDomain,
    chartType: "weight",
    currentLang,
  });

  const successRateOptions = OptionsEvolution({
    data,
    domain: effectiveDomain,
    chartType: "successRate",
    currentLang,
  });

  return (
    <div className="evolution-panel-detail">
      <Title as="h3">{currentLang === "fr" ? "Évolution par panel ERC" : "Evolution by ERC panel"}</Title>

      {/* Sélecteur de domaine */}
      <div className="fr-mb-3w">
        <SegmentedControl className="fr-segmented--sm" name="evolution-panel-detail-domain">
          {availableDomains.map((domain) => {
            const domainColor = DOMAIN_CSS_VARS[domain];
            const label = DOMAIN_LABELS[domain]?.[currentLang as "fr" | "en"] || domain;
            return (
              <SegmentedElement
                key={domain}
                checked={effectiveDomain === domain}
                label={label}
                onClick={() => setSelectedDomain(domain)}
                value={domain}
                style={effectiveDomain === domain ? { backgroundColor: domainColor, color: "white", borderColor: domainColor } : {}}
              />
            );
          })}
        </SegmentedControl>
      </div>

      {/* Graphique 1: Poids des projets par panel */}
      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper config={configWeight} options={weightOptions} renderData={() => null} />
      </div>

      {/* Graphique 2: Taux de succès par panel */}
      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper config={configSuccessRate} options={successRateOptions} renderData={() => null} />
      </div>
    </div>
  );
}
