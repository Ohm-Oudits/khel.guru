import { useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import KenoFairnessModal from "./KenoFairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";
import History from "../../Frame/History";
import { chances } from "./constants";
import Chances from "./Chances";
import { useNavigate } from "react-router-dom";
import {
  getKenoSocket,
  initializeKenoSocket,
} from "../../../socket/games/keno";
import checkLoggedIn from "../../../utils/isloggedIn";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { addToGameHistory, getGameHistory } from "../../../utils/gameHistory";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("");
  const [loss, setLoss] = useState("0.000000");
  const [profit, setProfit] = useState("0.000000");
  const [Risk, setRisk] = useState("Low");
  const [checkedBoxes, setCheckecdBoxes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [betStarted, setBettingStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalProfit, setTotalProfit] = useState("0.000000");
  const [AutoPick, setAutoPick] = useState(false);
  const [clearTable, setClearTable] = useState(false);
  const [winnedGifts, setWinnedGifts] = useState(-1);
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
  const [gameOver, setGameOver] = useState(false);
  const [startAutoBet, setStartAutoBet] = useState(false);
  const [valid, setValid] = useState(false);
  const [things, setThings] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [fairnessPrefill, setFairnessPrefill] = useState(null);
  const [history, setHistory] = useState([]);
  const [betLocked, setBetLocked] = useState(false);
  const resetTimerRef = useRef(null);
  const autoPickTimerRef = useRef(null);

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    if (!token) {
      setSocketConnected(false);
      return undefined;
    }

    const socket = initializeKenoSocket(token);
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    setSocketConnected(Boolean(socket?.connected));
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [token]);

  useEffect(() => {
    setHistory(getGameHistory("keno_game_history"));
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      if (autoPickTimerRef.current) {
        clearTimeout(autoPickTimerRef.current);
        autoPickTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setThings(chances(Risk));
  }, [Risk]);

  const handleMineBet = () => {
    if (betStarted || betLocked || AutoPick) return;

    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    if (!valid) {
      toast.error("Please select at least one number to bet.");
      return;
    }

    const parsedBet = parseFloat(bet);
    if (isNaN(parsedBet) || parsedBet < 0) {
      toast.error("Bet amount must be 0 or greater");
      return;
    }

    const kenoSocket = getKenoSocket();
    if (!kenoSocket || !kenoSocket.connected) {
      toast.error("Socket disconnected, please try again");
      return;
    }

    setBettingStarted(true);
    setWinnedGifts(-1);
    setGameOver(false);
    setGifts([]);
    setBetLocked(false);

    kenoSocket.emit("add_game", {
      checkedBoxes,
      bet,
      risk: Risk,
      walletType: "demo",
    });
  };

  const handleRandomSelect = () => {
    setRandomSelect(true);
  };

  const handleAutoBet = () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    const parsedBet = parseFloat(bet);
    if (isNaN(parsedBet) || parsedBet < 0) {
      toast.error("Bet amount must be 0 or greater");
      return;
    }

    const kenoSocket = getKenoSocket();
    if (!kenoSocket || !kenoSocket.connected) {
      console.error("Socket not connected");
      toast.error("Socket disconnected, please try again");
      return;
    }

    if (!startAutoBet && nbets != 0 && valid) {
      setStartAutoBet(true);
    }
  };

  useEffect(() => {
    if (clearTable) {
      setCheckecdBoxes([]);
    }
    setClearTable(false);
    setGifts([]);
    setGameOver(false);
  }, [clearTable]);

  useEffect(() => {
    if (startAutoBet && nbets > 0) {
      let currentBet = 0;

      const autoBet = () => {
        if (currentBet < nbets) {
          if (gameOver) {
            console.log("Game over during autobet, resetting states");
            setGameOver(false);
            setBettingStarted(false);
            setGifts([]);
            if (!randomSelect) {
              setCheckecdBoxes([]);
            }
          }

          setGifts([]);
          setGameOver(false);
          setBettingStarted(true);

          const kenoSocket = getKenoSocket();
          console.log("Emitting add_game (auto):", { checkedBoxes, bet });
          // risk is included so payouts credit off the selected risk table.
          kenoSocket.emit("add_game", {
            checkedBoxes,
            bet,
            risk: Risk,
            walletType: "demo",
          });

          setTimeout(() => {
            setBettingStarted(false);
            currentBet += 1;
            autoBet();
          }, 3000);
        } else {
          setStartAutoBet(false);
          setCheckecdBoxes([]);
        }
      };

      autoBet();
    }
  }, [startAutoBet, nbets, checkedBoxes, bet, randomSelect]);

  useEffect(() => {
    if (!AutoPick) return undefined;

    const pool = Array.from({ length: 40 }, (_, index) => index);
    const order = [];
    while (order.length < 10) {
      const next = Math.floor(Math.random() * pool.length);
      order.push(pool.splice(next, 1)[0]);
    }

    setCheckecdBoxes([]);
    setGifts([]);
    setGameOver(false);
    setWinnedGifts(-1);

    let step = 0;
    const pickNext = () => {
      setCheckecdBoxes((prev) => [...prev, order[step]]);
      step += 1;
      if (step < order.length) {
        autoPickTimerRef.current = setTimeout(pickNext, 95);
      } else {
        autoPickTimerRef.current = null;
        setAutoPick(false);
      }
    };

    autoPickTimerRef.current = setTimeout(pickNext, 50);

    return () => {
      if (autoPickTimerRef.current) {
        clearTimeout(autoPickTimerRef.current);
        autoPickTimerRef.current = null;
      }
    };
  }, [AutoPick]);

  useEffect(() => {
    if (checkedBoxes.length >= 1) {
      setValid(true);
    } else {
      setValid(false);
    }
  }, [checkedBoxes]);

  return (
    <>
      <div
        className="w-full bg-secondry pt-[1px] pb-[12px] max-lg:pb-[36px]"
        style={{
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <div
          className={`my-12 max-lg:my-3 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
            theatreMode ? "max-w-[100%] max-h-screen" : "max-lg:max-w-[450px]"
          }`}
        >
          <div className="flex flex-col gap-[0.15rem] relative">
            <div className="grid grid-cols-12 lg:min-h-[600px]">
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
                Risk={Risk}
                valid={valid}
                setRisk={setRisk}
                handleMineBet={handleMineBet}
                bettingStarted={betStarted || betLocked || AutoPick}
                totalprofit={totalProfit}
                handleRandomSelect={handleRandomSelect}
                AutoPick={AutoPick}
                setAutoPick={setAutoPick}
                setClearTable={setClearTable}
                startAutoBet={startAutoBet}
                handleAutoBet={handleAutoBet}
                checkedBoxes={checkedBoxes}
              />

              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1 max-lg:h-auto`}
              >
                <div className="relative flex h-full w-full flex-col text-white max-lg:min-h-0 lg:min-h-[520px]">
                  <div className="pointer-events-none absolute inset-x-0 top-1 z-10">
                    <History list={history} />
                  </div>
                  {loading ? (
                    <h1 className="px-3 py-8 text-center text-xl font-semibold">
                      Loading...
                    </h1>
                  ) : (
                    <div className="flex w-full flex-1 flex-col items-center justify-center px-2 pt-14 max-lg:px-1.5 max-lg:pt-12 lg:pt-16">
                      <Game
                        mines={Risk}
                        randomSelect={randomSelect}
                        setRandomSelect={setRandomSelect}
                        betStarted={betStarted}
                        setBetStarted={setBettingStarted}
                        checkedBoxes={checkedBoxes}
                        setCheckecdBoxes={setCheckecdBoxes}
                        gifts={gifts}
                        setGifts={setGifts}
                        gameOver={gameOver}
                        setGameOver={setGameOver}
                        winnedGifts={winnedGifts}
                        setWinnedGifts={setWinnedGifts}
                        things={things}
                        arrayLength={checkedBoxes.length || 0}
                        setFairnessPrefill={setFairnessPrefill}
                        socketReady={socketConnected}
                        autoPicking={AutoPick}
                        onRoundResult={({ payout }) => {
                          const multiplier = Number(payout) || 0;
                          setHistory(
                            addToGameHistory("keno_game_history", {
                              number: multiplier,
                              isWin: multiplier > 0,
                            })
                          );
                          setBetLocked(true);
                          if (resetTimerRef.current) {
                            clearTimeout(resetTimerRef.current);
                          }
                          resetTimerRef.current = setTimeout(() => {
                            setGifts([]);
                            setGameOver(false);
                            setWinnedGifts(-1);
                            setBettingStarted(false);
                            setBetLocked(false);
                            resetTimerRef.current = null;
                          }, 3000);
                        }}
                      />
                    </div>
                  )}
                  <div className="mx-auto mt-3 w-[92%] max-w-[680px] shrink-0 pb-3 max-lg:mt-2 max-lg:w-[96%] max-lg:pb-2 lg:mt-4 lg:pb-4">
                    <Chances
                      things={things}
                      arrayLength={checkedBoxes.length || 0}
                      winlength={winnedGifts}
                    />
                  </div>
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
              betMode={betMode}
              onBetModeChange={setBetMode}
              modeSwitchDisabled={startAutoBet || betStarted || betLocked || AutoPick}
            />

            {isGameSettings && (
              <div
                className="absolute bg-transparent top-0 left-0 w-full h-full z-[2] cursor-pointer"
                onClick={() => setIsGamings(false)}
              ></div>
            )}

            {isFairness && (
              <div
                className="absolute top-0 left-0 w-full h-full z-[2] bg-[rgba(0,0,0,0.4)] cursor-pointer flex items-center justify-center"
                onClick={() => setIsFairness(false)}
              >
                <div className="text-white w-full flex items-center justify-center h-full ">
                  <div
                    className="max-h-[90%] custom-scrollbar overflow-y-auto w-[95%] pt-3 rounded max-w-[500px] bg-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <KenoFairnessModal
                      setIsFairness={setIsFairness}
                      prefill={fairnessPrefill}
                    />
                  </div>
                </div>
              </div>
            )}

            {hotkeys && (
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
