import { create } from "zustand";

const itemId = (marketId, selectionKey) => `${marketId}:${selectionKey}`;

// Single bets only: every slip item carries its own stake and lifecycle.
// status: idle | placing | placed | price_changed | error
const useBetSlipStore = create((set, get) => ({
  items: [],
  isOpen: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),

  addSelection: ({
    eventId,
    marketId,
    selectionKey,
    selectionName,
    line,
    priceDecimal,
    eventName,
    marketTitle,
  }) => {
    const id = itemId(marketId, selectionKey);
    const existing = get().items.find((item) => item.id === id);

    if (existing) {
      // Toggle off when the same selection is tapped again.
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
      return;
    }

    set((state) => ({
      isOpen: true,
      items: [
        ...state.items,
        {
          id,
          eventId,
          marketId,
          selectionKey,
          selectionName,
          line: line ?? null,
          priceDecimal,
          eventName,
          marketTitle,
          stake: "",
          status: "idle",
          newPrice: null,
          error: null,
          betId: null,
        },
      ],
    }));
  },

  removeSelection: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setStake: (id, stake) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, stake, status: "idle", error: null } : item
      ),
    })),

  setPlacing: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: "placing", error: null } : item
      ),
    })),

  // Live feed drift: keep slip prices honest while the user hesitates.
  updateLivePrice: (marketId, selectionKey, priceDecimal) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.marketId === marketId &&
        item.selectionKey === selectionKey &&
        item.status !== "placed"
          ? { ...item, priceDecimal }
          : item
      ),
    })),

  applyPriceChange: (id, newPrice) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: "price_changed", newPrice } : item
      ),
    })),

  acceptNewPrice: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id && item.newPrice
          ? {
              ...item,
              priceDecimal: item.newPrice,
              newPrice: null,
              status: "idle",
            }
          : item
      ),
    })),

  markPlaced: (id, betId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: "placed", betId } : item
      ),
    })),

  markError: (id, error) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: "error", error } : item
      ),
    })),

  clearPlaced: () =>
    set((state) => ({
      items: state.items.filter((item) => item.status !== "placed"),
    })),

  isSelected: (marketId, selectionKey) =>
    get().items.some((item) => item.id === itemId(marketId, selectionKey)),
}));

export default useBetSlipStore;
