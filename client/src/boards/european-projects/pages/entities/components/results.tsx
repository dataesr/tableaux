import { Badge } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <nav role="navigation" className="fr-pagination" aria-label="pagination">
      <ul className="fr-pagination__list">
        <li>
          <button className="fr-pagination__link fr-pagination__link--prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <li key={page}>
            <button className={`fr-pagination__link ${currentPage === page ? "fr-pagination__link--current" : ""}`} onClick={() => handlePageChange(page)}>
              {page}
            </button>
          </li>
        ))}
        <li>
          <button className="fr-pagination__link fr-pagination__link--next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default function ResultsWithPagination({ data, isLoading, currentPage, maxResults = 10, onPageChange }) {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const country_code = searchParams.get("country_code") || "FRA";

  const totalPages = Math.ceil(data.length / maxResults) || 1;
  const startIndex = (currentPage - 1) * maxResults;
  const endIndex = startIndex + maxResults;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const url = `/european-projects/horizon-europe?section=synthesis&language=${currentLang}&country_code=${country_code}`;

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {paginatedData.map((entity) => (
              <li key={entity.entities_id} style={{ listStyleType: "none" }} className="fr-mb-1w">
                <a href={`${url}&structureid=${entity.entities_id}`}>{entity.entities_name}</a>
                <Badge color="blue-ecume" className="fr-ml-1w" title="nombre de projets européens associés à cette entité">
                  {entity.count}
                </Badge>
              </li>
            ))}
          </ul>
          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
        </>
      )}
    </div>
  );
}
