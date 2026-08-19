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
  useEffect(
    () =>
      onOddsUpdateHandler((update) => {
        (update.outcomes || []).forEach((outcome) => {
          updateLivePrice(update.marketId, outcome.key, outcome.priceDecimal);
        });
      }),
    [updateLivePrice]
  );

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
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-[#4391E7] px-4 py-3 font-semibold text-white shadow-lg lg:bottom-6"
        >
          <FaReceipt />
          Bet slip
          <span className="rounded-full bg-white/20 px-2 text-sm">
            {items.length}
          </span>
        </button>
      )}

      {/* Panel: right drawer on desktop, bottom sheet on mobile */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-secondry p-4 shadow-2xl max-lg:pb-[90px] lg:inset-x-auto lg:right-4 lg:top-24 lg:bottom-auto lg:max-h-[70vh] lg:w-[340px] lg:rounded-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <FaReceipt className="text-[#4391E7]" />
              Bet slip
            </h2>
            <div className="flex items-center gap-3 text-xs">
              {items.some((item) => item.status === "placed") && (
                <button
                  type="button"
                  onClick={clearPlaced}
                  className="text-gray-400 hover:text-white"
                >
                  Clear placed
                </button>
              )}
              <button
                type="button"
                onClick={toggleOpen}
                className="text-gray-400 hover:text-white"
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

          <p className="mt-3 text-center text-[11px] text-gray-500">
            Single bets · cash wallet · odds may move until placement
          </p>
        </div>
      )}
    </>
  );
};

export default BetSlipPanel;
