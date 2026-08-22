import { useEffect, useState } from "react";
import { FaFootballBall } from "react-icons/fa";
import { apiService } from "../config/api";
import {
  defaultSportsbookGroupCards,
  toSportGroupCard,
} from "../config/sportsbookGroups";

export const useSportsbookGroups = () => {
  const [groups, setGroups] = useState(
    defaultSportsbookGroupCards.map((sport) => ({
      ...sport,
      icon: FaFootballBall,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      apiService.sports
        .getCatalog()
        .then((res) => {
          const sports = res.data?.sports;
          if (cancelled || !Array.isArray(sports) || !sports.length) return;
          if (!sports.some((sport) => sport.sportKey)) return;
          setGroups(
            sports.map((sport) => ({
              ...toSportGroupCard(sport),
              icon: FaFootballBall,
            }))
          );
        })
        .catch(() => {
          // Keep the default prefix cards when catalog is offline.
        });
    };

    load();
    const timer = window.setInterval(load, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return groups;
};
