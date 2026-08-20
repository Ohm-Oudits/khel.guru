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
}) => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [connectionStatus, setConnectionStatus] = useState("Connecting");
  const [riskSegment, setRiskSegment] = useState(null);
  const [selectedSegmentData, setSelectedSegmentData] = useState(null);
  const [segmentColors, setSegmentColors] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const spinCount = useRef(0);
  const currentRotation = useRef(0);
  const resultTimeoutRef = useRef(null);
  const isProcessingBet = useRef(false);
  const lastBetTimestamp = useRef(0);
  const hasProcessedResult = useRef(false);
  const hasReceivedResult = useRef(false);
  const segmentsInitialized = useRef(false);
  const isInitialSpin = useRef(true);
  const pendingResult = useRef(null);
  const spinStartTime = useRef(0);
  const isCompletingSpin = useRef(false);
  const currentRiskSegment = useRef(null);
  const currentSelectedSegmentData = useRef(null);
  const currentSegmentColors = useRef([]);

  const BET_COOLDOWN = 3000;
  const MIN_SPIN_TIME = 5000;
  const RESULT_DISPLAY_TIME = 4000;
  const radius = 100;

  const autobetIntervalRef = useRef(null);
  const remainingBetsRef = useRef(0);

  const handleSpinCompletion = useCallback(() => {
    console.log("=== Spin Completion Handler ===");
    isCompletingSpin.current = true;

    setSpinning(false);
    isProcessingBet.current = false;
    isInitialSpin.current = false;

    if (pendingResult.current) {
      console.log("Displaying pending result:", pendingResult.current);
      setGameResult(pendingResult.current);
      pendingResult.current = null;

      resultTimeoutRef.current = setTimeout(() => {
        console.log("Clearing game result");
        setGameResult(null);
        setBetStarted(false);
        hasReceivedResult.current = false;
        isInitialSpin.current = true;
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
  }, [setBetStarted, autoStart, setAutoStart]);

  useEffect(() => {
    currentRiskSegment.current = riskSegment;
    currentSelectedSegmentData.current = selectedSegmentData;
    currentSegmentColors.current = segmentColors;
  }, [riskSegment, selectedSegmentData, segmentColors]);

  useEffect(() => {
    if (!token) {
      setConnectionStatus("Not Logged In");
      return;
    }

    const wheelSocket = getWheelSocket() || initializeWheelSocket(token);

    const markConnected = () => {
      setConnectionStatus("Connected");
      setSocketConnected(true);
      setIsConnecting(false);
    };
    const onConnect = markConnected;
    const onDisconnect = () => {
      setConnectionStatus("Disconnected");
      setSocketConnected(false);
      setIsConnecting(false);
    };

    if (wheelSocket) {
      // A reused socket may already be connected before this handler attaches,
      // so the "connect" event never re-fires — seed the state from the live
      // connection to avoid a permanent "Connecting..." overlay.
      if (wheelSocket.connected) markConnected();
      wheelSocket.on("connect", onConnect);
      wheelSocket.on("disconnect", onDisconnect);
    }

    return () => {
      if (wheelSocket) {
        wheelSocket.off("connect", onConnect);
        wheelSocket.off("disconnect", onDisconnect);
      }
    };
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

        if (isInitialSpin.current) {
          const targetIndex = calculateTargetIndex(
            multiplier,
            currentSelectedSegmentData.current
          );
          console.log(
            "Game component: Calculated target index:",
            targetIndex,
            "for multiplier:",
            multiplier
          );

          if (typeof targetIndex === "number" && !isNaN(targetIndex)) {
            spinWheel(targetIndex);
          } else {
            console.error(
              "Game component: Invalid target index calculated:",
              targetIndex
            );
            setSpinning(false);
            setBetStarted(false);
          }
        }
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
      isInitialSpin.current = true;
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

      // Create a mapping of multipliers to their indices in the list
      const multiplierIndices = new Map();
      foundSegmentData.list.forEach((multiplier, index) => {
        multiplierIndices.set(multiplier, index);
      });

      // Group multipliers by their values to get unique multipliers and their counts
      const multiplierGroups = new Map();
      foundSegmentData.list.forEach((multiplier) => {
        const count = multiplierGroups.get(multiplier) || 0;
        multiplierGroups.set(multiplier, count + 1);
      });

      // Create an array of unique multipliers
      const uniqueMultipliers = Array.from(multiplierGroups.keys());

      // Create a spread out array of colors
      const totalSegments = foundSegmentData.list.length;
      const colors = new Array(totalSegments);

      // Calculate how to spread out each multiplier's segments
      uniqueMultipliers.forEach((multiplier, groupIndex) => {
        const count = multiplierGroups.get(multiplier);
        const color = foundSegmentData.colors[multiplier];

        if (!color) {
          console.error(`Color mapping failed for multiplier ${multiplier}:`, {
            multiplier,
            availableColors: foundSegmentData.colors,
          });
          throw new Error(
            `Invalid color mapping for multiplier: ${multiplier}`
          );
        }

        // Calculate positions to place this multiplier's segments
        // We spread them out evenly around the wheel
        for (let i = 0; i < count; i++) {
          // Calculate position using golden ratio to spread out segments
          const position = Math.floor(
            (i * 1.618033988749895 * totalSegments) % totalSegments
          );
          // Find the next empty slot
          let slot = position;
          while (colors[slot] !== undefined) {
            slot = (slot + 1) % totalSegments;
          }
          colors[slot] = color;
        }
      });

      if (colors.length === 0) {
        console.error("No colors generated. Segment data:", foundSegmentData);
        return;
      }

      console.log("Successfully generated spread out colors:", colors);

      // Store the original list and multiplier indices for later use
      const enhancedSegmentData = {
        ...foundSegmentData,
        multiplierIndices,
        colorPositions: colors.map((color, index) => ({
          color,
          originalIndex: foundSegmentData.list.findIndex(
            (m) => foundSegmentData.colors[m] === color
          ),
        })),
      };

      setRiskSegment(foundSegment);
      setSelectedSegmentData(enhancedSegmentData);
      setSegmentColors(colors);

      setTimeout(() => {
        if (
          riskSegment === foundSegment &&
          selectedSegmentData === enhancedSegmentData &&
          segmentColors.length === colors.length
        ) {
          segmentsInitialized.current = true;
          console.log("=== Segment Initialization Complete ===");
          console.log("Final state:", {
            riskSegment: foundSegment,
            selectedSegmentData: enhancedSegmentData,
            segmentColors: colors,
            segmentsInitialized: true,
          });
        } else {
          console.error("State mismatch during initialization");
          segmentsInitialized.current = false;
        }
      }, 0);
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

  const calculateTargetIndex = (
    multiplier,
    segmentData = currentSelectedSegmentData.current
  ) => {
    console.log(
      "Calculating target index for multiplier:",
      multiplier,
      "with segment data:",
      segmentData
    );

    if (!segmentData || !segmentData.list || !segmentData.colors) {
      console.error("Invalid segment data:", segmentData);
      return 0;
    }

    if (typeof multiplier !== "number" || isNaN(multiplier)) {
      console.error("Invalid multiplier:", multiplier);
      return 0;
    }

    try {
      // Convert multiplier to string with 2 decimal places to match the format in list
      const multiplierStr = multiplier.toFixed(2);
      console.log("Looking for multiplier:", multiplierStr);

      // Find the color for this multiplier
      const targetColor = segmentData.colors[multiplierStr];
      if (!targetColor) {
        console.error("No color found for multiplier:", multiplierStr);
        return 0;
      }
      console.log("Found target color:", targetColor);

      // Find all positions of this color in the wheel
      const colorPositions = [];
      segmentData.list.forEach((item, index) => {
        if (segmentData.colors[item] === targetColor) {
          colorPositions.push(index);
        }
      });

      if (colorPositions.length === 0) {
        console.error("No positions found for color:", targetColor);
        return 0;
      }

      // Use the first position where this color appears
      const targetPosition = colorPositions[0];
      console.log(
        "Found target position:",
        targetPosition,
        "for color:",
        targetColor
      );

      return targetPosition;
    } catch (error) {
      console.error("Error calculating target index:", error);
      return 0;
    }
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
      setSpinning(false);
      setBetStarted(false);
      return;
    }

    if (spinning) {
      console.log("Wheel is already spinning");
      return;
    }

    setGameResult(null);
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
    }

    console.log("=== Starting Wheel Spin ===");
    console.log("Target index:", targetIndex);
    console.log("Segment colors:", currentSegmentColors.current);
    console.log("Total segments:", currentSegmentColors.current.length);

    setSpinning(true);
    spinStartTime.current = Date.now();
    setIsWaitingForResult(false);

    const totalSegments = currentSegmentColors.current.length;
    console.log("Total segments for spin:", totalSegments);

    // Calculate the angle for each segment
    const segmentAngle = 360 / totalSegments;

    // Calculate the target angle
    // We want the target segment to be at the top (0 degrees) where the pointer is
    // Since the wheel rotates clockwise, we need to rotate it so that the target segment
    // ends up at the top position
    const targetAngle = targetIndex * segmentAngle;

    // Add extra spins for animation effect (5 full rotations)
    const extraSpins = 5;
    const baseRotation = extraSpins * 360;

    // Calculate the final rotation
    // We add the current rotation to maintain continuity
    // Then add the base rotation for extra spins
    // Finally add the target angle to stop at the right segment
    const newRotation = currentRotation.current + baseRotation + targetAngle;
    currentRotation.current = newRotation;

    console.log("Wheel spin parameters:", {
      totalSegments,
      segmentAngle,
      targetAngle,
      baseRotation,
      newRotation,
      currentRotation: currentRotation.current,
      targetIndex,
      segmentColors: currentSegmentColors.current,
    });

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

    if (betNum <= 0) {
      console.error("Invalid bet amount - must be greater than 0:", betNum);
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
    <div className="flex flex-col justify-center items-center absolute">
      {/* Connection Status Indicator */}
      {isConnecting && (
        <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 z-10 bg-primary p-2 rounded-lg shadow-lg text-white text-center">
          <div className="text-sm">Connecting to game server...</div>
        </div>
      )}

      {/* Socket Status Indicator */}
      {!isConnecting && !socketConnected && (
        <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 z-10 bg-red-500 p-2 rounded-lg shadow-lg text-white text-center">
          <div className="text-sm">Disconnected from game server</div>
        </div>
      )}

      {/* Outer Circle */}
      <div
        className="absolute w-[400px] h-[400px] max-lg:w-[320px] max-lg:h-[320px] rounded-full bg-gray-800"
        style={{
          borderRadius: "50%",
          zIndex: 1,
        }}
      ></div>

      {/* Rotating Circle */}
      <div className="relative w-[360px] h-[360px] max-lg:w-[290px] max-lg:h-[290px] z-[2]">
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

        {/* Inner Circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] aspect-square rounded-full bg-primary z-[2] border border-activeHover"></div>
      </div>

      {/* Pointer */}
      <div
        className="absolute top-[-3.5%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-500 z-[2]"
        style={{
          clipPath: "polygon(25% 0, 75% 0, 50% 100%, 50% 100%)",
        }}
      ></div>

      {/* Loading Indicator - Only show when waiting for result and not spinning */}
      {isWaitingForResult && !spinning && !gameResult && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-primary p-4 rounded-lg shadow-lg text-white text-center">
          <div className="text-xl">Waiting for result...</div>
        </div>
      )}

      {/* Result Display - Only show when we have a result and the wheel has stopped spinning */}
      {gameResult && !spinning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-primary p-4 rounded-lg shadow-lg text-white text-center">
          <div className="text-xl">Multiplier: {gameResult.multiplier}x</div>
          <div className="text-lg">
            Value: {gameResult.winAmount.toFixed(8)} BTC
          </div>
        </div>
      )}

      <div className="absolute top-2 left-2 text-white text-sm p-2 rounded">
        Status: {connectionStatus}
      </div>
    </div>
  );
};

export default Game;
