import { useSearchParams } from "react-router-dom";

export interface FmPositioningFilters {
  type: string;
  region: string;
  academie: string;
}

export function usePositioningParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = (key: string, def = "") => searchParams.get(key) || def;

  const filters: FmPositioningFilters = {
    type: getParam("cmpFilterType"),
    region: getParam("cmpFilterRegion"),
    academie: getParam("cmpFilterAcademie"),
  };

  const setFilters = (f: FmPositioningFilters) => {
    const params = new URLSearchParams(searchParams);
    f.type
      ? params.set("cmpFilterType", f.type)
      : params.delete("cmpFilterType");
    f.region
      ? params.set("cmpFilterRegion", f.region)
      : params.delete("cmpFilterRegion");
    f.academie
      ? params.set("cmpFilterAcademie", f.academie)
      : params.delete("cmpFilterAcademie");
    setSearchParams(params, { replace: true });
  };

  const selectedMetric = getParam("cmpMetric", "total_effectif");
  const selectedMetricLabel = getParam("cmpMetricLabel", "");

  const setSelectedMetric = (m: string | null, label?: string) => {
    const params = new URLSearchParams(searchParams);
    m ? params.set("cmpMetric", m) : params.delete("cmpMetric");
    label
      ? params.set("cmpMetricLabel", label)
      : params.delete("cmpMetricLabel");
    setSearchParams(params, { replace: true });
  };

  return {
    filters,
    setFilters,
    selectedMetric,
    selectedMetricLabel,
    setSelectedMetric,
  };
}
