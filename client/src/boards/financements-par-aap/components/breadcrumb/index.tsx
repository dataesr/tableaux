import { Link } from "@dataesr/dsfr-plus"
import { useId } from "react"


export default function Breadcrumb({ items }) {
  const id = useId()

  return (
    <nav className="fr-breadcrumb" role="navigation">
      <button
        aria-controls={`fundings-breadcrumb-${id}`}
        aria-expanded="false"
        className="fr-breadcrumb__button"
        type="button"
      >
        Voir le fil d’Ariane
      </button>
      <div className="fr-collapse" id={`fundings-breadcrumb-${id}`}>
        <ol className="fr-breadcrumb__list">
          {items.map((item: any, index: number) =>
            <li key={index}>
              <Link
                aria-current={index == items.length - 1 ? "page" : undefined}
                aria-label="Vous êtes ici :"
              >
                {item.label}
              </Link>
            </li>
          )}
        </ol>
      </div>
    </nav>
  )
}