// import FundingRanking from "../../../positioning/charts/funding-ranking";
import BoardsSuggestComponent from "../../../../../../components/boards-suggest-component";
import FundingRankingCoordination from "../../../positioning/charts/funding-ranking/coordination";
import FundingRankingParticipations from "../../../positioning/charts/funding-ranking/participations";
import FundingRankingRates from "../../../positioning/charts/funding-ranking/rates";
import FundingRankingSubsidies from "../../../positioning/charts/funding-ranking/subsidies";
import Intro from "../../../positioning/charts/intro";
import Top10Beneficiaries from "../../../positioning/charts/top-10-beneficiaries";

export default function PositionnementContent() {
  return (
    <div className="fr-pb-3w">
      <Intro /> {/** TODO: Permettre l'intégration comme pour le chartWrapper */}
      <Top10Beneficiaries />
      <FundingRankingRates />
      <FundingRankingSubsidies />
      <FundingRankingParticipations />
      <FundingRankingCoordination />
      <BoardsSuggestComponent />
    </div>
  );
}
