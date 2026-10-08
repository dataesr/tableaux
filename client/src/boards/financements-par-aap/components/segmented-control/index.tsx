import { SegmentedControl as SegmentedControlDSFR, SegmentedElement } from "@dataesr/dsfr-plus";
import { useId } from "react";

import { getI18nLabel } from "../../../../utils";
import i18n from "../../i18n.json";

export default function SegmentedControl({ selectedControl, setSelectedControl }: { selectedControl: string, setSelectedControl: Function }) {
  const controls = [
    { field: 'projects', label: getI18nLabel(i18n, 'number_of_projects_funded') },
    { field: 'amount_global', label: 'Financement global (présence)' },
    { field: 'amount_by_structure', label: 'Financement perçu (implication)' },
  ];
  const id = useId();

  return (
    <SegmentedControlDSFR className="fr-segmented--sm" label={`Indicateur affiché: ${selectedControl}`} name={`fundings-segmented-${id}`}>
      {controls.map((control) => (
        <SegmentedElement
          checked={selectedControl === control.field}
          key={control.field}
          label={control.label}
          onClick={() => setSelectedControl(control.field)}
          value={control.field}
        />
      ))}
    </SegmentedControlDSFR>
  )
}
