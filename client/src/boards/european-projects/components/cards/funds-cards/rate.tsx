import { useId } from "react";
import { formatToRates } from "../../../../../utils/format";
import "./styles.scss";

interface RateCardProps {
  nb: number;
  label: string;
  loading: boolean;
  tooltipText?: string;
  numerator?: string | number;
  denominator?: string | number;
  numeratorLabel?: string;
  denominatorLabel?: string;
}

export default function RateCard({ nb, label, loading, tooltipText, numerator, denominator, numeratorLabel, denominatorLabel }: RateCardProps) {
  const tooltipId = useId();

  return (
    <div className="ep-funds-card rate-card">
      {loading ? (
        <>
          <div className="loader-skeleton loader-number"></div>
          <div className="loader-skeleton loader-label"></div>
          <div className="loader-skeleton loader-bottom-bar"></div>
        </>
      ) : (
        <>
          <div className="card-content">
            <div className="card-header">
              <p className="label">{label}</p>
              {tooltipText && (
                <div className="fr-tooltip__container">
                  <button className="info-button" aria-describedby={tooltipId} type="button">
                    <span className="fr-icon-information-line" aria-hidden="true"></span>
                  </button>
                  <span className="fr-tooltip fr-placement" id={tooltipId} role="tooltip" aria-hidden="true">
                    {tooltipText}
                  </span>
                </div>
              )}
            </div>
            <p className="nb">{formatToRates(nb)}</p>
            {numerator !== undefined && denominator !== undefined && (
              <div className="calculation-details">
                <div className="calculation-item">
                  <span className="calculation-label">{numeratorLabel}</span>
                  <span className="calculation-value">{numerator.toLocaleString()}</span>
                </div>
                <div className="calculation-item">
                  <span className="calculation-label">{denominatorLabel}</span>
                  <span className="calculation-value">{denominator.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bottom-progress-bar">
            <div className="progress-fill" style={{ width: `${nb * 100}%` }}></div>
          </div>
        </>
      )}
    </div>
  );
}
