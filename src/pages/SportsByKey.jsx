import { useParams } from "react-router-dom";
import SportHome from "../components/Sports/SportHome";
import { titleOfSportGroup } from "../config/sportsbookGroups";

const titleOf = (sportKey) => titleOfSportGroup(sportKey);

const SportsByKey = () => {
  const { sportKey } = useParams();
  return <SportHome sportKey={sportKey} title={titleOf(sportKey)} />;
};

export default SportsByKey;
