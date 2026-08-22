export const GAME_LIKES_KEY = "kg.likes.games";
export const SPORT_LIKES_KEY = "kg.likes.sports";

export const formatLikeCount = (count) => {
  const safe = Number.isFinite(Number(count)) ? Number(count) : 0;
  return safe >= 1000 ? `${(safe / 1000).toFixed(1)}K` : String(safe);
};

export const readLikesMap = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return {};
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

export const writeLikesMap = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in unsupported environments.
  }
};

export const likeCountOf = (map, id) => {
  const value = Number(map?.[id]);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const applyLikeToggle = (map, id, isCurrentlyLiked) => ({
  ...map,
  [id]: Math.max(0, likeCountOf(map, id) + (isCurrentlyLiked ? -1 : 1)),
});
