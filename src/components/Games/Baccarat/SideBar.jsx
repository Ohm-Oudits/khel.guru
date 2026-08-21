import { useState, useRef } from "react";
const SideBar = ({
  theatreMode,
  setBetMode,
  betMode,
  bet,
  setBet,
  chipBet,
  setChipBet,
  maxBetEnable,
  bettingStarted,
  handleBet,
  handleCheckout,
  totalBet,
}) => {
  const chipContainerRef = useRef(null);
  const chipValues = [
    "1",
    "10",
    "100",
    "1K",
    "10K",
    "100K",
    "1M",
    "10M",
    "100M",
  ];

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
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-4 px-3 flex flex-col">
          {/* Manual and auto  */}
          <div className="sticky top-0 z-[1] bg-inactive py-0 rounded-md">
            <div className="order-[100] max-lg:mt-2 lg:order-1 switch mb-4 w-full bg-primary rounded-full p-1.5 grid grid-cols-1 gap-1">
              <div
                onClick={() => setBetMode("manual")}
                className={`${
                  betMode === "manual" ? "bg-inactive scale-95" : ""
                } cursor-pointer col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Manual
              </div>
            </div>
          </div>

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

            <div className="order-1 md:order-2 my-2 w-full">
              <div className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label">
                <label htmlFor="betAmount">Bet Amount</label>
              </div>

              <div className="w-full mt-1 bg-inactive shadow-md flex rounded">
                <div className="w-full relative">
                  <input
                    type="text"
                    value={totalBet.toFixed(2)}
                    id="betAmount"
                    readOnly
                    //  onChange={(e) => {
                    //    const inputValue = e.target.value;
                    //    if (/^\d*\.?\d*$/.test(inputValue)) { // Allow only numbers and decimals
                    //      setBet(inputValue);
                    //  }
                    // }}
                    className="w-full h-full rounded bg-secondry outline-none text-white px-2 pr-6 border border-inactive hover:border-primary-4"
                  />
                  <div className="absolute top-1.5 right-2"></div>
                </div>
                <div className="cursor-pointer hover:bg-activeHover inline-flex relative items-center gap-2 justify-center rounded-sm font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-grey-400 text-white hover:bg-grey-300 hover:text-white focus-visible:outline-white text-sm leading-none py-[0.8125rem] px-[1rem] shadow-none">
                  1/2
                </div>
                <div className="cursor-pointer hover:bg-activeHover inline-flex relative items-center gap-2 justify-center rounded-sm font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-grey-400 text-white hover:bg-grey-300 hover:text-white focus-visible:outline-white text-sm leading-none py-[0.8125rem] px-[1rem] shadow-none">
                  2x
                </div>
                {maxBetEnable && (
                  <div className="cursor-pointer hover:bg-activeHover inline-flex relative items-center gap-2 justify-center rounded-sm font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-grey-400 text-white hover:bg-grey-300 hover:text-white focus-visible:outline-white text-sm leading-none py-[0.8125rem] px-[1rem] shadow-none">
                    Max
                  </div>
                )}
              </div>
            </div>

            {bettingStarted && (
              <div
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform active:scale-90 flex items-center justify-center w-full mx-auto py-1.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold bg-button-primary text-black cursor-pointer`}
                // onClick={handleCheckout}
              >
                Checkout
              </div>
            )}

            {/* Bet button */}
            {!bettingStarted && (
              <div
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform active:scale-90 flex items-center justify-center w-full mx-auto py-1.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold bg-button-primary text-black cursor-pointer`}
                onClick={handleBet}
              >
                Bet
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default SideBar;
