import { useEffect, useState } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";
import History from "../../Frame/History";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getMinesSocket,
  initializeMinesSocket,
} from "../../../socket/games/mines";
import checkLoggedIn from "../../../utils/isloggedIn";
import { toast } from "react-toastify";
import { useGameBalance, useActiveWalletType } from "../../../hooks/useGameBalance";

const Frame = () => {
  const token = useSelector((state) => state.auth?.token);
  const walletType = useActiveWalletType();
  const { balance, loading: balanceLoading } = useGameBalance(walletType);
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [history, setHistory] = useState([]);
  // const user = useSelector((state) => state.auth.user.user);
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.000000");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [mines, setMines] = useState(3);
  const [gems, setGems] = useState(25 - mines);
  const [betStarted, setBettingStarted] = useState(false);
  // eslint-disable-next-line
  const [totalProfit, setTotalProfit] = useState("0.000000");
  const [grid, setGrid] = useState(
    Array(25)
      .fill()
      .map(() => ({ type: "diamond", revealed: false }))
  );

  const [isFairness, setIsFairness] = useState(false);
  const [isGameSettings, setIsGamings] = useState(false);
  const [maxBetEnable, setMaxBetEnable] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);

  const [volume, setVolume] = useState(50);
  const [instantBet, setInstantBet] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [maxBet, setMaxBet] = useState(false);
  const [gameInfo, setGameInfo] = useState(false);
  const [hotkeys, setHotkeys] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);
  const [randomSelect, setRandomSelect] = useState(false);
  const [gameCheckout, setGameCheckout] = useState(false);
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [selectBoxes, setSelectBoxes] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [sidebarDisabled, setSidebarDisabled] = useState(false);

  useEffect(() => {
    if (!token) {
      setConnectionStatus("Not Logged In");
      return;
    }

    const minesSocket = initializeMinesSocket(token);

    const onConnect = () => setConnectionStatus("Connected");
    const onDisconnect = () => setConnectionStatus("Disconnected");

    if (minesSocket) {
      if (minesSocket.connected) setConnectionStatus("Connected");
      minesSocket.on("connect", onConnect);
      minesSocket.on("disconnect", onDisconnect);
    }

    return () => {
      if (minesSocket) {
        minesSocket.off("connect", onConnect);
        minesSocket.off("disconnect", onDisconnect);
      }
    };
  }, [token]);

  const getStakeBlockReason = () => {
    const stake = Number(bet);
    if (!Number.isFinite(stake) || stake < 0) {
      return "Enter a valid bet amount";
    }
    if (walletType === "cash" && stake <= 0) {
      return "Enter a bet amount";
    }
    if (!balanceLoading && (balance == null || stake > balance)) {
      return walletType === "cash"
        ? "Insufficient real balance"
        : "Insufficient demo balance";
    }
    return null;
  };

  const handleMineBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    const blocked = getStakeBlockReason();
    if (blocked) {
      toast.error(blocked);
      return;
    }

    if (!betStarted) {
      setBettingStarted(true);
    }
  };

  const handleCheckout = () => {
    setGameCheckout(true);
    setTimeout(() => {
      setBettingStarted(false);
    }, 2000);
  };

  const handleRandomSelect = () => {
    setRandomSelect(true);
  };

  useEffect(() => {
    setGems(25 - mines);
  }, [mines]);

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    const blocked = getStakeBlockReason();
    if (blocked) {
      toast.error(blocked);
      return;
    }

    const minesSocket = getMinesSocket();
    if (!minesSocket) {
      return;
    }

    if (!startAutoBet && nbets != 0) {
      setStartAutoBet(true);
    }
  };

  const setback = () => {
    if (!startAutoBet) {
      setStartAutoBet(false);
      setSelectBoxes(false);
    }
  };

  const handleSelectBoxes = () => {
    if (!selectBoxes && selectedBoxes.length > 0) {
      setSelectBoxes(true);
    }
  };

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px] max-lg:min-h-[calc(100vh-69px)] lg:min-h-[calc(100vh-92px)]"
      >
        <div
          className={`my-4 max-lg:my-2 lg:my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 lg:min-h-[600px]">
              {/* Left Section */}
              <SideBar
                theatreMode={theatreMode}
                setTheatreMode={setTheatreMode}
                setBet={setBet}
                setBetMode={setBetMode}
                profit={profit}
                setProfit={setProfit}
                setLoss={setLoss}
                nbets={nbets}
                setNBets={setNBets}
                betMode={betMode}
                bet={bet}
                maxBetEnable={maxBetEnable}
                mines={mines}
                setMines={setMines}
                handleMineBet={handleMineBet}
                bettingStarted={betStarted}
                gems={gems}
                setGems={setGems}
                totalprofit={totalProfit}
                handleCheckout={handleCheckout}
                handleRandomSelect={handleRandomSelect}
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                gameCheckout={gameCheckout}
                selectBoxes={selectBoxes}
                setSelectBoxes={setSelectBoxes}
                handleSelectBoxes={handleSelectBoxes}
                setback={setback}
                disabled={sidebarDisabled || connectionStatus !== "Connected"}
                connectionStatus={connectionStatus}
                setGrid={setGrid}
                stakeBlockReason={getStakeBlockReason()}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:h-[fit-content] lg:h-[600px]`}
              >
                <div className="relative flex h-full min-h-[280px] w-full items-center justify-center text-white max-lg:min-h-[260px] lg:min-h-0">
                  <div className="absolute top-2 left-0 z-10 w-full">
                    <History list={history} />
                  </div>
                  <Game
                    mines={mines}
                    randomSelect={randomSelect}
                    setRandomSelect={setRandomSelect}
                    setGems={setGems}
                    betStarted={betStarted}
                    setBetStarted={setBettingStarted}
                    gameCheckout={gameCheckout}
                    setGameCheckout={setGameCheckout}
                    selectBoxes={selectBoxes}
                    startAutoBet={startAutoBet}
                    setStartAutoBet={setStartAutoBet}
                    selectedBoxes={selectedBoxes}
                    setSelectBoxes={setSelectBoxes}
                    setSelectedBoxes={setSelectedBoxes}
                    mode={betMode}
                    nbets={nbets}
                    bet={bet}
                    setBet={setBet}
                    setSidebarDisabled={setSidebarDisabled}
                    grid={grid}
                    setGrid={setGrid}
                    setHistory={setHistory}
                  />
                </div>
              </div>
            </div>

            <FrameFooter
              isFav={isFav}
              isGameSettings={isGameSettings}
              setIsFav={setIsFav}
              setIsFairness={setIsFairness}
              setIsGamings={setIsGamings}
              volume={volume}
              setVolume={setVolume}
              instantBet={instantBet}
              setInstantBet={setInstantBet}
              animations={animations}
              setAnimations={setAnimations}
              maxBet={maxBet}
              setMaxBet={setMaxBet}
              gameInfo={gameInfo}
              setGameInfo={setGameInfo}
              hotkeys={hotkeys}
              setHotkeys={setHotkeys}
              maxBetEnable={maxBetEnable}
              setMaxBetEnable={setMaxBetEnable}
              theatreMode={theatreMode}
              setTheatreMode={setTheatreMode}
            />

            {isGameSettings && (
              <div
                className="absolute bg-transparent top-0 left-0 w-full h-full z-[2] cursor-pointer"
                onClick={() => setIsGamings(false)}
              ></div>
            )}

            {/* Fairness Modal */}
            {isFairness && (
              <>
                <div
                  className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                  onClick={() => setIsFairness(false)}
                >
                  <div className="text-white w-full flex items-center justify-center h-full ">
                    <div
                      className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FairnessModal setIsFairness={setIsFairness} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {hotkeys && (
              <>
                <div
                  className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                  onClick={() => setHotkeys(false)}
                >
                  <div className="text-white w-full flex items-center justify-center h-full ">
                    <div
                      className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HotKeysModal
                        setHotkeys={setHotkeys}
                        hotkeysEnabled={hotkeysEnabled}
                        setHotkeysEnabled={setHotkeysEnabled}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {gameInfo && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setGameInfo(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full ">
                  <div
                    className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GameInfoModal setGameInfo={setGameInfo} />
                  </div>
                </div>
              </div>
            )}

            {maxBet && !maxBetEnable && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setMaxBet(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full ">
                  <div
                    className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MaxBetModal
                      setMaxBet={setMaxBet}
                      setMaxBetEnable={setMaxBetEnable}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Frame;
