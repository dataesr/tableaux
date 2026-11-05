import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { formatToMillionsLang } from "../../../../../../utils/format";
import i18n from "./i18n.json";
import Options from "./options";
import { getData } from "./query";
import { useGetParams } from "./utils";

import "./styles.scss";

interface PositioningScientificDomainTreemapProps {
  countryCode?: string;
  currentLang?: string;
}

const config = {
  id: "mscaPositioningScientificDomainTreemap",
  idQuery: "mscaPositioningScientificDomainTreemap",
  title: {
    en: getI18nLabel(i18n, "chart-title", "en"),
    fr: getI18nLabel(i18n, "chart-title", "fr"),
  },
  comment: {
    fr: <>{getI18nLabel(i18n, "comment", "fr")}</>,
    en: <>{getI18nLabel(i18n, "comment", "en")}</>,
  },
  readingKey: {
    fr: <>{getI18nLabel(i18n, "reading-key", "fr")}</>,
    en: <>{getI18nLabel(i18n, "reading-key", "en")}</>,
  },
  integrationURL: "/european-projects/components/pages/msca/charts/positioning-scientific-domain-treemap",
};

function PositioningScientificDomainTreemapInner({ currentLang: propLang }: PositioningScientificDomainTreemapProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang: string = propLang || urlLang;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPositioningScientificDomainTreemap", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;
  const allData = data.map((d) => ({ ...d, label: formatToMillionsLang(d.value, 1, currentLang as "en" | "fr") }))

  if (data.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
      </div>
    );
  }

  const options = Options({ data: allData });

  return (
    <div className="positioning-scientific-domain-treemap-chart">
      <div className="chart-container chart-container--default">
        <ChartWrapper config={config} options={options} />
      </div>
    </div>
  );
}

export default function PositioningScientificDomainTreemap({ countryCode, currentLang }: PositioningScientificDomainTreemapProps) {
  return <PositioningScientificDomainTreemapInner countryCode={countryCode} currentLang={currentLang} />;
}
