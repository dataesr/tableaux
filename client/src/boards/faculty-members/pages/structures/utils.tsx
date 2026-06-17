import { ViewType } from "./api";

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