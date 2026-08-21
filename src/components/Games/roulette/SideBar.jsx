/* eslint-disable react/prop-types */
import { ChipSelector } from "./comp/ChipSelector";

const SideBar = ({
  theatreMode,
  setBetMode,
  betMode,
  maxBetEnable,
  nbets,
  setNbets,
  profit,
  setProfit,
  loss,
  setLoss,
  bettingStarted,
  handleBetstarted,
  handleAutoBet,
  startAutoBet,
  isSocketReady,
  isGameJoined,
  isDisabled,
  isProcessing,
  currentBets,
  chipBet,
  setChipBet,
}) => {
  const isConnected = isSocketReady && isGameJoined;

  // Calculate total current bet amount
  const currentTotalBet = Object.values(currentBets).reduce(
    (sum, amount) => sum + parseFloat(amount),
    0
  );

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 order-2 max-lg:h-[fit-content] lg:h-[600px] min-w-0 overflow-auto bg-inactive`}
      >
        <div className="my-4 px-3 flex flex-col">
          {/* Manual and auto  */}
          <div className="sticky top-0 z-[1] bg-inactive py-0 rounded-md">
            <div className="order-[100] max-lg:mt-2 lg:order-1 switch mb-4 w-full bg-primary rounded-full p-1.5 grid grid-cols-2 gap-1">
              <div
                onClick={() => {
                  if (!startAutoBet && isConnected && !isDisabled) {
                    setBetMode("manual");
                  }
                }}
                className={`${
                  betMode === "manual" ? "bg-inactive scale-95" : ""
                } ${
                  !isConnected || isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-activeHover cursor-pointer"
                } col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Manual
              </div>
              <div
                onClick={() => {
                  if (!bettingStarted && isConnected && !isDisabled) {
                    setBetMode("auto");
                  }
                }}
                className={`${
                  betMode === "auto" ? "bg-inactive scale-95" : ""
                } ${
                  !isConnected || isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-activeHover cursor-pointer"
                } col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Auto
              </div>
            </div>
          </div>

          <ChipSelector
            chipBet={chipBet}
            setChipBet={setChipBet}
            disabled={!isConnected || isDisabled}
          />

          {betMode === "manual" && (
            <>
              <div className="order-1 md:order-2 my-2 w-full">
                <div className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label">
                  <label htmlFor="tableTotal">Table Total</label>
                  <h1 className="text-sm">${currentTotalBet.toLocaleString()}</h1>
                </div>
              </div>

              {/* Bet button */}
              <button
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform flex items-center justify-center w-full mx-auto py-1.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold text-black ${
                  !isConnected || isDisabled
                    ? "bg-gray-600 cursor-not-allowed"
                    : bettingStarted
                    ? "bg-primary text-white cursor-text"
                    : "bg-button-primary active:scale-90 cursor-pointer"
                }`}
                onClick={handleBetstarted}
                disabled={!isConnected || bettingStarted || isDisabled}
              >
                {!isConnected
                  ? "Connecting..."
                  : isDisabled
                  ? "Spinning..."
                  : "Bet"}
              </button>
            </>
          )}

          {betMode === "auto" && (
            <>
              <div className="order-1 md:order-2 my-2 w-full">
                <div className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label">
                  <label htmlFor="tableTotal">Table Total</label>
                  <h1 className="text-sm">${currentTotalBet.toLocaleString()}</h1>
                </div>
              </div>

              {/* Number of bets */}
              <div className="w-full mb-1 order-10 md:order-2">
                <div className="flex items-center justify-between">
                  <h1 className="font-semibold mt-1 text-label">
                    Number of Bets
                  </h1>
                  <h1 className="text-sm text-label">
                    Total: ${(currentTotalBet * nbets).toFixed(6)}
                  </h1>
                </div>
                <input
                  type="number"
                  value={nbets}
                  disabled={!isConnected || startAutoBet || isDisabled}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setNbets("");
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue)) {
                        setNbets(numValue);
                      }
                    }
                  }}
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border ${
                    !isConnected || isDisabled
                      ? "border-gray-600 opacity-50"
                      : "border-input hover:border-primary-4"
                  }`}
                />
              </div>

              {/* <div className="order-10 md:order-2 mb-2 mt-1 w-full flex items-center gap-3">
                <div className="w-full">
                  <label
                    htmlFor="Difficulty"
                    className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
                  >
                    <h1>Risk</h1>
                  </label>
                  <div className="relative w-full">
                    <button
                      className="w-full mt-2  h-full flex justify-between  rounded-md bg-black p-3 text-white px-3 pr-6 py-2 border border-input hover:border-primary-4"
                      onClick={() => setIsOpen(!isOpen)}
                      disabled={bettingStarted}
                    >
                      {options.find((opt) => opt.value === Difficulty)?.label ||
                        "Select Difficulty"}
                    </button>

                    {isOpen && (
                      <div className="absolute z-10 mt-2 w-full bg-black border border-primary-4 rounded-md shadow-lg">
                        {options.map((opt) => (
                          <div
                            key={opt.value}
                            className="flex items-center text-[0.88rem] justify-between p-3 hover:bg-primary-4 cursor-pointer text-white"
                            onClick={() => handleSelect(opt.value)}
                          >
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div> */}

              {/* On Win */}
              {/* <div className="order-10 md:order-2 py-3 w-full">
                <h1 className="font-semibold text-label text-sm mb-[-4px] pl-[2px]">
                  On Win
                </h1>
                <div className="flex mt-2 bg-inactive rounded p-0.5 pb-[0.20rem]">
                  <div
                    onClick={() => {
                      setOnWin(0);
                      setOnWinReset(true);
                    }}
                    className={`text-sm ${
                      onWinReset ? "bg-primary" : "hover:bg-inactive"
                    } font-semibold w-[50px] rounded cursor-pointer p-2 flex items-center justify-center text-white transition-all duration-300 ease-in-out transform active:scale-90`}
                  >
                    Reset
                  </div>
                  <div
                    onClick={() => setOnWinReset(false)}
                    className={`text-sm cursor-pointer font-semibold w-[190px] mr-1 ${
                      onWinReset ? "hover:bg-primary-4" : "bg-primary-1"
                    } rounded p-2 flex  items-center justify-center text-white transition-all duration-300 ease-in-out transform active:scale-90`}
                  >
                    Increase by :
                  </div>
                  <div className="w-full relative">
                    <input
                      type="number"
                      value={onWin}
                      disabled={onWinReset}
                      onChange={(e) => setOnWin(e.target.value)}
                      className={`w-full rounded ${
                        onWinReset
                          ? "bg-input border-primary-4"
                          : "bg-primary-1 border-input"
                      } outline-none text-white px-2 pr-6 py-2 border hover:border-primary-4`}
                    />
                    <div className="absolute top-1.5 right-2 text-gray-500">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 64 64"
                        className="svg-icon "
                      >
                        {" "}
                        <title></title>{" "}
                        <path d="M18.38 29.904c6.364 0 11.524-5.16 11.524-11.524 0-6.364-5.16-11.524-11.524-11.524-6.364 0-11.525 5.16-11.525 11.524 0 6.364 5.16 11.524 11.524 11.524Zm0-14.666a3.142 3.142 0 1 1-.001 6.285 3.142 3.142 0 0 1 0-6.285Zm27.24 18.858c-6.364 0-11.524 5.16-11.524 11.524 0 6.364 5.16 11.524 11.524 11.524 6.364 0 11.524-5.16 11.524-11.524 0-6.364-5.16-11.524-11.524-11.524Zm0 14.666a3.142 3.142 0 1 1 0-6.285 3.142 3.142 0 0 1 0 6.285Zm.585-41.904L6.857 57.144h10.644L56.85 6.858H46.205Z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* On Loss */}
              {/* <div className="order-10 md:order-2 py-0 w-full">
                <h1 className="font-semibold text-label text-sm mb-[-4px] pl-[2px]">
                  On Loss
                </h1>
                <div className="flex mt-2 bg-input rounded p-0.5 pb-[0.20rem]">
                  <div
                    onClick={() => {
                      setOnLoss(0);
                      setOnLossReset(true);
                    }}
                    className={`text-sm ${
                      onLossReset ? "bg-primary-1" : "hover:bg-primary-4"
                    } font-semibold w-[50px] rounded cursor-pointer p-2 flex items-center justify-center text-white transition-all duration-300 ease-in-out transform active:scale-90`}
                  >
                    Reset
                  </div>
                  <div
                    onClick={() => setOnLossReset(false)}
                    className={`text-sm cursor-pointer font-semibold w-[190px] mr-1 ${
                      onLossReset ? "hover:bg-primary-4" : "bg-primary-1"
                    } rounded p-2 flex  items-center justify-center text-white transition-all duration-300 ease-in-out transform active:scale-90`}
                  >
                    Increase by :
                  </div>
                  <div className="w-full relative">
                    <input
                      type="number"
                      value={onLoss}
                      disabled={onLossReset}
                      onChange={(e) => setOnLoss(e.target.value)}
                      className={`w-full rounded ${
                        onLossReset
                          ? "bg-input border-primary-4"
                          : "bg-primary-1 border-input"
                      } outline-none text-white px-2 pr-6 py-2 border hover:border-primary-4`}
                    />
                    <div className="absolute top-1.5 right-2 text-gray-500">
                      <svg
                        fill="currentColor"
                        viewBox="0 0 64 64"
                        className="svg-icon "
                      >
                        {" "}
                        <title></title>{" "}
                        <path d="M18.38 29.904c6.364 0 11.524-5.16 11.524-11.524 0-6.364-5.16-11.524-11.524-11.524-6.364 0-11.525 5.16-11.525 11.524 0 6.364 5.16 11.524 11.524 11.524Zm0-14.666a3.142 3.142 0 1 1-.001 6.285 3.142 3.142 0 0 1 0-6.285Zm27.24 18.858c-6.364 0-11.524 5.16-11.524 11.524 0 6.364 5.16 11.524 11.524 11.524 6.364 0 11.524-5.16 11.524-11.524 0-6.364-5.16-11.524-11.524-11.524Zm0 14.666a3.142 3.142 0 1 1 0-6.285 3.142 3.142 0 0 1 0 6.285Zm.585-41.904L6.857 57.144h10.644L56.85 6.858H46.205Z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Stop on Profit */}
              <div className="order-10 md:order-2 mt-2 w-full">
                <div className="flex items-center justify-between text-sm mb-[-4px] pl-[2px] mt-1 w-full font-semibold text-label">
                  <label htmlFor="profit">Stop on Profit</label>
                  <h1 className="text-sm">$0.00</h1>
                </div>

                <div className="relative w-full">
                  <input
                    id="profit"
                    disabled
                    type="text"
                    className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-input hover:border-primary-4"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                  />
                  <div className="absolute top-[14px] right-3">
                    <svg fill="none" viewBox="0 0 96 96" className="svg-icon">
                      {" "}
                      <title></title>{" "}
                      <path
                        d="M95.895 48.105C95.895 74.557 74.451 96 48 96 21.548 96 .105 74.556.105 48.105.105 21.653 21.548.21 48 .21c26.451 0 47.895 21.443 47.895 47.895Z"
                        fill="#F7931A"
                      ></path>
                      <path
                        d="M69.525 42.18c.93-6.27-3.84-9.645-10.38-11.895l2.115-8.505-5.16-1.29-2.1 8.28c-1.365-.345-2.76-.66-4.14-.975l2.1-8.295-5.175-1.29-2.115 8.49c-1.125-.255-2.235-.51-3.3-.78l-7.14-1.785-1.365 5.52s3.84.885 3.75.93a2.763 2.763 0 0 1 2.414 3.011l.001-.01-2.415 9.69c.213.049.394.106.568.174l-.028-.01-.54-.135-3.39 13.5a1.879 1.879 0 0 1-2.383 1.226l.013.004-3.765-.93L24.525 63l6.735 1.665 3.69.96-2.145 8.595 5.175 1.29 2.115-8.505c1.41.375 2.775.735 4.125 1.065l-2.115 8.475 5.175 1.29 2.13-8.58c8.835 1.665 15.465.99 18.255-6.99 2.25-6.42-.105-10.125-4.755-12.54 3.39-.72 5.925-2.955 6.615-7.545ZM57.69 58.755c-1.59 6.435-12.405 3-15.915 2.085L44.61 49.5c3.51.825 14.76 2.565 13.08 9.255Zm1.605-16.665c-1.5 5.85-10.5 2.865-13.38 2.145l2.58-10.32c2.91.72 12.315 2.085 10.8 8.175Z"
                        fill="#fff"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Stop on Loss */}
              <div className="order-10 md:order-2 mt-2 w-full">
                <div className="flex items-center justify-between text-sm mb-[-4px] pl-[2px] mt-1 w-full font-semibold text-label">
                  <label htmlFor="loss">Stop on Loss</label>
                  <h1 className="text-sm">$0.00</h1>
                </div>

                <div className="relative w-full">
                  <input
                    id="loss"
                    type="text"
                    value={loss}
                    disabled
                    onChange={(e) => setLoss(e.target.value)}
                    className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-input hover:border-primary-4"
                  />
                  <div className="absolute top-[14px] right-3">
                    <svg fill="none" viewBox="0 0 96 96" className="svg-icon">
                      {" "}
                      <title></title>{" "}
                      <path
                        d="M95.895 48.105C95.895 74.557 74.451 96 48 96 21.548 96 .105 74.556.105 48.105.105 21.653 21.548.21 48 .21c26.451 0 47.895 21.443 47.895 47.895Z"
                        fill="#F7931A"
                      ></path>
                      <path
                        d="M69.525 42.18c.93-6.27-3.84-9.645-10.38-11.895l2.115-8.505-5.16-1.29-2.1 8.28c-1.365-.345-2.76-.66-4.14-.975l2.1-8.295-5.175-1.29-2.115 8.49c-1.125-.255-2.235-.51-3.3-.78l-7.14-1.785-1.365 5.52s3.84.885 3.75.93a2.763 2.763 0 0 1 2.414 3.011l.001-.01-2.415 9.69c.213.049.394.106.568.174l-.028-.01-.54-.135-3.39 13.5a1.879 1.879 0 0 1-2.383 1.226l.013.004-3.765-.93L24.525 63l6.735 1.665 3.69.96-2.145 8.595 5.175 1.29 2.115-8.505c1.41.375 2.775.735 4.125 1.065l-2.115 8.475 5.175 1.29 2.13-8.58c8.835 1.665 15.465.99 18.255-6.99 2.25-6.42-.105-10.125-4.755-12.54 3.39-.72 5.925-2.955 6.615-7.545ZM57.69 58.755c-1.59 6.435-12.405 3-15.915 2.085L44.61 49.5c3.51.825 14.76 2.565 13.08 9.255Zm1.605-16.665c-1.5 5.85-10.5 2.865-13.38 2.145l2.58-10.32c2.91.72 12.315 2.085 10.8 8.175Z"
                        fill="#fff"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bet button */}
              <button
                onClick={handleAutoBet}
                disabled={!isConnected || startAutoBet || isDisabled}
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform flex items-center justify-center w-full mx-auto py-1.5 mt-4 max-lg:mt-4 rounded text-lg font-semibold text-black ${
                  !isConnected || isDisabled
                    ? "bg-gray-600 cursor-not-allowed"
                    : startAutoBet
                    ? "bg-primary text-white cursor-text"
                    : "bg-button-primary active:scale-90 cursor-pointer"
                }`}
              >
                {!isConnected
                  ? "Connecting..."
                  : isDisabled
                  ? "Spinning..."
                  : startAutoBet
                  ? `Auto Betting (${(currentTotalBet * nbets).toFixed(6)})`
                  : "Start Autobet"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SideBar;
