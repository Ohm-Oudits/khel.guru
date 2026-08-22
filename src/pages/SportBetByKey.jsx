import { useParams } from "react-router-dom";
import SportBetPage from "../components/Sports/SportBetPage";
import { titleOfSportGroup } from "../config/sportsbookGroups";

const titleOf = (sportKey) => titleOfSportGroup(sportKey);

const SportBetByKey = () => {
  const { sportKey } = useParams();
  return <SportBetPage sportKey={sportKey} title={titleOf(sportKey)} />;
};

export default SportBetByKey;
