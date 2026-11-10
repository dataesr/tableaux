import type { Dispatch, SetStateAction } from "react";
import { Button } from "@dataesr/dsfr-plus";

import type { DashboardConstant } from "../utils";

type Props = {
  constants: DashboardConstant[];
  savedConstants: DashboardConstant[];
  setConstants: Dispatch<SetStateAction<DashboardConstant[]>>;
  updateConstant: (key: string, value: string) => void;
};

export default function ConstantsTable({ constants, savedConstants, setConstants, updateConstant }: Props) {
  return (
      <div className="fr-table--sm fr-table fr-table--bordered">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <caption>Constantes applicatives</caption>
                <thead>
                  <tr>
                    <th>Clé</th>
                    <th>Valeur</th>
                    <th>Info</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {constants.map((constant) => (
                    <tr id="table-sm-row-key-1" data-row-key="1">
                      <td>{constant.key}</td>
                      <td>
                        <input
                          onChange={(e) => {
                            setConstants(constants.map((el) => (el.key === constant.key ? { ...el, value: e.target.value } : el)));
                          }}
                          type="text"
                          value={constant.value}
                        />
                      </td>
                      <td>{constant.description}</td>
                      <td>
                        <Button
                          disabled={savedConstants.find((el) => el.key === constant.key)?.value === constant.value}
                          icon="save-line"
                          onClick={() => {
                            updateConstant(constant.key, constant.value);
                          }}
                          size="sm"
                          title="Mettre à jour la constante"
                          variant="text"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}
