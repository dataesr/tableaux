import ErcMainEntities from "../../charts/main-entities";
import ErcDomainPanelEntities from "../../charts/domain-panel-entities";

export default function EntitiesContent() {
  return (
    <div>
      <div className="fr-my-5w">
        <ErcMainEntities />
      </div>
      <div className="fr-my-5w">
        <ErcDomainPanelEntities />
      </div>
    </div>
  );
}
