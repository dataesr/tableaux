import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button, Modal, ModalContent, ModalTitle } from "@dataesr/dsfr-plus";
import { getFiltersValues } from "../../../../api/atlas.ts";
import { useAtlas } from "../../useAtlas.tsx";

export default function YearsModalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { DEFAULT_CURRENT_YEAR } = useAtlas();

  const currentYear =
    searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;
  const geoId = searchParams.get("geo_id") || "";

  const { data: filtersValues, isLoading: isLoadingFiltersValues } = useQuery({
    queryKey: ["atlas/get-filters-values", geoId],
    queryFn: () => getFiltersValues(geoId),
  });

  if (isLoadingFiltersValues) {
    return <div>Chargement des filtres ...</div>;
  }

  return (
    <>
      <Button icon="calendar-2-line" onClick={() => setIsOpen(true)} size="sm">
        Année universitaire&nbsp;<strong>{currentYear}</strong>
      </Button>
      <Modal isOpen={isOpen} hide={() => setIsOpen(false)} size="lg">
        <ModalTitle>Sélection d'une année universitaire</ModalTitle>
        <ModalContent>
          <div className="fr-select-group">
            <label className="fr-label fr-sr-only" htmlFor="select">
              Sélectionnez l'année universitaire souhaitée
            </label>
            <select
              className="fr-select"
              value={currentYear}
              id="select"
              name="select"
              onChange={(e) => {
                const nextSearchParams = new URLSearchParams(searchParams);
                nextSearchParams.set("annee_universitaire", e.target.value);
                setSearchParams(nextSearchParams);
                setIsOpen(false);
              }}
            >
              {filtersValues.annees_universitaires.all.map((value: string) => (
                <option
                  disabled={
                    !filtersValues?.annees_universitaires?.onlyWithData.includes(
                      value
                    )
                  }
                  key={value}
                  value={value}
                >
                  {`Année universitaire ${value}`}
                  {!filtersValues?.annees_universitaires?.onlyWithData.includes(
                    value
                  ) && <> - non disponibles</>}
                </option>
              ))}
            </select>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
