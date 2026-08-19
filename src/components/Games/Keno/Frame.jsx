import { useEffect, useState } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";
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

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [nbets, setNBets] = useState(0);
  const [bet, setBet] = useState("0.01");
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

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    if (token) {
      const socket = initializeKenoSocket(token);
      if (socket) {
        console.log("Socket initialized in Frame, status:", socket.connected);
        setSocketConnected(socket.connected);
        socket.on("connect", () => {
          console.log("Socket connected in Frame, ID:", socket.id);
          setSocketConnected(true);
        });
        socket.on("disconnect", () => {
          console.log("Socket disconnected in Frame");
          setSocketConnected(false);
        });
      }
    }
    return () => {
      const kenoSocket = getKenoSocket();
      if (kenoSocket) {
        kenoSocket.off("connect");
        kenoSocket.off("disconnect");
        console.log("Cleaned up socket listeners in Frame");
      }
    };
  }, [token]);

  useEffect(() => {
    setThings(chances(Risk));
  }, [Risk]);

  const handleMineBet = () => {
    if (gameOver) {
      console.log("Game over, resetting states for new bet");
      setGameOver(false);
      setBettingStarted(false);
      setGifts([]);
      if (!randomSelect) {
        setCheckecdBoxes([]);
      }
    }

    if (!betStarted && valid) {
      if (!checkLoggedIn()) {
        navigate(`?tab=${"login"}`, { replace: true });
        return;
      }

      const parsedBet = parseFloat(bet);
      if (isNaN(parsedBet) || parsedBet < 0.000001) {
        toast.error("Bet amount must be at least 0.000001");
        return;
      }

      const kenoSocket = getKenoSocket();
      if (!kenoSocket || !kenoSocket.connected) {
        console.error("Socket not connected");
        toast.error("Socket disconnected, please try again");
        return;
      }
      setBettingStarted(true);
      setWinnedGifts(-1);
      setGameOver(false);
      setGifts([]);

      console.log("Emitting add_game:", { checkedBoxes, bet, risk: Risk });
      kenoSocket.emit("add_game", {
        checkedBoxes,
        bet,
        risk: Risk,
        walletType: "demo",
      });
    } else if (!valid) {
      toast.error("Please select at least one number to bet.");
    }
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
    if (isNaN(parsedBet) || parsedBet < 0.000001) {
      toast.error("Bet amount must be at least 0.000001");
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
    if (AutoPick) {
      const randomNumbers = Array.from({ length: 10 }, () =>
        Math.floor(Math.random() * 40)
      );
      setCheckecdBoxes(randomNumbers);
      setAutoPick(false); // Reset AutoPick after setting numbers
    }
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
          className={`my-12 rounded mx-auto bg-primary w-[96%] max-w-[1400px] max-md:max-w-[450px] ${
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
                bettingStarted={betStarted}
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
                } xl:col-span-9 bg-gray-900 order-1`}
              >
                <div className="w-full relative text-white h-full flex items-center justify-center text-3xl">
                  {loading ? (
                    <h1 className="text-xl font-semibold">Loading...</h1>
                  ) : !socketConnected ? (
                    <h1 className="text-xl font-semibold">
                      Connecting to Server...
                    </h1>
                  ) : (
                    <div className="mb-20">
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
                      />
                    </div>
                  )}
                  <div className="h-[100px] mt-10"></div>
                  <Chances
                    things={things}
                    arrayLength={checkedBoxes.length || 0}
                    winlength={winnedGifts}
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
                    <FairnessModal setIsFairness={setIsFairness} />
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
