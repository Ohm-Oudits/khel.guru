/* eslint-disable */
import BetAmount from "../../Frame/BetAmount";
import GameBalanceBadge from "../shared/GameBalanceBadge";

const LeftSection = ({
  theatreMode,
  setBetMode,
  betMode,
  bet,
  setBet,
  maxBetEnable,
  nbets,
  setNBets,
  risk,
  setRisk,
  rows,
  setRows,
  bettingStarted,
  handleBetClick,
  handleAutoBet,
  startAutoBet,
  isBallInMotion,
}) => {
  // Determine if controls should be disabled
  const isDisabled = isBallInMotion || startAutoBet;

  return (
    <>
      <div
        className={`col-span-12 ${
          theatreMode ? "md:col-span-4 md:order-1" : "lg:col-span-4 lg:order-1"
        } xl:col-span-3 bg-inactive order-2 max-lg:h-[fit-content] lg:h-[600px] overflow-auto`}
      >
        <div className="my-4 px-3 flex flex-col">
          {/* Manual and auto mode switch */}
          <div className="sticky top-0 z-[1] bg-inactive py-0 rounded-md">
            <div className="order-[100] max-lg:mt-2 lg:order-1 switch mb-4 w-full bg-primary rounded-full p-1.5 grid grid-cols-2 gap-1">
              <div
                onClick={() => {
                  if (!isDisabled) {
                    setBetMode("manual");
                  }
                }}
                className={`${
                  betMode === "manual" ? "bg-inactive scale-95" : ""
                } ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-activeHover cursor-pointer"
                } col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Manual
              </div>
              <div
                onClick={() => {
                  if (!isDisabled) {
                    setBetMode("auto");
                  }
                }}
                className={`${
                  betMode === "auto" ? "bg-inactive scale-95" : ""
                } ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-activeHover cursor-pointer"
                } col-span-1 flex items-center justify-center py-2 text-white font-semibold rounded-full transition-all duration-300 ease-in-out transform active:scale-90`}
              >
                Auto
              </div>
            </div>
          </div>

          {betMode === "manual" && (
            <>
              <GameBalanceBadge className="mb-2" />
              <div className="w-full mb-2">
                <BetAmount
                  bet={bet}
                  setBet={setBet}
                  maxBetEnable={maxBetEnable}
                  disabled={isDisabled}
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                />
              </div>

              {/* Risk Section */}
              <div className="order-10 md:order-2 mb-2 mt-1 w-full">
                <label
                  htmlFor="risk"
                  className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
                >
                  <h1>Risk</h1>
                </label>

                <select
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                  value={risk}
                  id="risk"
                  onChange={(e) => !isDisabled && setRisk(e.target.value)}
                  disabled={isDisabled}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Rows Section */}
              <div className="order-10 md:order-2 mb-2 mt-1 w-full">
                <label
                  htmlFor="rows"
                  className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
                >
                  <h1>Rows</h1>
                </label>

                <select
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                  value={rows}
                  id="rows"
                  onChange={(e) =>
                    !isDisabled && setRows(Number(e.target.value))
                  }
                  disabled={isDisabled}
                >
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                  <option value={11}>11</option>
                  <option value={12}>12</option>
                  <option value={13}>13</option>
                  <option value={14}>14</option>
                  <option value={15}>15</option>
                  <option value={16}>16</option>
                </select>
              </div>

              {/* Bet button */}
              <div
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-90"
                } flex items-center justify-center w-full mx-auto py-1.5 mt-3 max-lg:mt-4 rounded text-lg font-semibold ${
                  !bettingStarted || isDisabled
                    ? "bg-inactive text-white"
                    : "bg-button-primary text-black cursor-pointer"
                }`}
                onClick={() => !isDisabled && handleBetClick()}
              >
                Bet
              </div>
            </>
          )}

          {betMode === "auto" && (
            <>
              <div className="w-full mb-2">
                <BetAmount
                  bet={bet}
                  setBet={setBet}
                  maxBetEnable={maxBetEnable}
                  disabled={isDisabled}
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                />
              </div>

              {/* Risk Section */}
              <div className="order-10 md:order-2 mb-2 mt-3 w-full">
                <label
                  htmlFor="risk"
                  className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
                >
                  <h1>Risk</h1>
                </label>

                <select
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                  value={risk}
                  id="risk"
                  disabled={isDisabled}
                  onChange={(e) => !isDisabled && setRisk(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Rows Section */}
              <div className="order-10 md:order-2 mb-2 mt-1 w-full">
                <label
                  htmlFor="rows"
                  className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
                >
                  <h1>Rows</h1>
                </label>

                <select
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-3 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                  value={rows}
                  id="rows"
                  disabled={isDisabled}
                  onChange={(e) =>
                    !isDisabled && setRows(Number(e.target.value))
                  }
                >
                  <option value={8}>8</option>
                  <option value={9}>9</option>
                  <option value={10}>10</option>
                  <option value={11}>11</option>
                  <option value={12}>12</option>
                  <option value={13}>13</option>
                  <option value={14}>14</option>
                  <option value={15}>15</option>
                  <option value={16}>16</option>
                </select>
              </div>

              {/* Number of bets */}
              <div className="w-full mb-1 order-10 md:order-2">
                <h1 className="font-semibold mt-1 text-label">
                  Number of Bets
                </h1>
                <input
                  type="number"
                  value={nbets}
                  disabled={isDisabled}
                  onChange={(e) => !isDisabled && setNBets(e.target.value)}
                  className={`w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-input ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary-4"
                  }`}
                />
              </div>

              {/* Start Autobet button */}
              <button
                onClick={handleAutoBet}
                disabled={isDisabled}
                className={`order-2 max-md:mb-2 md:order-20 transition-all duration-300 ease-in-out transform flex items-center justify-center w-full mx-auto py-1.5 mt-4 max-lg:mt-4 rounded text-lg font-semibold text-black ${
                  isDisabled
                    ? "bg-primary text-white cursor-not-allowed opacity-50"
                    : "bg-button-primary active:scale-90 cursor-pointer"
                }`}
              >
                {startAutoBet ? "Auto Betting..." : "Start Autobet"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LeftSection;
