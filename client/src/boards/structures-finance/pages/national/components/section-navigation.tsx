import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@dataesr/dsfr-plus";
import "../styles.scss";

export default function SectionNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const activeSection = searchParams.get("onglet") || "comparison";

  const handleSectionChange = (section: string) => {
    searchParams.set("onglet", section);
    setSearchParams(searchParams);
    setIsOpen(false);
  };

  const navItems = [
    { id: "comparison", label: "Comparaison de métriques" },
    // { id: "produits-vs-etudiants", label: "Produits vs Effectifs" },
    // { id: "scsp-vs-encadrement", label: "SCSP vs Encadrement" },
    // { id: "scsp-vs-ressources-propres", label: "SCSP vs Ressources propres" },
  ];

  return (
    <nav
      className="fr-nav section-navigation"
      id="section-navigation-national"
      role="navigation"
      aria-label="Navigation secondaire"
    >
      <Button
        className="section-navigation__burger"
        variant="secondary"
        size="sm"
        icon="menu-fill"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="section-nav-list-national"
      >
        Menu
      </Button>

      <ul
        id="section-nav-list-national"
        className={`fr-nav__list section-navigation__list ${isOpen ? "section-navigation__list--open" : ""}`}
      >
        {navItems.map((item) => (
          <li key={item.id} className="fr-nav__item">
            <a
              className="fr-nav__link"
              href={`#${item.id}`}
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleSectionChange(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
