import { useParams } from "react-router-dom";
import SportLeaguePage from "../components/Sports/SportLeaguePage";
import { titleOfSportGroup } from "../config/sportsbookGroups";
import { useSportsbookGroups } from "../hooks/useSportsbookGroups";

const SportsLeagueByKey = () => {
  const { sportKey, leagueKey } = useParams();
  const groups = useSportsbookGroups();
  const league = groups
    .flatMap((group) => group.leagues || [])
    .find((entry) => entry.key === leagueKey);

  return (
    <SportLeaguePage
      sportKey={sportKey}
      leagueKey={leagueKey}
      title={league?.title || titleOfSportGroup(leagueKey)}
    />
  );
};

export default SportsLeagueByKey;
