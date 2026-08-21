import { useCallback, useEffect, useRef, useState } from "react";
import "../../../styles/Frame.css";
import CardFairnessModal from "../../Frame/CardFairnessModal";
import FrameFooter from "../../Frame/FrameFooter";
import HotKeysModal from "../../Frame/HotKeysModal";
import GameInfoModal from "../../Frame/GameInfoModal";
import MaxBetModal from "../../Frame/MaxBetModal";
import SideBar from "./SideBar";
import Game from "./Game";

import { useSelector } from "react-redux";
import {
  disconnectBaccaratSocket,
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
  const [betStarted, setBettingStarted] = useState(false);
  const [chipBet, setChipBet] = useState(20);

  const [isFairness, setIsFairness] = useState(false);
  const [isGameSettings, setIsGamings] = useState(false);
  const [maxBetEnable, setMaxBetEnable] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);

  const [volume, setVolume] = useState(50);
  const [instantBet, setInstantBet] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [maxBet, setMaxBet] = useState(false);
  const [gameInfo, setGameInfo] = useState(false);
  const [fairnessPrefill, setFairnessPrefill] = useState(null);
  const [hotkeys, setHotkeys] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(false);
  const [dealtRound, setDealtRound] = useState(null);
  const [betLocked, setBetLocked] = useState(false);

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

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const betInFlightRef = useRef(false);
  const resetTimerRef = useRef(null);

  const handleDealComplete = useCallback(() => {
    setBettingStarted(false);
    setBetLocked(true);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setDealtRound(null);
      setPlayerBet(0);
      setTieBet(0);
      setBankerBet(0);
      setSelectedSpots({ player: false, tie: false, banker: false });
      setBettingStarted(false);
      setBetLocked(false);
      betInFlightRef.current = false;
      resetTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    if (!token) {
      disconnectBaccaratSocket();
      return undefined;
    }

    const socket = initializeBaccaratSocket(token);
    if (!socket) return undefined;

    const onError = ({ message }) => {
      toast.error(message || "Baccarat error");
      requestWalletRefresh();
      setBettingStarted(false);
      setBetLocked(false);
      betInFlightRef.current = false;
    };

    const onUpdate = (update) => {
      if (update?.fairness) setFairnessPrefill(update.fairness);
      if (update?.type === "cards_dealt") {
        setDealtRound(update);
        setBettingStarted(true);
      }
    };

    const onSettled = () => {
      requestWalletRefresh();
    };

    socket.on("error", onError);
    socket.on("game_state_update", onUpdate);
    socket.on("game_settled", onSettled);

    return () => {
      socket.off("error", onError);
      socket.off("game_state_update", onUpdate);
      socket.off("game_settled", onSettled);
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [token]);

  // Emit an event and resolve with the first ackEvent payload (rejecting on
  // the first error), so bets land on the table strictly in order.
  const emitAndWait = (socket, emitFn, ackEvent, timeoutMs = 8000) =>
    new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
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
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timed out waiting for the table"));
      }, timeoutMs);
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

    const baccaratSocket =
      initializeBaccaratSocket(token) || getBaccaratSocket();

    // One bet flow at a time: the join/stake/deal sequence awaits server
    // acks, so guard against a double click double-debiting the stakes.
    if (betStarted || betLocked || betInFlightRef.current) return;
    betInFlightRef.current = true;

    if (!baccaratSocket) {
      betInFlightRef.current = false;
      toast.error("Failed to join game: Check Your Internet Connection");
      return;
    }

    try {
      if (!baccaratSocket.connected) {
        await new Promise((resolve, reject) => {
          if (baccaratSocket.connected) {
            resolve();
            return;
          }
          const timer = setTimeout(
            () => reject(new Error("Not connected to Baccarat")),
            5000
          );
          baccaratSocket.once("connect", () => {
            clearTimeout(timer);
            resolve();
          });
          baccaratSocket.connect();
        });
      }
      const joined = await emitAndWait(
        baccaratSocket,
        () => joinBaccaratGame(),
        "game_joined"
      );
      if (joined?.fairness) {
        setFairnessPrefill(joined.fairness);
      }

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

  return (
    <>
      <div className="w-full bg-secondry pt-[1px] pb-3">
        <div
          className={`mx-auto my-3 flex w-[98%] flex-col overflow-hidden rounded bg-primary max-w-[1400px] max-md:my-0 max-md:w-full max-md:rounded-none ${
            theatreMode ? "max-w-full" : ""
          }`}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 grid-cols-12 md:min-h-[520px]">
              {/* Left Section */}
              <SideBar
                setBetMode={setBetMode}
                betMode={betMode}
                handleBet={handleBet}
                bettingStarted={betStarted}
                betLocked={betLocked}
                chipBet={chipBet}
                setChipBet={setChipBet}
              />

              {/* Right Section */}
              <div className="relative order-1 col-span-12 bg-[#0f212e] md:order-2 md:col-span-8 md:min-h-[520px] xl:col-span-9">
                <div className="relative flex h-full w-full items-stretch text-white">
                  <Game
                    betStarted={betStarted}
                    chipBet={chipBet}
                    playerBet={playerBet}
                    setPlayerBet={setPlayerBet}
                    bankerBet={bankerBet}
                    setBankerBet={setBankerBet}
                    tieBet={tieBet}
                    setTieBet={setTieBet}
                    selectedSpots={selectedSpots}
                    setSelectedSpots={setSelectedSpots}
                    dealtRound={dealtRound}
                    onDealComplete={handleDealComplete}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#1a2c38] [&>div]:max-md:!py-3">
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
            </div>

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
                      <CardFairnessModal
                        setIsFairness={setIsFairness}
                        gameKey="baccarat"
                        prefill={fairnessPrefill}
                      />
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
