import { useSearchParams } from "react-router-dom";

// Onglet courant d'une page, lu dans le paramètre d'URL `section` (plugins/tableaux/reference/url-parameters.md) ;
// absent ou inconnu = premier onglet.
export function useSection<S extends { id: string }>(sections: readonly S[]): S {
  const [searchParams] = useSearchParams();
  return sections.find(({ id }) => id === searchParams.get("section")) ?? sections[0];
}
