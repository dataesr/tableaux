import TertiaryNavigation from "../../../../../components/tertiary-navigation";

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

  const navItems = [
    { id: "ressources", label: "Ressources" },
    { id: "sante-financiere", label: "Santé financière" },
    { id: "moyens-humains", label: "Moyens humains" },
    ...(showErc ? [{ id: "erc", label: "ERC" }] : []),
    ...(showFormations
      ? [{ id: "diplomes-formations", label: "Diplômes et formations" }]
      : []),
    ...(showImplantations
      ? [{ id: "implantations", label: "Implantations" }]
      : []),
    { id: "positionnement", label: "Positionnement" },
    { id: "analyses", label: "Analyses et évolutions" },
  ];

  return (
    <TertiaryNavigation
      items={navItems}
      activeItem={activeSection}
      onItemChange={onSectionChange}
    />
  );
}
