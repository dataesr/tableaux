
import './styles.scss';

export default function ListSkeleton({ nb = 5 }: { nb?: number }) {
  return (
    <ul
      className="fr-grid-row fr-grid-row--gutters"
      role="status"
      aria-label="Chargement de la liste des filières"
    >
      {[...Array(nb)].map((_, i) => (
        <li key={i} className="fr-col-12 fr-col-md-6 fr-col-lg-4">
          <div className="fr-card fr-card--grey filieres-list-skeleton">
            <div className="fr-card__body">
              <div className="fr-card__content">
                <span
                  aria-hidden="true"
                  className="fr-background-contrast--grey filieres-list-skeleton__year"
                />
                <span
                  aria-hidden="true"
                  className="fr-background-contrast--grey filieres-list-skeleton__title"
                />
                <span
                  aria-hidden="true"
                  className="fr-background-contrast--grey filieres-list-skeleton__item"
                />
                <span
                  aria-hidden="true"
                  className="fr-background-contrast--grey filieres-list-skeleton__item"
                />
                <span
                  aria-hidden="true"
                  className="fr-background-contrast--grey filieres-list-skeleton__item"
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}