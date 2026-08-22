import { resolveSportGroup } from "../config/sportsbookGroups";

export const isCompletedEvent = (event = {}) =>
  event.status === "settled" || event.status === "completed";

export const completedAtOf = (event = {}) =>
  event.metadata?.settledAt || event.updatedAt || event.startTime;

export const isSameLocalDay = (value, now = new Date()) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === now.toDateString();
};

export const isSameDayCompleted = (event, now = new Date()) =>
  isCompletedEvent(event) && isSameLocalDay(completedAtOf(event), now);

export const isCompletedWithinHours = (event, hours = 24, now = new Date()) => {
  if (!isCompletedEvent(event)) return false;
  const at = new Date(completedAtOf(event) || "");
  if (Number.isNaN(at.getTime())) return false;
  return now.getTime() - at.getTime() <= hours * 60 * 60 * 1000;
};

export const isTestMatch = (event = {}) =>
  event.sportKey === "cricket_test_match" ||
  /test/i.test(event.leagueName || "") ||
  /test/i.test(event.scoreboard?.title || "");

export const hasPublishedScore = (scoreboard = {}, { cricket = false } = {}) => {
  if (scoreboard.stumps === true || scoreboard.completed === true) return true;
  if (scoreboard.periods && Object.keys(scoreboard.periods).length > 0) {
    return true;
  }
  const home = scoreboard.home;
  const away = scoreboard.away;
  if (home == null && away == null) return false;
  if (cricket && Number(home) === 0 && Number(away) === 0) return false;
  return home != null || away != null;
};

export const isStumpsEvent = (event = {}) => {
  if (isCompletedEvent(event)) return false;
  const scoreboard = event.scoreboard || {};
  const flagged =
    scoreboard.stumps === true ||
    /^stumps$/i.test(String(scoreboard.session || "")) ||
    /\bstumps\b/i.test(scoreboard.note || "");
  if (!flagged) return false;
  return event.sportGroup === "cricket" && isTestMatch(event);
};

export const bucketSportsEvents = (events = [], now = new Date()) => {
  const live = [];
  const stumps = [];
  const upcoming = [];
  const completed = [];

  for (const event of events) {
    if (isStumpsEvent(event) && event.status === "live") stumps.push(event);
    else if (event.status === "live") live.push(event);
    else if (event.status === "upcoming") upcoming.push(event);
    else if (isCompletedWithinHours(event, 24, now)) completed.push(event);
  }

  completed.sort(
    (left, right) =>
      new Date(completedAtOf(right) || 0).getTime() -
      new Date(completedAtOf(left) || 0).getTime()
  );

  return { live, stumps, upcoming, completed };
};

export const countLiveBySportGroup = (events = []) => {
  const counts = {};
  for (const event of events) {
    if (event.status !== "live") continue;
    const key = resolveSportGroup(event.sportGroup || event.sportKey);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};
