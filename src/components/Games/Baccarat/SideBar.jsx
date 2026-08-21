import { useRef } from "react";
const SideBar = ({
  chipBet,
  setChipBet,
  bettingStarted,
  betLocked,
  handleBet,
}) => {
  const chipContainerRef = useRef(null);
  const chipValues = ["20", "30", "50", "100", "200", "500", "1K", "5K"];

  const parseChipValue = (chip) => {
    const suffixes = { K: 1e3, M: 1e6 };
    const match = chip.match(/^(\d+)([KM]?)$/);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const suffix = match[2];
    return num * (suffixes[suffix] || 1);
  };

  const handleScroll = (direction) => {
    if (chipContainerRef.current) {
      const scrollAmount = 200;
      chipContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <div
        className={`order-2 col-span-12 flex h-full flex-col overflow-auto border-[#1a2c38] bg-inactive max-md:border-t md:order-1 md:col-span-4 md:border-r md:border-t-0 xl:col-span-3`}
      >
        <div className="flex h-full flex-col px-3 py-3 md:py-4">
          <>
            {/* Chip Selector */}
            <div className="mb-4">
              <span className="flex">
                <h3 className="text-sm font-semibold mb-1">Chip Value</h3>
                <h1 className="text-sm ml-auto">
                  ${Number(chipBet).toLocaleString()}
                </h1>
                {/* Display selected chip */}
              </span>

              <div className="flex items-center bg-gray-800 rounded-lg p-2 gap-2">
                {/* Scroll Left Button */}
                <button
                  onClick={() => handleScroll("left")}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ◀
                </button>

                {/* Chip Buttons */}
                <div
                  ref={chipContainerRef}
                  className="flex flex-1 overflow-x-auto gap-2 scrollbar-hide"
                >
                  {chipValues.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setChipBet(parseChipValue(chip))} // Updates chipBet when clicked
                      className={`flex-shrink-0 relative w-10 h-10 flex items-center justify-center rounded-full shadow-md border-2 
            ${
              chipBet === parseChipValue(chip)
                ? "bg-yellow-600 border-yellow-800"
                : "bg-yellow-500 border-yellow-600"
            }
            hover:bg-yellow-400 transition-colors`}
                    >
                      <span className="text-black font-bold text-xs">
                        {chip}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Scroll Right Button */}
                <button
                  onClick={() => handleScroll("right")}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>

            {bettingStarted ? (
              <div className="order-2 mt-3 mb-2 flex w-full cursor-default items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black opacity-70 md:order-last">
                Dealing
              </div>
            ) : (
              <button
                type="button"
                disabled={betLocked}
                className="order-2 mt-3 mb-2 flex w-full items-center justify-center rounded-[1rem] bg-button-primary py-2.5 text-[0.98rem] font-semibold text-black transition-all duration-300 ease-out enabled:cursor-pointer enabled:active:scale-90 disabled:cursor-not-allowed disabled:opacity-60 md:order-last"
                onClick={handleBet}
              >
                Place Bet
              </button>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default SideBar;
