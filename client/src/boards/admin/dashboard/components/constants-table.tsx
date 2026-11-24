import { useId } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@dataesr/dsfr-plus";

import type { DashboardConstant } from "../utils";

type Props = {
  constants: DashboardConstant[];
  savedConstants: DashboardConstant[];
  setConstants: Dispatch<SetStateAction<DashboardConstant[]>>;
  updateConstant: (key: string, value: string) => void;
  productionConstants: DashboardConstant[];
  savedProductionConstants: DashboardConstant[];
  setProductionConstants: Dispatch<SetStateAction<DashboardConstant[]>>;
  updateProductionConstant: (key: string, value: string) => void;
  // Raison pour laquelle la valeur de prod ne peut pas être modifiée (pas de fiche en prod, base non configurée…).
  productionUnavailableMessage: string | null;
};

const getValue = (constants: DashboardConstant[], key: string) => constants.find((constant) => constant.key === key)?.value ?? "";

// Les clés et descriptions viennent de staging ; chaque clé a une valeur en staging et une valeur en prod,
// lues et écrites chacune dans sa base.
export default function ConstantsTable({
  constants,
  savedConstants,
  setConstants,
  updateConstant,
  productionConstants,
  savedProductionConstants,
  setProductionConstants,
  updateProductionConstant,
  productionUnavailableMessage,
}: Props) {
  const id = useId();

  const setProductionValue = (key: string, value: string) => {
    setProductionConstants((previous) => {
      const exists = previous.some((constant) => constant.key === key);
      return exists ? previous.map((constant) => (constant.key === key ? { ...constant, value } : constant)) : [...previous, { key, value, description: "" }];
    });
  };

  return (
    <div className="fr-table--sm fr-table fr-table--bordered">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption>
                Constantes applicatives
                {productionUnavailableMessage && <p className="fr-text--sm fr-mb-0">Production : {productionUnavailableMessage}</p>}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Clé</th>
                  <th scope="col" colSpan={2}>
                    Valeur staging
                  </th>
                  <th scope="col" colSpan={2}>
                    Valeur production
                  </th>
                  <th scope="col">Info</th>
                </tr>
              </thead>
              <tbody>
                {constants.map((constant) => {
                  const stagingInputId = `${id}-${constant.key}-staging`;
                  const productionInputId = `${id}-${constant.key}-production`;
                  const productionValue = getValue(productionConstants, constant.key);
                  return (
                    <tr key={constant.key}>
                      <td>{constant.key}</td>
                      <td>
                        <label className="fr-sr-only" htmlFor={stagingInputId}>
                          Valeur staging de {constant.key}
                        </label>
                        <input
                          className="fr-input"
                          id={stagingInputId}
                          onChange={(e) => {
                            setConstants(constants.map((el) => (el.key === constant.key ? { ...el, value: e.target.value } : el)));
                          }}
                          type="text"
                          value={constant.value}
                        />
                      </td>
                      <td>
                        <Button
                          disabled={getValue(savedConstants, constant.key) === constant.value}
                          icon="save-line"
                          onClick={() => {
                            updateConstant(constant.key, constant.value);
                          }}
                          size="sm"
                          title={`Enregistrer la valeur staging de ${constant.key}`}
                          variant="text"
                        />
                      </td>
                      <td>
                        <label className="fr-sr-only" htmlFor={productionInputId}>
                          Valeur production de {constant.key}
                        </label>
                        <input
                          className="fr-input"
                          disabled={productionUnavailableMessage !== null}
                          id={productionInputId}
                          onChange={(e) => setProductionValue(constant.key, e.target.value)}
                          type="text"
                          value={productionValue}
                        />
                      </td>
                      <td>
                        <Button
                          disabled={productionUnavailableMessage !== null || getValue(savedProductionConstants, constant.key) === productionValue}
                          icon="save-line"
                          onClick={() => {
                            if (window.confirm(`Enregistrer en production la valeur « ${productionValue} » pour ${constant.key} ?`)) updateProductionConstant(constant.key, productionValue);
                          }}
                          size="sm"
                          title={`Enregistrer la valeur production de ${constant.key}`}
                          variant="text"
                        />
                      </td>
                      <td>{constant.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
