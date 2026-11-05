import { ENTITE_NATIONALE } from "../../../hooks/use-selection";
import DoubleCompte from "../components/double-compte/index.tsx";
import Dispositifs from "../components/dispositifs/index.tsx";
import { useFinancements } from "../context.ts";
import ErcProfil from "./erc.tsx";
import PrixProfil from "./prix.tsx";

// « Où en est la France ou l'établissement sélectionné ? » : un bloc par dispositif (ERC, ANR, prix et distinctions)
export default function ProfilSection() {
  const { selection } = useFinancements();
  return (
    <>
      {selection.entiteId !== ENTITE_NATIONALE && <DoubleCompte />}
      <Dispositifs contenus={{ erc: { bloc: <ErcProfil /> }, anr: { enPreparation: true }, prix: { bloc: <PrixProfil /> } }} />
    </>
  );
}
