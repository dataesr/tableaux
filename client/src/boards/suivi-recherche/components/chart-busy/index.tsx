import type { ReactNode } from "react";

import "./styles.scss";

type ChartBusyProps = {
  busy: boolean;
  children: ReactNode;
  label?: string;
};

// Grise un graphique (ou un bloc de résultats) pendant un appel API ou un redessin,
// pour qu'un affichage périmé ne soit jamais pris pour le résultat de la sélection courante
export default function ChartBusy({ busy, children, label = "Mise à jour…" }: ChartBusyProps) {
  return (
    <div aria-busy={busy || undefined} className={`sr-chart-busy${busy ? " sr-chart-busy--active" : ""}`}>
      {children}
      {busy && (
        <div className="sr-chart-busy__overlay">
          <span aria-hidden="true" className="sr-chart-busy__spinner" />
          <span className="fr-text--bold" role="status">{label}</span>
        </div>
      )}
    </div>
  );
}
