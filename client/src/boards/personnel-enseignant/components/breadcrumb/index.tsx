import { Link } from "@dataesr/dsfr-plus";

export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
    return (
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
            <button className="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-fm">
                Voir le fil d'Ariane
            </button>
            <div className="fr-collapse" id="breadcrumb-fm">
                <ol className="fr-breadcrumb__list">
                    {items.map((item, index) =>
                        index === items.length - 1 ? (
                            <li key={index}>
                                <Link><strong>{item.label}</strong></Link>
                            </li>
                        ) : (
                            <li key={index}>
                                <Link href={item.href}>{item.label}</Link>
                            </li>
                        )
                    )}
                </ol>
            </div>
        </nav>
    );
}
