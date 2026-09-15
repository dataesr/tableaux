import { ViewType } from "./api";

export function formatDisciplineLabel(label?: string | null): string {
    if (!label) return label ?? "";
    const normalized = label.trim().toLowerCase();
    if (
        normalized === "personnel des grands établissements" ||
        normalized === "personnels des grands établissements"
    ) {
        return "Hors discipline (grands établissements)";
    }
    return label;
}

export function getParamKey(viewType: ViewType): string {
    switch (viewType) {
        case "structure":
            return "structureId";
        case "discipline":
            return "discipline_id";
        case "region":
        case "academie":
            return "geo_id";
        default:
            return "id";
    }
}