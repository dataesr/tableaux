// « 1er sur 24 pays », « 6e sur 24 pays » ; sans rang : hors classement
export function formatRang(rang: number | null, nb: number, ensemble: string): string {
  if (rang === null) return "hors classement";
  return `${rang === 1 ? "1er" : `${rang}e`} sur ${nb} ${ensemble}`;
}
