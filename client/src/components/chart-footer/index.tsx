import { Link } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

import { getI18nLabel } from "../../utils";
import i18n from "./i18n.json";

interface LocalizedContent {
  en?: React.JSX.Element;
  fr: React.JSX.Element;
}

interface LocalizedUrl {
  en?: string;
  fr: string;
}

interface Source {
  label: LocalizedContent;
  update?: Date;
  url: LocalizedUrl;
}

interface ChartFooterProps {
  comment?: LocalizedContent;
  readingKey?: LocalizedContent;
  sources?: Source[];
}

/**
 * Composant ChartFooter - Affiche un pied de graphique avec commentaires, clé de lecture et sources
 *
 * @example
 * ```tsx
 * <ChartFooter
 *   comment={{
 *     fr: <div>Ce graphique montre l'évolution des données sur 5 ans</div>
 *   }}
 *   // 'en' est maintenant optionnel
 * />
 * ```
 */
export default function ChartFooter({
  comment,
  readingKey,
  sources,
}: ChartFooterProps) {
  const [searchParams] = useSearchParams();
  const currentLang = (searchParams.get("language") || "fr") as "fr" | "en";

  if (!comment && !readingKey && !sources) {
    return null;
  }

  return (
    <div className="chart-footer">
      {comment && (
        <>
          <b>{getI18nLabel(i18n, "comment")} </b>
          {comment[currentLang] || comment.fr}
        </>
      )}

      {readingKey && (
        <div>
          <b>{getI18nLabel(i18n, "readingKey")} </b>
          {readingKey[currentLang] || readingKey.fr}
        </div>
      )}

      {(sources && sources.length > 0) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #ccc",
            marginTop: "10px",
            paddingTop: "10px",
          }}
        >
          <div>
            <b>{getI18nLabel(i18n, "sources")} </b>
            {sources.map((source, index) => (
              <span key={`graph-footer-source-${index}`}>
                <Link href={source.url[currentLang] || source.url.fr} target="_blank" rel="noopener noreferrer">
                  {source.label[currentLang] || source.label.fr}
                </Link>
                {(source?.update) && (
                  <>
                    {' '}
                    <i>(<b>{getI18nLabel(i18n, "update")}</b> {source.update.toLocaleDateString(currentLang === "fr" ? "fr-FR" : "en-US")})</i>
                  </>
                )}
                {(index < sources.length - 1) && (<span>, </span>)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}