import { useSearchParams } from "react-router-dom";
import { useState } from "react";

import bool from "./query";
import Template from "./template";
import {
  useQueryResponse,
  getOptions,
  getSeries,
  getLabel,
} from "./utils.tsx";
import ChartWrapper from "../../../../components/chart-wrapper/index.tsx";

export default function IpccInstitutions() {
  const [searchParams] = useSearchParams();
  const [useAcronyms, setUseAcronyms] = useState(true);
  const { data, isLoading } = useQueryResponse(bool, 15, "");
  const currentLang = searchParams.get("language") || "FR";

  if (isLoading || !data) return Template();

  const { series, categories } = getSeries(data, useAcronyms);

  const title = getLabel("ipcc_institutions", "title", currentLang);

  const options = getOptions(
    series,
    categories,
    title,
    getLabel("ipcc_institutions", "format1", currentLang),
    getLabel("ipcc_institutions", "format2", currentLang),
    getLabel("ipcc_institutions", "title_x_axis", currentLang),
    getLabel("ipcc_institutions", "title_y_axis", currentLang)
  );
  const chartConfig = {
    id: "ipcc_institutions",
    title: {
      fr: title,
      en: title,
    },
  };

  return (
    <>
      <button
        onClick={() => setUseAcronyms((prev) => !prev)}
        style={{
          marginBottom: "10px",
          padding: "6px 12px",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        {useAcronyms ? "Afficher les noms complets" : "Afficher les acronymes"}
      </button>

      <ChartWrapper
        config={chartConfig}
        options={options}
      />
    </>
  );
}
