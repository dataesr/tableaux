import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { formatToMillionsLang } from "../../../../../../utils/format";
import { EPChartsSources } from "../../../../config.js";
import options from "./options";
import { getData } from "./query";
import { useGetParams } from "./utils";
import i18nLocal from "./i18n.json";

// Remplace les {placeholders} par leur valeur (texte brut)
function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

// Idem + transforme les **texte** en <strong>texte</strong>
function renderTemplate(tpl, vars) {
  const parts = fillTemplate(tpl, vars).split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</>;
}

export default function FundingValues() {
  const { params, currentLang, countryN } = useGetParams();
  const i18nChart = i18nLocal.charts.total_fund_eur;

  const { data, isLoading } = useQuery({
    queryKey: ["FundingValuesPrograms", params],
    queryFn: () => getData(params),
  });

  // Programme "successful" ayant le financement le plus élevé
  const topProgram = data?.data
    ?.filter((program) => program.stage === "successful")
    .sort((a, b) => (b.total_fund_eur ?? 0) - (a.total_fund_eur ?? 0))[0];

  // Variables des textes pour une langue donnée
  const getVars = (lang) => ({
    country: countryN,
    name: topProgram?.[`name_${lang}`] ?? "",
    successful: formatToMillionsLang(topProgram?.total_fund_eur ?? 0, lang),
  });

  const config = {
    id: "FundingValuesPrograms",
    idQuery: "FundingValuesPrograms",
    comment: {
      fr: <>{i18nChart.comment.fr}</>,
      en: <>{i18nChart.comment.en}</>,
    },
    readingKey: {
      fr: renderTemplate(i18nChart.readingKey.fr, getVars("fr")),
      en: renderTemplate(i18nChart.readingKey.en, getVars("en")),
    },
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=FundingValuesPrograms`,
    title: fillTemplate(getI18nLabel(i18nChart, "title", currentLang), { country: countryN }),
  };

  if (isLoading || !data) return <DefaultSkeleton />;
  return (
    <div className="fr-mt-3w chart-container chart-container--default">
      <ChartWrapper
        config={config}
        options={options(data, currentLang, getI18nLabel(i18nLocal.yAxis, "total_fund_eur", currentLang))}
      />
    </div>
  );
}