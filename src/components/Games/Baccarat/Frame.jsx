import { useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import FairnessModal from "../../Frame/FairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";

import { useSelector } from "react-redux";
import {
  getBaccaratSocket,
  initializeBaccaratSocket,
  joinBaccaratGame,
  placeBaccaratBet,
  startBaccaratDealing,
} from "../../../socket/games/baccarat";
import checkLoggedIn from "../../../utils/isloggedIn";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Frame = () => {
  const [isFav, setIsFav] = useState(false);
  const [betMode, setBetMode] = useState("manual");
  const [bet, setBet] = useState("0.000000");
  const [betStarted, setBettingStarted] = useState(false);
  const [chipBet, setChipBet] = useState(0.0);

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

  const [playerBet, setPlayerBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [bankerBet, setBankerBet] = useState(0);

  // Track which spots the player has placed a chip on, independent of the
  // chip amount, so a 0 stake (testing) still counts as a selected bet spot.
  const [selectedSpots, setSelectedSpots] = useState({
    player: false,
    tie: false,
    banker: false,
  });

  const totalBet = playerBet + tieBet + bankerBet;

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const betInFlightRef = useRef(false);

  const initSocket = () => {
    const baccaratSocket = getBaccaratSocket();
    if (!baccaratSocket) {
      initializeBaccaratSocket(token);
    }
  };

  useEffect(() => {
    const baccaratSocket = getBaccaratSocket();

    if (baccaratSocket) {
      baccaratSocket.on("error", ({ message }) => {
        console.error("Join game error:", message);
        toast.error(`Error joining game: ${message}`);
        // A rejected bet left the wallet untouched; resync the readout.
        requestWalletRefresh();
      });
    }

    return () => {
      // Only detach our listener; don't tear down the shared socket on every
      // effect re-run, which disconnected it mid-handshake and dropped bets.
      const baccaratSocket = getBaccaratSocket();
      if (baccaratSocket) {
        baccaratSocket.off("error");
      }
    };
  }, []);

  // Emit an event and resolve with the first ackEvent payload (rejecting on
  // the first error), so bets land on the table strictly in order.
  const emitAndWait = (socket, emitFn, ackEvent) =>
    new Promise((resolve, reject) => {
      const cleanup = () => {
        socket.off(ackEvent, onAck);
        socket.off("error", onError);
      };
      const onAck = (data) => {
        cleanup();
        resolve(data);
      };
      const onError = (err) => {
        cleanup();
        reject(new Error(err?.message || "Connection error"));
      };
      socket.once(ackEvent, onAck);
      socket.once("error", onError);
      emitFn();
    });

  const handleBet = async () => {
    if (!checkLoggedIn()) {
      navigate(`?tab=${"login"}`, { replace: true });
      return;
    }

    // Require a bet spot to be selected, but allow its stake to be 0 (testing).
    if (!selectedSpots.player && !selectedSpots.tie && !selectedSpots.banker) {
      toast.error("Place a chip on Player, Tie or Banker first");
      return;
    }

    initSocket();

    // One bet flow at a time: the join/stake/deal sequence awaits server
    // acks, so guard against a double click double-debiting the stakes.
    if (betStarted || betInFlightRef.current) return;
    betInFlightRef.current = true;

    const baccaratSocket = getBaccaratSocket();
    if (!baccaratSocket) {
      betInFlightRef.current = false;
      console.error("Baccarat socket not initialized");
      toast.error("Failed to join game: Check Your Internet Connection");
      return;
    }

    try {
      // Join the table, stake each selected bet from the demo wallet, then
      // ask the server to deal and settle the round.
      await emitAndWait(
        baccaratSocket,
        () => joinBaccaratGame(),
        "game_joined"
      );

      // Send a stake for every selected spot, including 0-amount ones (testing).
      const bets = [
        ["player", playerBet, selectedSpots.player],
        ["tie", tieBet, selectedSpots.tie],
        ["banker", bankerBet, selectedSpots.banker],
      ]
        .filter(([, , selected]) => selected)
        .map(([betType, amount]) => [betType, amount]);

      for (const [betType, amount] of bets) {
        await emitAndWait(
          baccaratSocket,
          () => placeBaccaratBet(betType, amount, "demo"),
          "bet_placed"
        );
        // The stake was just debited: refresh the balance readout.
        requestWalletRefresh();
      }

      // Refresh again once the deal settles (winnings credited).
      const onSettled = () => {
        requestWalletRefresh();
        baccaratSocket.off("game_settled", onSettled);
      };
      baccaratSocket.on("game_settled", onSettled);

      startBaccaratDealing("demo");
      setBettingStarted(true);
    } catch (error) {
      console.error("Bet error:", error);
      toast.error(error.message || "Failed to place bet");
      requestWalletRefresh();
    } finally {
      betInFlightRef.current = false;
    }
  };

  const handleCheckout = () => {
    setBettingStarted(false);
  };

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
            <div className="grid grid-cols-12 lg:h-[600px]">
              {/* Left Section */}
              <SideBar
                theatreMode={theatreMode}
                setBetMode={setBetMode}
                betMode={betMode}
                bet={bet}
                setBet={setBet}
                maxBetEnable={maxBetEnable}
                handleBet={handleBet}
                bettingStarted={betStarted}
                handleCheckout={handleCheckout}
                chipBet={chipBet}
                setChipBet={setChipBet}
                totalBet={totalBet}
              />

              {/* Right Section */}
              <div
                className={`col-span-12 rounded-tr ${
                  theatreMode
                    ? "md:col-span-8 md:order-2"
                    : "lg:col-span-8 lg:order-2"
                } xl:col-span-9 bg-gray-900 order-1`}
              >
                <div className="w-full  text-white rounded-tr h-full justify-center text-3xl">
                  <Game
                    betStarted={betStarted}
                    bet={bet}
                    chipBet={chipBet}
                    setBettingStarted={setBettingStarted}
                    playerBet={playerBet}
                    setPlayerBet={setPlayerBet}
                    bankerBet={bankerBet}
                    setBankerBet={setBankerBet}
                    tieBet={tieBet}
                    setTieBet={setTieBet}
                    selectedSpots={selectedSpots}
                    setSelectedSpots={setSelectedSpots}
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
