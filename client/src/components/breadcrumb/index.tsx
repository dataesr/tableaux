import { Link } from "@dataesr/dsfr-plus";
import { useLocation, useSearchParams } from "react-router-dom";

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
      <button className="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-1">
        Voir le fil d’Ariane
      </button>
      <div className="fr-collapse" id="breadcrumb-1">
        <ol className="fr-breadcrumb__list">
          {shared && (
            <li>
              <Link href={`${config[parent].link}?${searchParams.toString()}`}>
                {currentLang === "fr" ? "Sélectionner un tableau de bord" : "Select a dashboard"}
              </Link>
            </li>
          )}
          <li>
            <Link href={`${config[parent].link}?${searchParams.toString()}`}>{config[parent].label[currentLang]}</Link>
          </li>
          {currentSection ? (
            <>
              <li>
                <Link href={`${config[currentPage].link}?${searchParams.toString()}`}>{config[currentPage].label[currentLang]}</Link>
              </li>
              <li>
                <Link>
                  <strong>{config[currentPage][currentSection]?.label[currentLang]}</strong>
                </Link>
              </li>
            </>
          ) : (
            <li>
              <Link>
                <strong>{config[currentPage].label[currentLang]}</strong>
              </Link>
            </li>
          )}
        </ol>
      </div>
    </nav>
  );
}
