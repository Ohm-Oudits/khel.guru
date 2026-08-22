import { useEffect } from "react";
import { FaReceipt } from "react-icons/fa";
import { toast } from "react-toastify";
import { apiService } from "../../../config/api";
import { onOddsUpdateHandler } from "../../../socket/sports";
import useBetSlipStore from "../../../store/betSlipStore";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import BetSlipItem from "./BetSlipItem";

const BetSlipPanel = () => {
  const items = useBetSlipStore((state) => state.items);
  const isOpen = useBetSlipStore((state) => state.isOpen);
  const toggleOpen = useBetSlipStore((state) => state.toggleOpen);
  const updateLivePrice = useBetSlipStore((state) => state.updateLivePrice);
  const setPlacing = useBetSlipStore((state) => state.setPlacing);
  const applyPriceChange = useBetSlipStore((state) => state.applyPriceChange);
  const markPlaced = useBetSlipStore((state) => state.markPlaced);
  const markError = useBetSlipStore((state) => state.markError);
  const clearPlaced = useBetSlipStore((state) => state.clearPlaced);

  // Slip prices track the live feed while the user hesitates.
  // HTTP is the source of truth so a late socket cannot freeze an old price.
  useEffect(
    () =>
      onOddsUpdateHandler((update) => {
        (update.outcomes || []).forEach((outcome) => {
          updateLivePrice(update.marketId, outcome.key, outcome.priceDecimal);
        });
      }),
    [updateLivePrice]
  );

  useEffect(() => {
    if (!items.length) return undefined;
    const eventIds = [...new Set(items.map((item) => item.eventId).filter(Boolean))];
    let cancelled = false;
    const refresh = async () => {
      for (const eventId of eventIds) {
        try {
          const res = await apiService.sports.getEvent(eventId);
          if (cancelled) return;
          for (const market of res.data?.markets || []) {
            for (const selection of market.selections || []) {
              if (selection.priceDecimal == null) continue;
              updateLivePrice(market._id, selection.key, selection.priceDecimal);
            }
          }
        } catch {
          // Keep the last slip price if a quiet poll fails.
        }
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [items, updateLivePrice]);

  const placeBet = async (item) => {
    const stake = Number(item.stake);
    if (!Number.isFinite(stake) || stake <= 0) return;

    setPlacing(item.id);
    try {
      const res = await apiService.sports.placeBet({
        eventId: item.eventId,
        marketId: item.marketId,
        selectionKey: item.selectionKey,
        stake,
        expectedPrice: item.priceDecimal,
        acceptBetterOdds: true,
        walletType: "cash",
      });
      markPlaced(item.id, res.data?.bet?._id || null);
      toast.success("Bet placed successfully");
      requestWalletRefresh();
    } catch (error) {
      const data = error.response?.data;
      if (error.response?.status === 409 && data?.currentPrice) {
        applyPriceChange(item.id, data.currentPrice);
      } else {
        markError(item.id, data?.message || "Could not place bet");
      }
    }
  };

  if (!items.length) {
    return null;
  }

  return (
    <>
      {/* Collapsed pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleOpen}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 font-semibold text-text-inverse shadow-lg lg:bottom-6"
        >
          <FaReceipt />
          Bet slip
          <span className="rounded-full bg-black/20 px-2 text-sm">
            {items.length}
          </span>
        </button>
      )}

      {/* Panel: right drawer on desktop, bottom sheet on mobile */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-white/5 bg-background-tertiary p-4 shadow-2xl max-lg:pb-[90px] lg:inset-x-auto lg:right-4 lg:top-24 lg:bottom-auto lg:max-h-[70vh] lg:w-[340px] lg:rounded-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <FaReceipt className="text-brand-primary" />
              Bet slip
            </h2>
            <div className="flex items-center gap-3 text-xs">
              {items.some((item) => item.status === "placed") && (
                <button
                  type="button"
                  onClick={clearPlaced}
                  className="text-text-tertiary hover:text-white"
                >
                  Clear placed
                </button>
              )}
              <button
                type="button"
                onClick={toggleOpen}
                className="text-text-tertiary hover:text-white"
              >
                Minimize
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <BetSlipItem key={item.id} item={item} onPlace={placeBet} />
            ))}
          </div>

          <p className="mt-3 text-center text-[11px] text-text-muted">
            Single bets · cash wallet · odds may move until placement
          </p>
        </div>
      )}
    </>
  );
};

export default BetSlipPanel;
