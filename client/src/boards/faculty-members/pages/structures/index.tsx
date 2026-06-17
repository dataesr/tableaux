import { useSearchParams } from "react-router-dom";
import { ViewType } from "./api";
import EntityView from "./components/entity-view";
import EntitySelector from "./components/entity-selector";
import { getParamKey } from "./utils";

interface Props {
  viewType: ViewType;
}

export default function DataView({ viewType }: Props) {
  const [searchParams] = useSearchParams();

  const selectedId = searchParams.get(getParamKey(viewType)) || "";

  return selectedId ? (
    <EntityView viewType={viewType} />
  ) : (
    <EntitySelector viewType={viewType} />
  );
}