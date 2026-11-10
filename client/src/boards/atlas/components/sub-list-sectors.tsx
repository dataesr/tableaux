import { useState } from "react";
import { Badge, Button, Container, Row } from "@dataesr/dsfr-plus";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Template from "../../../components/template/index.tsx";
import { getNumberOfStudentsBySectorAndSublevel } from "../../../api/index.ts";
import { getSubLevel } from "../utils/index.tsx";
import { useAtlas } from "../useAtlas.tsx";

const MAX_ELEMENTS = 6;

export default function SubListSectors() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const geoId = searchParams.get("geo_id") || "";
  const { DEFAULT_CURRENT_YEAR } = useAtlas();
  const currentYear =
    searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;
  const [max, setMax] = useState(MAX_ELEMENTS);

  const { data, isLoading } = useQuery({
    queryKey: [
      "atlas/get-number-of-students-by-sector-and-sublevel",
      geoId,
      currentYear,
    ],
    queryFn: () => getNumberOfStudentsBySectorAndSublevel(geoId, currentYear),
  });

  if (isLoading) {
    return <Template height="338" />;
  }
  if (!data) {
    return null;
  }

  const maxValue: number = Math.max(...data.map((el) => el.effectif_total));

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
        {data.slice(0, max).map((item) => {
          const size_public = Math.round(
            (item.effectif_secteur_public * 100) / maxValue
          );
          const size_prive = Math.round(
            (item.effectif_secteur_prive * 100) / maxValue
          );

          return (
            <li key={item.id}>
              <Row key={item.id} style={{ width: "100%" }}>
                <div style={{ flexGrow: "1" }}>{item.nom}</div>
                <div>
                  <strong>{item.effectif_total.toLocaleString("fr-FR")}</strong>
                  {["R", "D", "A", "U", "P"].includes(geoId?.charAt(0)) && (
                    <Button
                      className="fr-ml-1w"
                      color="pink-tuile"
                      onClick={() =>
                        navigate(
                          `/atlas/general?geo_id=${item.id}&annee_universitaire=${currentYear}`
                        )
                      }
                      size="sm"
                      variant="text"
                    >
                      Voir
                    </Button>
                  )}
                </div>
              </Row>
              <div
                aria-describedby={`tooltip_${item.id}`}
                className="fr-mb-1v"
                style={{
                  width: `${size_public}%`,
                  height: "6px",
                  backgroundColor: "#748CC0",
                  borderTopRightRadius: "3px",
                  borderBottomRightRadius: "3px",
                }}
              />

              <div
                aria-describedby={`tooltip_${item.id}`}
                className="fr-mb-1w"
                style={{
                  width: `${size_prive}%`,
                  height: "6px",
                  backgroundColor: "#755F4D",
                  borderTopRightRadius: "3px",
                  borderBottomRightRadius: "3px",
                }}
              />
              <span
                aria-hidden="true"
                className="fr-tooltip fr-placement"
                id={`tooltip_${item.id}`}
                role="tooltip"
              >
                Effectifs <strong>{item.nom}</strong> par secteur pour l'année
                universitaire {currentYear}
                <br />
                Secteur public : {item.effectif_secteur_public.toLocaleString("fr-FR")}{" "}
                étudiants
                <br />
                Secteur privé : {item.effectif_secteur_prive.toLocaleString("fr-FR")}{" "}
                étudiants
              </span>
            </li>
          );
        })}
        {data.length > MAX_ELEMENTS && (
          <Button
            onClick={() =>
              setMax(max === MAX_ELEMENTS ? data.length : MAX_ELEMENTS)
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
