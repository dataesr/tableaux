import ErcGenderByDestination from "../../charts/gender-by-destination";
import ErcGenderEvolution from "../../charts/gender-evolution";
import ErcGenderByDomain from "../../charts/gender-by-domain";

export default function PiContent() {
  return (
    <div>
      <div className="fr-my-5w">
        <ErcGenderByDestination />
      </div>
      <div className="fr-my-5w">
        <ErcGenderEvolution />
      </div>
      <div className="fr-my-5w">
        <ErcGenderByDomain />
      </div>
    </div>
  );
}
