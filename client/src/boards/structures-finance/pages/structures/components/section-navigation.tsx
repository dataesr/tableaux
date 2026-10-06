import TertiaryNavigation from "../../../../../components/tertiary-navigation";

export const SECTION_LABELS: Record<string, string> = {
  ressources: "Ressources",
  "sante-financiere": "Santé financière",
  "moyens-humains": "Moyens humains",
  erc: "ERC",
  "diplomes-formations": "Diplômes et formations",
  implantations: "Implantations",
  positionnement: "Positionnement",
  analyses: "Analyses et évolutions",
};

interface SectionNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  data?: any;
}

export default function SectionNavigation({
  activeSection,
  onSectionChange,
  data,
}: SectionNavigationProps) {
  const showImplantations = data?.nb_sites > 1;
  const showErc = data?.is_erc === true;
  const showFormations =
    data?.effectif_sans_cpge != null && data?.effectif_sans_cpge !== 0;

  const sectionIds = [
    "ressources",
    "sante-financiere",
    "moyens-humains",
    ...(showErc ? ["erc"] : []),
    ...(showFormations ? ["diplomes-formations"] : []),
    ...(showImplantations ? ["implantations"] : []),
    "positionnement",
    "analyses",
  ];
  const navItems = sectionIds.map((id) => ({ id, label: SECTION_LABELS[id] }));

  return (
    <TertiaryNavigation
      items={navItems}
      activeItem={activeSection}
      onItemChange={onSectionChange}
    />
  );
}
