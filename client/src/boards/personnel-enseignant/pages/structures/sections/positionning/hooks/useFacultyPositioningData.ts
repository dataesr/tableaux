import { useMemo } from "react";
import { useFacultyPositioning, type ViewType } from "../../../api";
import type { FmPositioningFilters } from "./usePositioningParams";
import { getAvailablePositioningFilters } from "../config";

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
    // Un filtre n'est appliqué que s'il est proposé (donc visible) pour l'entité courante.
    const available = getAvailablePositioningFilters(viewType, currentItem);
    return allItems.filter((item) => {
      if (item === currentItem) return true;

      if (available.type && filters.type === "same-type") {
        if (item.etablissement_type !== currentItem.etablissement_type)
          return false;
      }

      if (available.region && filters.region === "same-region") {
        if (
          item.etablissement_code_region !==
          currentItem.etablissement_code_region
        )
          return false;
      }

      if (available.academie && filters.academie === "same-academie") {
        if (
          item.etablissement_code_academie !==
          currentItem.etablissement_code_academie
        )
          return false;
      }

      return true;
    });
  }, [allItems, selectedId, currentItem, filters, viewType]);

  return { allItems, filteredItems, currentItem, isLoading };
}
