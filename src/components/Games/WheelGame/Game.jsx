/* eslint-disable */
import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { segments } from "../../../constants";
import {
  disconnectWheelSocket,
  getWheelSocket,
  initializeWheelSocket,
  playGame,
  onGameResult,
  onError,
  onWheelUpdate,
  removeAllGameListeners,
} from "../../../socket/games/wheel";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";

/* eslint-disable react/prop-types */
const Game = ({
  risk,
  segment,
  targetIndex,
  betStarted,
  setBetStarted,
  autoStart,
  nbets,
  setAutoStart,
  bet,
  onHistory,
}) => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [riskSegment, setRiskSegment] = useState(null);
  const [selectedSegmentData, setSelectedSegmentData] = useState(null);
  const [segmentColors, setSegmentColors] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);

  const spinCount = useRef(0);
  const currentRotation = useRef(0);
  const resultTimeoutRef = useRef(null);
  const isProcessingBet = useRef(false);
  const lastBetTimestamp = useRef(0);
  const hasProcessedResult = useRef(false);
  const hasReceivedResult = useRef(false);
  const segmentsInitialized = useRef(false);
  const pendingResult = useRef(null);
  const spinStartTime = useRef(0);
  const isCompletingSpin = useRef(false);
  const spinningRef = useRef(false);
  const currentRiskSegment = useRef(null);
  const currentSelectedSegmentData = useRef(null);
  const currentSegmentColors = useRef([]);

  const BET_COOLDOWN = 3000;
  const MIN_SPIN_TIME = 5000;
  const RESULT_DISPLAY_TIME = 4000;
  const radius = 100;

  const formatWheelMultiplier = (multiplier) => {
    const value = Number(multiplier);
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round(value * 100) / 100;
    const label = Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${label}x`;
  };

  const autobetIntervalRef = useRef(null);
  const remainingBetsRef = useRef(0);

  const handleSpinCompletion = useCallback(() => {
    console.log("=== Spin Completion Handler ===");
    isCompletingSpin.current = true;

    spinningRef.current = false;
    setSpinning(false);
    isProcessingBet.current = false;

    if (pendingResult.current) {
      console.log("Displaying pending result:", pendingResult.current);
      setGameResult(pendingResult.current);
      if (onHistory) onHistory(pendingResult.current.multiplier);
      pendingResult.current = null;

      resultTimeoutRef.current = setTimeout(() => {
        console.log("Clearing game result");
        setGameResult(null);
        setBetStarted(false);
        hasReceivedResult.current = false;
        isCompletingSpin.current = false;

        if (autoStart && remainingBetsRef.current > 0) {
          console.log(
            "Autobet: Triggering next bet. Remaining bets:",
            remainingBetsRef.current
          );
          remainingBetsRef.current -= 1;

          setTimeout(() => {
            if (remainingBetsRef.current >= 0) {
              console.log("Autobet: Starting next bet");
              setBetStarted(true);
            } else {
              console.log("Autobet: All bets completed");
              setAutoStart(false);
              remainingBetsRef.current = 0;
            }
          }, 1000);
        } else if (autoStart && remainingBetsRef.current <= 0) {
          console.log("Autobet: All bets completed");
          setAutoStart(false);
          remainingBetsRef.current = 0;
          toast.success("Autobet completed successfully");
        }
      }, 2000);
    } else {
      isCompletingSpin.current = false;
      if (autoStart) {
        console.log("Autobet: No result received, stopping autobet");
        setAutoStart(false);
        remainingBetsRef.current = 0;
        toast.error("Autobet stopped due to missing result");
      }
    }
  }, [setBetStarted, autoStart, setAutoStart, onHistory]);

  useEffect(() => {
    currentRiskSegment.current = riskSegment;
    currentSelectedSegmentData.current = selectedSegmentData;
    currentSegmentColors.current = segmentColors;
  }, [riskSegment, selectedSegmentData, segmentColors]);

  useEffect(() => {
    if (!token) return;
    getWheelSocket() || initializeWheelSocket(token);
  }, [token]);

  useEffect(() => {
    const wheelSocket = getWheelSocket();
    if (!wheelSocket) return;

    console.log("Game component: Setting up game event handlers");

    const gameResultHandler = (result) => {
      console.log("Game component: Processing game result:", result);

      if (isCompletingSpin.current) {
        console.log("Ignoring game result - completing previous spin");
        return;
      }

      if (!currentSelectedSegmentData.current) {
        console.error(
          "Game component: No segment data available for result processing"
        );
        return;
      }

      if (!result || typeof result !== "object") {
        console.error("Game component: Invalid game result format:", result);
        return;
      }

      if (hasReceivedResult.current) {
        console.log("Already received result for this bet, ignoring");
        return;
      }

      try {
        const multiplier = parseFloat(result.multiplier);
        if (isNaN(multiplier)) {
          console.error(
            "Game component: Invalid multiplier in result:",
            result.multiplier
          );
          return;
        }

        const winAmount = parseFloat(result.winAmount);
        if (isNaN(winAmount)) {
          console.error(
            "Game component: Invalid winAmount in result:",
            result.winAmount
          );
          return;
        }

        const validatedResult = {
          ...result,
          multiplier,
          winAmount,
        };

        // Reflect the debit/credit in the in-game balance readout.
        requestWalletRefresh();
        console.log("Game component: Validated game result:", validatedResult);
        hasReceivedResult.current = true;
        pendingResult.current = validatedResult;

        const targetIndex = Number(result.index);
        if (!Number.isInteger(targetIndex) || targetIndex < 0) {
          console.error("Game component: Missing or invalid PF index:", result);
          toast.error("Invalid wheel result from server");
          setIsWaitingForResult(false);
          setBetStarted(false);
          setSpinning(false);
          pendingResult.current = null;
          hasReceivedResult.current = false;
          return;
        }

        spinWheel(targetIndex);
      } catch (error) {
        console.error("Game component: Error processing game result:", error);
        setIsWaitingForResult(false);
        setBetStarted(false);
        setSpinning(false);
        pendingResult.current = null;
        hasReceivedResult.current = false;
      }
    };

    onGameResult(gameResultHandler);

    onError(({ message }) => {
      console.error("Game component: Join game error:", message);
      toast.error(`Error joining game: ${message}`);
      // A rejected bet (e.g. insufficient balance) left the wallet untouched;
      // resync the readout in case it drifted.
      requestWalletRefresh();
      setIsWaitingForResult(false);
      setBetStarted(false);
      isProcessingBet.current = false;
      hasProcessedResult.current = false;
    });

    onWheelUpdate((data) => {
      console.log("Game component: Wheel update received:", data);
    });

    return () => {
      console.log("Game component: Cleaning up game event handlers");
      removeAllGameListeners();
      isProcessingBet.current = false;
      hasProcessedResult.current = false;
      hasReceivedResult.current = false;
    };
  }, [handleSpinCompletion]);

  useEffect(() => {
    console.log("=== Initial Props Validation ===");
    console.log("Props received:", { risk, segment, bet, betStarted });

    if (!risk) {
      console.error("Risk prop is required but not provided");
      return;
    }

    if (!segment) {
      console.error("Segment prop is required but not provided");
      return;
    }

    if (typeof bet !== "number" || isNaN(bet)) {
      console.error("Invalid bet amount:", bet);
      return;
    }
  }, []);

  useEffect(() => {
    console.log("=== Segment Initialization Start ===");
    console.log("Current props:", { risk, segment, bet });

    segmentsInitialized.current = false;
    setRiskSegment(null);
    setSelectedSegmentData(null);
    setSegmentColors([]);

    if (!risk || !segment) {
      console.error("Missing required props:", { risk, segment });
      return;
    }

    try {
      console.log("Available segments:", segments);

      const foundSegment = segments.find((s) => s.risk === risk);
      if (!foundSegment) {
        console.error(
          "Risk segment not found. Available risks:",
          segments.map((s) => s.risk)
        );
        return;
      }
      console.log("Found risk segment:", foundSegment);

      const foundSegmentData = foundSegment.segment.find(
        (s) => s.segments == segment
      );
      if (!foundSegmentData) {
        console.error(
          "Segment data not found. Available segments:",
          foundSegment.segment.map((s) => s.segments)
        );
        return;
      }
      console.log("Found segment data:", foundSegmentData);

      if (!foundSegmentData.list || !foundSegmentData.colors) {
        console.error(
          "Invalid segment data structure. Required fields missing:",
          {
            hasList: !!foundSegmentData.list,
            hasColors: !!foundSegmentData.colors,
            data: foundSegmentData,
          }
        );
        return;
      }

      // Keep the list order so the PF index maps 1:1 onto the painted slices.
      const colors = foundSegmentData.list.map(
        (item) =>
          foundSegmentData.colors[item] ??
          foundSegmentData.colors[String(item)] ??
          foundSegmentData.colors[Number(item)]
      );

      if (colors.length === 0) {
        console.error("No colors generated. Segment data:", foundSegmentData);
        return;
      }

      console.log("Successfully generated spread out colors:", colors);

      // Store the original list and multiplier indices for later use
      const enhancedSegmentData = {
        ...foundSegmentData,
        colorPositions: colors.map((color, index) => ({
          color,
          originalIndex: index,
        })),
      };

      currentRiskSegment.current = foundSegment;
      currentSelectedSegmentData.current = enhancedSegmentData;
      currentSegmentColors.current = colors;
      segmentsInitialized.current = true;
      setRiskSegment(foundSegment);
      setSelectedSegmentData(enhancedSegmentData);
      setSegmentColors(colors);
    } catch (error) {
      console.error("Error during segment initialization:", error);
      console.error("Error details:", {
        risk,
        segment,
        error: error.message,
        stack: error.stack,
      });
      segmentsInitialized.current = false;
      setRiskSegment(null);
      setSelectedSegmentData(null);
      setSegmentColors([]);
      toast.error(`Game configuration error: ${error.message}`);
    }
  }, [risk, segment]);

  useEffect(() => {
    console.log("=== State Update ===");
    console.log("Risk segment:", riskSegment);
    console.log("Selected segment data:", selectedSegmentData);
    console.log("Segment colors:", segmentColors);
    console.log("Total segments:", segmentColors.length);
    console.log("Current props:", { risk, segment, bet, betStarted });
  }, [
    riskSegment,
    selectedSegmentData,
    segmentColors,
    risk,
    segment,
    bet,
    betStarted,
  ]);

  useEffect(() => {
    if (betStarted && (!segmentColors || segmentColors.length === 0)) {
      console.log("=== Bet Prevention ===");
      console.log("Cannot start bet - segments not ready");
      console.log("Segment colors:", segmentColors);
      setBetStarted(false);
      toast.error("Please wait for game to initialize");
    }
  }, [betStarted, segmentColors, setBetStarted]);

  useEffect(() => {
    if (!spinning && !isWaitingForResult) {
      setBetStarted(false);
    }
  }, [spinning, isWaitingForResult, setBetStarted]);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
      }
    };
  }, []);

  const totalSegments = segmentColors.length;

  const calculateArcPath = (index, total, radius) => {
    const angle = (index / total) * 2 * Math.PI;
    const nextAngle = ((index + 1) / total) * 2 * Math.PI;
    const largeArc = nextAngle - angle > Math.PI ? 1 : 0;

    const startX = radius * Math.cos(angle);
    const startY = radius * Math.sin(angle);
    const endX = radius * Math.cos(nextAngle);
    const endY = radius * Math.sin(nextAngle);

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} L 0 0 Z`;
  };

  const spinWheel = (targetIndex) => {
    console.log("=== Spin Wheel Validation ===");
    console.log("Current state:", {
      segmentsInitialized: segmentsInitialized.current,
      spinning,
      segmentColors: currentSegmentColors.current.length,
      selectedSegmentData: currentSelectedSegmentData.current,
      riskSegment: currentRiskSegment.current,
      targetIndex,
    });

    if (
      !segmentsInitialized.current ||
      !currentRiskSegment.current ||
      !currentSelectedSegmentData.current ||
      !currentSegmentColors.current ||
      currentSegmentColors.current.length === 0
    ) {
      console.error("Cannot spin wheel - invalid state:", {
        segmentsInitialized: segmentsInitialized.current,
        hasRiskSegment: !!currentRiskSegment.current,
        hasSelectedSegmentData: !!currentSelectedSegmentData.current,
        segmentColorsLength: currentSegmentColors.current?.length,
      });
      spinningRef.current = false;
      setSpinning(false);
      setBetStarted(false);
      return;
    }

    if (spinningRef.current) {
      return;
    }

    setGameResult(null);
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }

    spinningRef.current = true;
    setSpinning(true);
    spinStartTime.current = Date.now();
    setIsWaitingForResult(false);

    const totalSegments = currentSegmentColors.current.length;
    const segmentAngle = 360 / totalSegments;
    // SVG 0° is 3 o'clock, CSS rotate is clockwise, pointer sits at 12 o'clock.
    const pointerDeg = 270;
    const targetMod =
      (((pointerDeg - (targetIndex * segmentAngle + segmentAngle / 2)) % 360) +
        360) %
      360;
    const currentMod = ((currentRotation.current % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const extraSpins = 5;
    const newRotation = currentRotation.current + extraSpins * 360 + delta;
    currentRotation.current = newRotation;
    setRotation(newRotation);

    const elapsedTime = Date.now() - spinStartTime.current;
    const remainingTime = Math.max(0, MIN_SPIN_TIME - elapsedTime);

    setTimeout(() => {
      console.log("Wheel spin completed");
      handleSpinCompletion();
    }, remainingTime + 1000);
  };

  useEffect(() => {
    console.log("=== State Change Monitor ===", {
      segmentsInitialized: segmentsInitialized.current,
      hasRiskSegment: !!riskSegment,
      hasSelectedSegmentData: !!selectedSegmentData,
      segmentColorsLength: segmentColors?.length,
      risk,
      segment,
      bet,
    });
  }, [riskSegment, selectedSegmentData, segmentColors, risk, segment, bet]);

  const validateBetAmount = (betValue) => {
    const betNum =
      typeof betValue === "string" ? parseFloat(betValue) : betValue;

    if (isNaN(betNum)) {
      console.error("Invalid bet amount - not a number:", betValue);
      return false;
    }

    if (betNum < 0) {
      console.error("Invalid bet amount - must not be negative:", betNum);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (
      betStarted &&
      !isWaitingForResult &&
      !spinning &&
      !isCompletingSpin.current
    ) {
      console.log("=== Bet Request Validation Start ===");
      console.log("Initial state:", {
        segmentsInitialized: segmentsInitialized.current,
        isWaitingForResult,
        spinning,
        betStarted,
        isCompletingSpin: isCompletingSpin.current,
        risk,
        segment,
        bet,
        betType: typeof bet,
        hasRiskSegment: !!currentRiskSegment.current,
        hasSelectedSegmentData: !!currentSelectedSegmentData.current,
        segmentColorsLength: currentSegmentColors.current?.length,
      });

      if (isCompletingSpin.current) {
        console.log("Ignoring bet request - completing previous spin");
        setBetStarted(false);
        return;
      }

      // Check and reconnect socket if needed
      const wheelSocket = getWheelSocket();
      if (!wheelSocket || !wheelSocket.connected) {
        console.log("Socket not connected, attempting to reconnect...");
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          toast.error("Please login to play");
          setBetStarted(false);
          return;
        }
        initializeWheelSocket(token);
        // Wait a moment for connection
        setTimeout(() => {
          const newSocket = getWheelSocket();
          if (!newSocket || !newSocket.connected) {
            console.error("Failed to reconnect socket");
            toast.error("Failed to connect to game server");
            setBetStarted(false);
            return;
          }
          // Continue with bet after reconnection
          proceedWithBet();
        }, 1000);
        return;
      }

      proceedWithBet();
    }
  }, [betStarted, risk, segment, bet, isWaitingForResult, spinning]);

  const proceedWithBet = () => {
    if (!risk || !segment) {
      console.error("Missing required props:", { risk, segment });
      setBetStarted(false);
      if (autoStart) {
        setAutoStart(false);
        remainingBetsRef.current = 0;
      }
      return;
    }

    const betAmount = parseFloat(bet);

    if (!validateBetAmount(betAmount)) {
      console.error("Invalid bet amount:", betAmount);
      setBetStarted(false);
      if (autoStart) {
        setAutoStart(false);
        remainingBetsRef.current = 0;
        toast.error("Invalid bet amount. Autobet stopped.");
      } else {
        toast.error("Please enter a valid bet amount");
      }
      return;
    }

    // Balance is enforced server-side by the wallet debit; an insufficient
    // balance comes back as an error event.
    const wheelSocket = getWheelSocket();
    if (!wheelSocket?.connected) {
      console.error("Socket not connected for bet");
      setBetStarted(false);
      if (autoStart) {
        setAutoStart(false);
        remainingBetsRef.current = 0;
        toast.error("Lost connection. Autobet stopped.");
      }
      return;
    }

    const betData = {
      risk,
      segments: segment,
      betAmount: parseFloat(bet),
      walletType: "demo",
    };

    console.log("Sending bet request:", betData);
    setIsWaitingForResult(true);
    lastBetTimestamp.current = Date.now();
    isProcessingBet.current = true;

    playGame(betData, (response) => {
      console.log("Bet request response:", response);
      if (response?.error) {
        console.error("Bet request error:", response.error);
        setIsWaitingForResult(false);
        setBetStarted(false);
        isProcessingBet.current = false;
        if (autoStart) {
          setAutoStart(false);
          remainingBetsRef.current = 0;
          toast.error(`${response.error}. Autobet stopped.`);
        } else {
          toast.error(response.error);
        }
      }
    });
  };

  useEffect(() => {
    if (autoStart && nbets > 0) {
      console.log("Autobet: Starting with", nbets, "bets");

      const numBets = parseInt(nbets, 10);
      if (isNaN(numBets) || numBets <= 0) {
        console.error("Invalid number of bets:", nbets);
        setAutoStart(false);
        toast.error("Please enter a valid number of bets");
        return;
      }
      remainingBetsRef.current = numBets;

      setBetStarted(true);
    } else if (!autoStart) {
      remainingBetsRef.current = 0;
      if (autobetIntervalRef.current) {
        clearInterval(autobetIntervalRef.current);
        autobetIntervalRef.current = null;
      }
    }

    return () => {
      remainingBetsRef.current = 0;
      if (autobetIntervalRef.current) {
        clearInterval(autobetIntervalRef.current);
        autobetIntervalRef.current = null;
      }
    };
  }, [autoStart, nbets, setBetStarted]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-[400px] h-[400px] max-lg:w-[250px] max-lg:h-[250px]">
        {/* Outer Circle */}
        <div
          className="absolute inset-0 rounded-full bg-gray-800"
          style={{ zIndex: 1 }}
        />

        {/* Rotating Circle */}
        <div className="absolute left-1/2 top-1/2 z-[2] h-[360px] w-[360px] max-lg:h-[225px] max-lg:w-[225px] -translate-x-1/2 -translate-y-1/2">
        {/* Segments */}
        {segmentColors.length > 0 ? (
          <div
            className="wheel-segments"
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${
                    MIN_SPIN_TIME / 1000
                  }s cubic-bezier(0.2, 0.8, 0.2, 1)`
                : "none",
              willChange: "transform",
            }}
          >
            {segmentColors.map((color, index) => {
              const arcPath = calculateArcPath(
                index,
                segmentColors.length,
                radius
              );
              return (
                <svg
                  key={index}
                  width="100%"
                  height="100%"
                  viewBox="-100 -100 200 200"
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                  }}
                >
                  <path d={arcPath} fill={color} />
                </svg>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800 bg-opacity-50 rounded-full">
            {!risk
              ? "Select a risk level"
              : !segment
              ? "Select a segment"
              : !selectedSegmentData
              ? "Loading game data..."
              : "Initializing wheel..."}
          </div>
        )}

        </div>

        {/* Center hub — covers slice centers so segments read as outer arcs */}
        {segmentColors.length > 0 && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[3] flex aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-activeHover/70 bg-primary shadow-[inset_0_2px_8px_rgb(0_0_0/0.35)]">
            {gameResult && !spinning && (
              <span className="text-3xl font-bold tracking-tight text-white max-lg:text-xl">
                {formatWheelMultiplier(gameResult.multiplier)}
              </span>
            )}
          </div>
        )}

        {/* Pointer */}
        <div
          className="absolute left-1/2 top-0 z-[4] h-10 w-10 -translate-x-1/2 -translate-y-1/2 bg-red-500"
          style={{
            clipPath: "polygon(25% 0, 75% 0, 50% 100%, 50% 100%)",
          }}
        />
      </div>
    </div>
  );
};

export default Game;
