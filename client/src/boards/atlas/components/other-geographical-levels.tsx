import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useLocation } from "react-router-dom";

import References from "./references";
import { getReferences } from "../../../api";
import { Breadcrumb, Link, Title } from "@dataesr/dsfr-plus";

export default function OtherGeographicalLevels() {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();

  const params = [...searchParams].map(([key, value]) => `${key}=${value}`).join("&");

  const { data: dataReferences, isLoading: isLoadingReferences } = useQuery({
    queryKey: ["atlas/get-references", params],
    queryFn: () => getReferences(params),
  });

  return (
    <>
      <Breadcrumb>
        <Link href="/">Accueil</Link>
        <Link href="/atlas">Atlas</Link>
        <Link>{pathname.split("/")[2]}</Link>
      </Breadcrumb>
      <section>
        <Title as="h2">Autres niveaux géographiques disponibles</Title>
        <References data={dataReferences?.data || []} isLoading={isLoadingReferences} />
      </section>
    </>
  );
}
