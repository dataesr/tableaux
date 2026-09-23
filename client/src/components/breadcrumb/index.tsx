import { Link, useLocation, useSearchParams } from "react-router-dom";

export default function Breadcrumb({ config }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const shared: boolean = searchParams.has("shared");
  const currentLang = searchParams.get("language") || "fr";
  const currentSection = searchParams.get("section");

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const currentPage = pathSegments[pathSegments.length - 1] || "";
  const parent = pathSegments[pathSegments.length - 2] || "";

  return (
    <nav role="navigation" className="fr-breadcrumb fr-mb-2w" aria-label="vous êtes ici :">
      <button type="button" className="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-1">
        Voir le fil d’Ariane
      </button>
      <div className="fr-collapse" id="breadcrumb-1">
        <ol className="fr-breadcrumb__list">
          {shared && (
            <li>
              <Link className="fr-breadcrumb__link" to={`${config[parent].link}?${searchParams.toString()}`}>
                {currentLang === "fr" ? "Sélectionner un tableau de bord" : "Select a dashboard"}
              </Link>
            </li>
          )}
          <li>
            <Link className="fr-breadcrumb__link" to={`${config[parent].link}?${searchParams.toString()}`}>
              {config[parent].label[currentLang]}
            </Link>
          </li>
          {currentSection ? (
            <>
              <li>
                <Link className="fr-breadcrumb__link" to={`${config[currentPage].link}?${searchParams.toString()}`}>
                  {config[currentPage].label[currentLang]}
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  {config[currentPage][currentSection]?.label[currentLang]}
                </a>
              </li>
            </>
          ) : (
            <li>
              <a className="fr-breadcrumb__link" aria-current="page">
                {config[currentPage].label[currentLang]}
              </a>
            </li>
          )}
        </ol>
      </div>
    </nav>
  );
}
