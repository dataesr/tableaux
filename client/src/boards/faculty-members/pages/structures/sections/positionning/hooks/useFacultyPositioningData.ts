import { useMemo } from "react";
import { useFacultyPositioning, type ViewType } from "../../../api";
import type { FmPositioningFilters } from "./usePositioningParams";

function parseDynamicMetric(metric: string): {
  cnuType?: string;
  cnuCode?: number;
  assimilCode?: string;
} {
  if (metric.startsWith("groupe_cnu:"))
    return { cnuType: "groupe", cnuCode: parseInt(metric.split(":")[1]) };
  if (metric.startsWith("section_cnu:"))
    return { cnuType: "section", cnuCode: parseInt(metric.split(":")[1]) };
  if (metric.startsWith("assimil:"))
    return { assimilCode: metric.slice("assimil:".length) };
  return {};
}

export function useFacultyPositioningData(
  viewType: ViewType,
  selectedId: string,
  selectedYear: string,
  filters: FmPositioningFilters,
  selectedMetric: string
) {
  const { cnuType, cnuCode, assimilCode } = parseDynamicMetric(selectedMetric);
  const { data, isLoading } = useFacultyPositioning(
    viewType,
    selectedYear,
    cnuType,
    cnuCode,
    assimilCode
  );

  const allItems: any[] = useMemo(() => data?.items || [], [data]);

  const currentItem = useMemo(() => {
    if (viewType === "region")
      return allItems.find(
        (item) => item.etablissement_code_region === selectedId
      );
    if (viewType === "academie")
      return allItems.find(
        (item) => item.etablissement_code_academie === selectedId
      );
    return allItems.find(
      (item) => item.etablissement_id_paysage_actuel === selectedId
    );
  }, [allItems, selectedId, viewType]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (item.etablissement_id_paysage_actuel === selectedId) return true;

      if (filters.type === "same-type" && currentItem) {
        if (item.etablissement_type !== currentItem.etablissement_type)
          return false;
      }

      if (filters.region === "same-region" && currentItem) {
        if (
          item.etablissement_code_region !==
          currentItem.etablissement_code_region
        )
          return false;
      }

      if (filters.academie === "same-academie" && currentItem) {
        if (
          item.etablissement_code_academie !==
          currentItem.etablissement_code_academie
        )
          return false;
      }

      return true;
    });
  }, [allItems, selectedId, currentItem, filters]);

  return { allItems, filteredItems, currentItem, isLoading };
}
