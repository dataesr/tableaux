import "./styles.scss";

export interface NavigationItem {
  id: string;
  label: string;
}

interface TertiaryNavigationProps {
  items: NavigationItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
  ariaLabel?: string;
}

export default function TertiaryNavigation({
  items,
  activeItem,
  onItemChange,
  ariaLabel = "Sections de la page",
}: TertiaryNavigationProps) {
  return (
    <nav aria-label={ariaLabel} className="tertiary-navigation fr-mt-2w fr-mb-1w">
      <ul className="tertiary-navigation__list fr-raw-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="tertiary-navigation__link"
              aria-current={activeItem === item.id ? "page" : undefined}
              onClick={() => onItemChange(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
