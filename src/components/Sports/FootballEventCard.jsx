import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../../config/api";
import { hasPublishedScore } from "../../utils/sportsEventStatus";
import {
  drawSelectionOf,
  extraMarketCountOf,
  formatFootballClock,
  isThreeWaySport,
  marketTitleOf,
  selectionForTeam,
} from "../../utils/footballBoard";
import OddsButton from "./OddsButton";

const formatKickoff = (startTime) => {
  if (!startTime) return "";
  const date = new Date(startTime);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const initialsOf = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "•";

const TeamCrest = ({ team, participantId }) => {
  const [failed, setFailed] = useState(false);
  const src =
    participantId && !failed
      ? `${API_CONFIG.BASE_URL}/sports/participants/${participantId}/logo`
      : null;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-5 w-5 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background-surface text-[9px] font-bold text-text-secondary">
      {initialsOf(team?.name)}
    </span>
  );
};

const StatsIcon = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-3.5 w-3.5 text-brand-primary"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M2 12.5V11l3.2-3.2 2.1 2.1L12 5.2V4h2v8.5H2Zm8.6-5.1-3.3 3.3-2.1-2.1L3 10.8V9.4l2.2-2.2 2.1 2.1L12 5.6v1.3L10.6 7.4Z"
    />
  </svg>
);

const ScoreBox = ({ value }) => (
  <span className="flex h-6 min-w-[1.65rem] items-center justify-center rounded-md border border-white/10 bg-background-surface text-sm font-semibold tabular-nums text-text-primary">
    {value}
  </span>
);

const FootballEventCard = ({ event, eventPathBase }) => {
  const navigate = useNavigate();
  const [home, away] = event.competitors || [];
  const scoreboard = event.scoreboard || {};
  const isLive = event.status === "live";
  const isCompleted =
    event.status === "settled" || event.status === "completed";
  const showScore =
    isCompleted ||
    isLive ||
    hasPublishedScore(scoreboard, { cricket: false });

  const isLayMarket = (market) =>
    /_lay$/i.test(String(market?.providerMarketKey || ""));
  const h2hMarket = (event.markets || []).find(
    (market) => market.marketType === "h2h" && !isLayMarket(market)
  );
  const homeSelection = selectionForTeam(h2hMarket, home);
  const awaySelection = selectionForTeam(h2hMarket, away);
  const drawSelection = drawSelectionOf(h2hMarket);
  const extraMarkets = extraMarketCountOf(event, h2hMarket);
  const showDraw = isThreeWaySport(event.sportGroup) || Boolean(drawSelection);
  const marketTitle = marketTitleOf(event.sportGroup, Boolean(drawSelection));
  const finishedLabel = ["football", "futsal", "beachsoccer"].includes(
    event.sportGroup
  )
    ? "FT"
    : "Ended";
  const clockLabel =
    isLive || isCompleted
      ? formatFootballClock(scoreboard.clock || {}, scoreboard.session)
      : "";
  const detailPath = `${
    eventPathBase ||
    `/sports/${event.sportGroup || "football"}/leagues/${
      event.sportKey || event.sportGroup || "football"
    }`
  }/bet?eventId=${event._id}`;

  const openMarkets = (event_) => {
    event_.stopPropagation();
    navigate(detailPath);
  };

  return (
    <article
      className="overflow-hidden border-b border-white/5 bg-background-tertiary px-3 py-2.5 last:border-b-0 sm:px-4"
      onClick={() => navigate(detailPath)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {isLive ? (
                <span className="rounded bg-interactive-error px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
                  Live
                </span>
              ) : isCompleted ? (
                <span className="text-[11px] font-semibold text-text-tertiary">
                  {finishedLabel}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-brand-primary">
                  Upcoming
                </span>
              )}
              {!isLive && !isCompleted ? (
                <span className="text-[12px] tabular-nums text-text-tertiary">
                  {formatKickoff(event.startTime) || "Not yet started"}
                </span>
              ) : clockLabel ? (
                <span className="text-[12px] font-medium tabular-nums text-text-primary">
                  {clockLabel}
                </span>
              ) : null}
              {isLive ? <StatsIcon /> : null}
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <TeamCrest
                  team={home}
                  participantId={event.metadata?.homeId}
                />
                <span className="truncate text-sm font-medium text-text-primary">
                  {home?.name || "Home"}
                </span>
              </div>
              {showScore ? (
                <ScoreBox value={scoreboard.home ?? 0} />
              ) : (
                <span />
              )}
              <div className="flex min-w-0 items-center gap-2">
                <TeamCrest
                  team={away}
                  participantId={event.metadata?.awayId}
                />
                <span className="truncate text-sm font-medium text-text-primary">
                  {away?.name || "Away"}
                </span>
              </div>
              {showScore ? (
                <ScoreBox value={scoreboard.away ?? 0} />
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:max-w-[28rem]">
          <p className="mb-1.5 text-center text-[11px] text-text-tertiary">
            {marketTitle}
          </p>
          <div
            className={`grid gap-1.5 ${
              showDraw ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            {[
              homeSelection || {
                key: "home",
                name: home?.name || "Home",
                priceDecimal: null,
                status: "suspended",
              },
              ...(showDraw
                ? [
                    drawSelection || {
                      key: "draw",
                      name: "Draw",
                      priceDecimal: null,
                      status: "suspended",
                    },
                  ]
                : []),
              awaySelection || {
                key: "away",
                name: away?.name || "Away",
                priceDecimal: null,
                status: "suspended",
              },
            ].map((selection) => (
              <OddsButton
                key={selection.key}
                event={event}
                market={
                  h2hMarket || {
                    _id: `${event._id}-h2h`,
                    title: marketTitle,
                    status: "suspended",
                  }
                }
                selection={selection}
                stacked
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={openMarkets}
          className="shrink-0 self-end text-sm font-semibold text-text-secondary hover:text-brand-primary lg:self-center"
        >
          {extraMarkets > 0 ? `+${extraMarkets}` : "+"}
        </button>
      </div>
    </article>
  );
};

export default FootballEventCard;
