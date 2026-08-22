import { useParams } from "react-router-dom";
import SportBetPage from "../components/Sports/SportBetPage";
import { titleOfSportGroup } from "../config/sportsbookGroups";
import { useSportsbookGroups } from "../hooks/useSportsbookGroups";

const SportBetLeagueByKey = () => {
  const { sportKey, leagueKey } = useParams();
  const groups = useSportsbookGroups();
  const league = groups
    .flatMap((group) => group.leagues || [])
    .find((entry) => entry.key === leagueKey);

  return (
    <SportBetPage
      sportKey={sportKey}
      leagueKey={leagueKey}
      title={league?.title || titleOfSportGroup(leagueKey)}
    />
  );
};

export default SportBetLeagueByKey;
