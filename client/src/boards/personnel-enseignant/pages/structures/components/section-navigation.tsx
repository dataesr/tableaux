import { useMemo } from "react";
import TertiaryNavigation from "../../../../../components/tertiary-navigation";
import { ViewType } from "../api";

interface SectionNavigationProps {
    activeSection: string;
    viewType: ViewType;
    onSectionChange: (section: string) => void;
}

const ALL_NAV_ITEMS = [
    { id: "personnels", label: "Personnels enseignants" },
    { id: "groupes-cnu", label: "Groupes CNU" },
    { id: "comparaison", label: "Positionnement" },
    { id: "analyses", label: "Analyses" },
];

const HIDDEN_SECTIONS: Partial<Record<ViewType, string[]>> = {
    discipline: ["typologie", "comparaison"],
};

export default function SectionNavigation({
    activeSection,
    viewType,
    onSectionChange,
}: SectionNavigationProps) {
    const navItems = useMemo(() => {
        const hidden = HIDDEN_SECTIONS[viewType] || [];
        return ALL_NAV_ITEMS.filter((item) => !hidden.includes(item.id));
    }, [viewType]);
    return (
        <TertiaryNavigation
            items={navItems}
            activeItem={activeSection}
            onItemChange={onSectionChange}
        />
    );
}
