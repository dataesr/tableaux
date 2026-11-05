import { useEffect, useState } from "react";

// Applique une nouvelle valeur d'affichage (données, indicateur…) en laissant d'abord le navigateur peindre le grisé.
// Le redessin Highcharts est synchrone (HighchartsReact met à jour le graphique dans un useLayoutEffect) :
// sans ce délai, la page se figerait sans aucune indication pendant le redessin.
//   1. `value` change : `busy` passe à true, le grisé est peint (deux images d'attente) ;
//   2. `applied` reçoit la valeur : le graphique est redessiné dans le même rendu, toujours grisé ;
//   3. à l'image suivante, `settled` rattrape `applied` et le grisé disparaît sur le graphique à jour.
export function useRenderTransition<T>(value: T): { applied: T; busy: boolean } {
  const [applied, setApplied] = useState(value);
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    if (Object.is(applied, value)) return undefined;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setApplied(value));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [applied, value]);

  useEffect(() => {
    if (Object.is(settled, applied)) return undefined;
    const frame = requestAnimationFrame(() => setSettled(applied));
    return () => cancelAnimationFrame(frame);
  }, [applied, settled]);

  return { applied, busy: !Object.is(value, applied) || !Object.is(applied, settled) };
}
