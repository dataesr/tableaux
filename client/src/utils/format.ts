export const formatToMillions = (amount: number, precision = 1): string => {
  const millions = amount / 1_000_000;
  return `${millions.toFixed(precision)} M€`;
};

export const formatToThousands = (amount: number): string => {
  const thousands = amount / 1_000;
  return `${thousands.toFixed(1)} K€`;
};

export const formatToPercent = (amount: number): string => {
  return `${amount.toFixed(1)} %`;
};

export const formatToEuro = (amount: number): string => {
  return `${amount.toFixed(0)} €`;
};

export const formatToRates = (value: number): string => {
  return `${(value * 100).toFixed(1)} %`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString("fr-FR");
};

export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} Md€`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M€`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)} K€`;
  }
  return `${amount.toFixed(0)} €`;
};

export const formatCurrency_en = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `€${(amount / 1_000_000_000).toFixed(2)} billion`;
  }
  if (amount >= 1_000_000) {
    return `€${(amount / 1_000_000).toFixed(1)} million`;
  }
  if (amount >= 1_000) {
    return `€${(amount / 1_000).toFixed(1)} thousand`;
  }
  return `€${amount.toFixed(0)}`;
}

export function capitalize(word: string) {
  return String(word).charAt(0).toUpperCase() + String(word).slice(1);
}

export const parseMarkdown = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
};
