import { useState } from "react";
import { Badge, Button, Container, Row } from "@dataesr/dsfr-plus";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Template from "../../../components/template/index.tsx";
import { getNumberOfStudentsHistoricByLevel } from "../../../api/index.ts";
import { getSubLevel } from "../utils/index.tsx";
import { useAtlas } from "../useAtlas.tsx";

const MAX_ELEMENTS = 6;

export default function SubList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const geoId = searchParams.get("geo_id") || "";

  const { DEFAULT_CURRENT_YEAR } = useAtlas();
  const currentYear =
    searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;
  const [max, setMax] = useState(MAX_ELEMENTS);

  const { data: dataHistoric, isLoading: isLoadingHistoric } = useQuery({
    queryKey: [
      "atlas/number-of-students-historic-by-level",
      geoId,
      currentYear,
    ],
    queryFn: () => getNumberOfStudentsHistoricByLevel(geoId, currentYear),
  });

  if (isLoadingHistoric) {
    return <Template height="338" />;
  }
  if (!dataHistoric?.data) {
    return null;
  }

  const maxValue: number = Math.max(
    ...dataHistoric.data.map(
      (ter: { data: { annee_universitaire: string; effectif: number }[] }) =>
        ter.data.find((el) => el.annee_universitaire === currentYear)?.effectif
    )
  );

  // Special case "Saint-Martin" (geo_id = 978)
  dataHistoric.data.forEach((item) => {
    if (item.geo_id === "978") {
      item.geo_id = "D978";
    }
  });

  return (
    <Container fluid as="section">
      <Row style={{ width: "100%" }}>
        <div style={{ flexGrow: "1" }}>
          <strong>
            <i>{getSubLevel({ geoId })}</i>
          </strong>
        </div>
        <div className="fr-mb-1w">
          <Badge color="yellow-tournesol">{currentYear}</Badge>
        </div>
      </Row>
      <ul style={{ overflow: "auto", listStyle: "none", padding: 0 }}>
        {dataHistoric?.data.slice(0, max).map((item) => {
          const size = Math.round(
            (item.data.find((el) => el.annee_universitaire === currentYear)
              ?.effectif *
              100) /
              maxValue
          );

          return (
            <li key={item.geo_id}>
              <Row key={item.geo_nom} style={{ width: "100%" }}>
                <div style={{ flexGrow: "1" }}>{item.geo_nom}</div>
                <div>
                  <strong>{item.data.find((el) => el.annee_universitaire === currentYear)?.effectif.toLocaleString()}</strong>
                  {["R", "D", "A", "U", "P"].includes(geoId?.charAt(0)) && (
                    <Button className="fr-ml-1w" onClick={() => navigate(`/atlas/general?geo_id=${item.geo_id}&annee_universitaire=${currentYear}`)} size="sm" variant="text">
                      Voir
                    </Button>
                  )}
                </div>
              </Row>
              <div
                className="fr-mb-1w"
                style={{
                  width: `${size}%`,
                  height: "8px",
                  backgroundColor: "#000091",
                  borderTopRightRadius: "3px",
                  borderBottomRightRadius: "3px",
                }}
              />
            </li>
          );
        })}
        {dataHistoric.data.length > MAX_ELEMENTS && (
          <Button
            onClick={() =>
              setMax(
                max === MAX_ELEMENTS ? dataHistoric.data.length : MAX_ELEMENTS
              )
            }
            size="sm"
            variant="text"
          >
            {max === MAX_ELEMENTS ? "Voir plus" : "Voir moins"}
          </Button>
        )}
      </ul>
    </Container>
  );
}
