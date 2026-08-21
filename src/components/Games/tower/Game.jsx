import { useEffect, useLayoutEffect, useState, useRef } from "react";
import {
  checkoutTower,
  continueTowerGame,
  getTowerSocket,
  initializeTowerSocket,
  revealTowerBox,
  requestTowerGameState,
} from "../../../socket/games/tower";
import { toast } from "react-toastify";
import { requestWalletRefresh } from "../../../utils/walletEvents";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  computeTowerEndMultiplier,
  formatTowerMultiplier,
  getTowerProgress,
  getTowerRowMultiplier,
} from "./towerMultiplier";
import { saveTowerRoundRecord } from "../../../utils/towerRoundHistory";
import "./tower.css";

const normalizeSelectedBoxes = (boxes = []) =>
  boxes.map((box) => ({
    row: box.row,
    col: box.col,
    correct: box.correct ?? box.isCorrect ?? false,
  }));

export default function Game({
  bettingStarted,
  Difficulty,
  setBettingStarted,
  startAutoBet,
  setStartAutoBet,
  autoSelectedBoxes,
  setSelectBoxes,
  setAutoSelectedBoxes,
  mode,
  nbets,
  autoArray,
  setAutoArray,
  rows,
  cols,
  setRows,
  setCols,
  setSidebarDisabled,
  bet,
  setBet,
  onRoundSettle,
  onRoundStart,
  boardResetKey,
  roundLocked,
  onCheckoutAvailableChange,
  onFairnessUpdate,
}) {
  const [right, setRight] = useState(3);
  const [currentRow, setCurrentRow] = useState(null);
  const [serverGrid, setServerGrid] = useState([]);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emoji, setEmoji] = useState("/egg/easy.svg");
  const [bwEmoji, setBwEmoji] = useState("🍎");
  const [isConnected, setIsConnected] = useState(false);
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [showGameOptions, setShowGameOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const isLoggedIn = Boolean(token);
  const socketRef = useRef(null);
  const [profit, setProfit] = useState(0);
  const [loss, setLoss] = useState(0);
  const [checkedOut, setCheckedOut] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastSelectedBox, setLastSelectedBox] = useState(null);
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false);
  const [showExistingGameModal, setShowExistingGameModal] = useState(false);
  const [roundFairness, setRoundFairness] = useState(null);
  const [endMultiplier, setEndMultiplier] = useState(null);
  const colsRef = useRef(cols);
  const revealTimeoutRef = useRef(null);
  const settleHandledRef = useRef(false);
  const applyRoundStateRef = useRef(null);
  const onRoundSettleRef = useRef(onRoundSettle);
  const onRoundStartRef = useRef(onRoundStart);
  const difficultyRef = useRef(Difficulty);
  const rowsRef = useRef(rows);
  const selectedBoxesRef = useRef(selectedBoxes);
  const serverGridRef = useRef(serverGrid);
  const currentRowRef = useRef(currentRow);
  const roundFairnessRef = useRef(roundFairness);
  const profitRef = useRef(profit);
  const lossRef = useRef(loss);

  rowsRef.current = rows;
  selectedBoxesRef.current = selectedBoxes;
  serverGridRef.current = serverGrid;
  currentRowRef.current = currentRow;
  roundFairnessRef.current = roundFairness;
  profitRef.current = profit;
  lossRef.current = loss;

  const persistRoundSnapshot = (outcome, extra = {}) => {
    const fairness = roundFairnessRef.current;
    if (!fairness?.nonce && fairness?.nonce !== 0) {
      return;
    }

    saveTowerRoundRecord({
      nonce: fairness.nonce,
      clientSeed: fairness.clientSeed,
      serverSeedHash: fairness.serverSeedHash,
      difficulty: difficultyRef.current,
      betAmount: betRef.current,
      profit: extra.profit ?? profitRef.current,
      loss: extra.loss ?? lossRef.current,
      outcome,
      selectedBoxes: selectedBoxesRef.current,
      grid: serverGridRef.current,
      currentRow: currentRowRef.current,
      stepsCompleted: fairness.step ?? 0,
      progress: fairness.progress ?? null,
      checkoutMultiplier: fairness.checkoutMultiplier ?? null,
      ...extra,
    });
  };
  const betRef = useRef(bet);
  const settleRoundRef = useRef(null);

  colsRef.current = cols;
  difficultyRef.current = Difficulty;
  rowsRef.current = rows;
  betRef.current = bet;
  onRoundSettleRef.current = onRoundSettle;
  onRoundStartRef.current = onRoundStart;

  applyRoundStateRef.current = (gameState) => {
    if (!gameState) return;

    if (gameState.cols) setCols(gameState.cols);
    if (gameState.rows) setRows(gameState.rows);
    if (Array.isArray(gameState.grid)) setServerGrid(gameState.grid);
    if (gameState.currentRow != null) setCurrentRow(gameState.currentRow);
    if (gameState.selectedBoxes) {
      setSelectedBoxes(normalizeSelectedBoxes(gameState.selectedBoxes));
    }
    if (gameState.betAmount != null) setBet(String(gameState.betAmount));
    if (gameState.fairness) setRoundFairness(gameState.fairness);
    setGameOver(Boolean(gameState.gameOver));
    setGameWon(Boolean(gameState.gameWon));
  };

  const clearRevealTimeout = () => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  };

  const resetRoundLocal = () => {
    clearRevealTimeout();
    settleHandledRef.current = false;
    setSelectedBoxes([]);
    setServerGrid([]);
    setCurrentRow(null);
    setGameOver(false);
    setGameWon(false);
    setShowResult(false);
    setEndMultiplier(null);
    setProfit(0);
    setLoss(0);
    setCheckedOut(false);
    setIsAnimating(false);
    setHasActiveGame(false);
    setRoundFairness(null);
  };

  settleRoundRef.current = (multiplier) => {
    if (settleHandledRef.current) return;
    settleHandledRef.current = true;

    clearRevealTimeout();
    setIsAnimating(false);
    setEndMultiplier(Number.isFinite(multiplier) ? multiplier : 0);
    setBettingStarted(false);
    onRoundSettleRef.current?.();
  };

  useEffect(() => {
    if (!boardResetKey) return;
    resetRoundLocal();
  }, [boardResetKey]);

  const canCheckout =
    selectedBoxes.some((box) => box.correct) ||
    getTowerProgress({ currentRow, rows, selectedBoxes }) > 0;

  useLayoutEffect(() => {
    onFairnessUpdate?.(roundFairness);
  }, [roundFairness, onFairnessUpdate]);

  useLayoutEffect(() => {
    if (mode !== "manual" || !bettingStarted || roundLocked) {
      onCheckoutAvailableChange?.(false);
      return;
    }

    onCheckoutAvailableChange?.(canCheckout);
  }, [
    canCheckout,
    mode,
    bettingStarted,
    roundLocked,
    selectedBoxes,
    currentRow,
    onCheckoutAvailableChange,
  ]);

  const getRowColFromIndex = (index) => {
    const columnCount = colsRef.current || 4;
    return {
      row: Math.floor(index / columnCount),
      col: index % columnCount,
    };
  };

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    if (!socketRef.current) {
      const token = localStorage.getItem("token");
      initializeTowerSocket(token);
      socketRef.current = getTowerSocket();
    }

    const towerSocket = socketRef.current;
    if (!towerSocket) return undefined;

    const applyRoundState = (gameState) => {
      applyRoundStateRef.current?.(gameState);
    };

    const onConnect = () => {
      setIsConnected(true);
      setIsDisconnected(false);
      setShowDisconnectModal(false);
      setSidebarDisabled(false);
      requestTowerGameState();
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsDisconnected(true);
      setShowDisconnectModal(true);
      clearRevealTimeout();
      setIsAnimating(false);
    };

    const settleRound = (multiplier) => {
      settleRoundRef.current?.(multiplier);
    };

    const onRoundStarted = (payload) => {
      settleHandledRef.current = false;
      onRoundStartRef.current?.();
      setEndMultiplier(null);
      applyRoundState(payload);
      setHasActiveGame(true);
      setShowGameOptions(true);
      setGameOver(false);
      setGameWon(false);
      setShowResult(false);
      setIsAnimating(false);
      setBettingStarted(true);
      clearRevealTimeout();
      requestWalletRefresh();
    };

    const onGameState = (gameState) => {
      if (!gameState) return;

      setIsAnimating(false);
      clearRevealTimeout();

      if (gameState.existingGame) {
        if (gameState.currentGame) {
          applyRoundState(gameState.currentGame);
        }
        setBettingStarted(true);
        setHasActiveGame(true);
        setShowGameOptions(true);
        setShowExistingGameModal(false);
        continueTowerGame();
        return;
      }

      if (gameState.checkedOut) {
        requestWalletRefresh();
        applyRoundState(gameState);
        setShowResult(true);
        setHasActiveGame(false);
        if (!settleHandledRef.current) {
          settleRound(
            computeTowerEndMultiplier({
              difficulty: difficultyRef.current,
              rows: rowsRef.current,
              checkedOut: true,
              currentRow: gameState.currentRow,
              profit: gameState.profit ?? 0,
              betAmount: gameState.betAmount ?? betRef.current,
              selectedBoxes: normalizeSelectedBoxes(
                gameState.selectedBoxes || []
              ),
            })
          );
        }
        return;
      }

      if (gameState.gameOver || gameState.gameWon) {
        applyRoundState(gameState);
        requestWalletRefresh();
        setHasActiveGame(false);
        setShowGameOptions(false);
        settleRound(
          computeTowerEndMultiplier({
            difficulty: difficultyRef.current,
            rows: rowsRef.current,
            gameWon: Boolean(gameState.gameWon),
            gameOver: Boolean(gameState.gameOver),
            profit: gameState.profit ?? 0,
            betAmount: gameState.betAmount ?? betRef.current,
            selectedBoxes: normalizeSelectedBoxes(
              gameState.selectedBoxes || []
            ),
          })
        );
        return;
      }

      applyRoundState(gameState);

      if (
        gameState.gameWon ||
        gameState.gameOver ||
        (gameState.hasActiveGame && !gameState.existingGame)
      ) {
        requestWalletRefresh();
      }

      const activeRound =
        Boolean(gameState.hasActiveGame) &&
        !gameState.gameOver &&
        !gameState.gameWon &&
        !gameState.checkedOut;

      setHasActiveGame(activeRound);
      setShowGameOptions(activeRound);

      if (activeRound) {
        setBettingStarted(true);
      }
    };

    const onReveal = (result) => {
      setIsAnimating(false);
      clearRevealTimeout();

      if (result.gameWon || !result.isCorrect) {
        requestWalletRefresh();
      }

      if (result.selectedBoxes) {
        setSelectedBoxes(normalizeSelectedBoxes(result.selectedBoxes));
      } else if (result.isCorrect) {
        setSelectedBoxes((prev) => [
          ...prev,
          { row: result.row, col: result.col, correct: true },
        ]);
      } else {
        setSelectedBoxes((prev) => [
          ...prev,
          { row: result.row, col: result.col, correct: false },
        ]);
      }

      if (result.isCorrect) {
        if (result.gameWon) {
          setGameWon(true);
          setProfit(result.profit ?? 0);
          setShowResult(true);
          if (result.grid) setServerGrid(result.grid);
          if (result.fairness) setRoundFairness(result.fairness);
          persistRoundSnapshot("win", {
            profit: result.profit ?? 0,
            grid: result.grid || serverGridRef.current,
          });
          settleRound(
            computeTowerEndMultiplier({
              difficulty: difficultyRef.current,
              rows: rowsRef.current,
              gameWon: true,
              selectedBoxes: normalizeSelectedBoxes(
                result.selectedBoxes || []
              ),
            })
          );
        } else if (result.currentRow != null) {
          setCurrentRow(result.currentRow);
        }
      } else {
        setGameOver(true);
        setLoss(result.loss ?? 0);
        setShowResult(true);
        if (result.grid) setServerGrid(result.grid);
        if (result.fairness) setRoundFairness(result.fairness);
        persistRoundSnapshot("loss", {
          loss: result.loss ?? 0,
          grid: result.grid || serverGridRef.current,
        });
        settleRound(0);
      }

      if (result.grid) setServerGrid(result.grid);
      if (result.fairness) setRoundFairness(result.fairness);
    };

    const onCheckoutResult = (result) => {
      clearRevealTimeout();
      setIsAnimating(false);
      requestWalletRefresh();
      setProfit(result.profit ?? 0);
      setLoss(result.loss ?? 0);
      setShowResult(true);
      setGameOver(false);
      setGameWon(false);
      setServerGrid(result.grid || []);
      setHasActiveGame(false);
      if (result.fairness) setRoundFairness(result.fairness);
      persistRoundSnapshot("checkout", {
        profit: result.profit ?? 0,
        grid: result.grid || [],
        currentRow: result.currentRow,
      });
      settleRound(
        computeTowerEndMultiplier({
          difficulty: difficultyRef.current,
          rows: rowsRef.current,
          checkedOut: true,
          currentRow: result.currentRow,
          profit: result.profit ?? 0,
          betAmount: result.betAmount ?? betRef.current,
          selectedBoxes: normalizeSelectedBoxes(result.selectedBoxes || []),
        })
      );
      setSelectedBoxes([]);
    };

    const onError = ({ message }) => {
      console.error("Game error:", message);
      clearRevealTimeout();
      setIsAnimating(false);
      requestWalletRefresh();
      toast.error(`Error: ${message}`);
    };

    towerSocket.on("connect", onConnect);
    towerSocket.on("disconnect", onDisconnect);
    towerSocket.on("round_started", onRoundStarted);
    towerSocket.on("game_state", onGameState);
    towerSocket.on("reveal", onReveal);
    towerSocket.on("checkout_result", onCheckoutResult);
    towerSocket.on("error", onError);

    if (towerSocket.connected) {
      onConnect();
    }

    return () => {
      towerSocket.off("connect", onConnect);
      towerSocket.off("disconnect", onDisconnect);
      towerSocket.off("round_started", onRoundStarted);
      towerSocket.off("game_state", onGameState);
      towerSocket.off("reveal", onReveal);
      towerSocket.off("checkout_result", onCheckoutResult);
      towerSocket.off("error", onError);
      clearRevealTimeout();
    };
  }, [isLoggedIn, setBettingStarted, setSidebarDisabled]);

  const handleBoxClick = (index) => {
    if (
      !bettingStarted ||
      roundLocked ||
      !socketRef.current ||
      isAnimating ||
      isCheckoutInProgress ||
      checkedOut ||
      gameOver ||
      gameWon
    ) {
      return;
    }

    const { row, col } = getRowColFromIndex(index);
    console.log("Clicked box:", { row, col, currentRow });

    if (currentRow == null) {
      return;
    }

    if (row !== currentRow) {
      return;
    }

    // Check if box is already selected
    const isAlreadySelected = selectedBoxes.some(
      (box) => box.row === row && box.col === col
    );
    if (isAlreadySelected) {
      return;
    }

    if (isAnimating) {
      return;
    }

    setSelectedBox(index);
    setIsAnimating(true);
    setLastSelectedBox(index);
    revealTowerBox(index);
    clearRevealTimeout();
    revealTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 8000);
  };

  const handleContinueGame = () => {
    continueTowerGame();
    setBettingStarted(true);
    setShowGameOptions(false);
    setShowExistingGameModal(false);
    setGameOver(false);
    setGameWon(false);
    setIsAnimating(false);
    setIsCheckoutInProgress(false);
    setCheckedOut(false);
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    checkoutTower();
    setShowExistingGameModal(false);
  };

  useEffect(() => {
    setAutoArray(Array.from({ length: rows }, () => Array(cols).fill(0)));
    setAutoSelectedBoxes([]);
  }, [rows, cols]);

  const getBoxes = () => {
    if (Difficulty === "Easy") {
      setRows(9);
      setCols(4);
      setRight(3);
      setEmoji("/egg/easy.svg");
      setBwEmoji(" ");
    } else if (Difficulty === "Medium") {
      setRows(9);
      setCols(3);
      setRight(2);
      setEmoji("/egg/medium.svg");
      setBwEmoji("");
    } else if (Difficulty === "Hard") {
      setRows(9);
      setCols(2);
      setRight(1);
      setEmoji("/egg/hard.svg");
      setBwEmoji("");
    } else if (Difficulty === "Extreme") {
      setRows(9);
      setCols(3);
      setRight(1);
      setEmoji("/egg/extreme.svg");
      setBwEmoji("");
    } else if (Difficulty === "Nightmare") {
      setRows(9);
      setCols(4);
      setRight(1);
      setEmoji("/egg/nightmare.svg");
      setBwEmoji("");
    }
  };

  useEffect(() => {
    setSelectedBoxes([]);
    setServerGrid([]);
    getBoxes();
  }, [Difficulty]);

  const getBoxContent = (rowIndex, colIndex) => {
    const selectedBox = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    if (selectedBox) {
      return selectedBox.correct ? (
        <img className="tower-tile__egg" src={emoji} alt="egg" />
      ) : (
        ""
      );
    }

    const cell = serverGrid[rowIndex]?.[colIndex];
    if (
      (showResult || gameOver || gameWon) &&
      cell?.revealed &&
      cell?.isCorrect
    ) {
      return <img className="tower-tile__egg" src={emoji} alt="egg" />;
    }

    return bwEmoji;
  };

  const tileShellClass =
    "tower-tile tower-tile-shimmer flex items-center justify-center relative overflow-hidden transition-colors duration-300";

  const renderManualTile = (rowIndex, colIndex) => (
    <div
      key={`col-${colIndex}`}
      onClick={() => handleBoxClick(rowIndex * cols + colIndex)}
      className={`${tileShellClass} cursor-pointer ${getBoxColor(rowIndex, colIndex)} ${getbg(
        rowIndex,
        colIndex
      )}`}
    >
      {getBoxContent(rowIndex, colIndex)}
    </div>
  );

  const renderAutoPlayTile = (rowIndex, colIndex) => (
    <div
      key={`col-${colIndex}`}
      className={`${tileShellClass} ${getBoxColor(rowIndex, colIndex)} ${getbg(
        rowIndex,
        colIndex
      )} ${getAutobg(rowIndex, colIndex)} ${
        startAutoBet ? getIsTrue(rowIndex, colIndex) : ""
      }`}
    >
      {getBoxContent(rowIndex, colIndex)}
    </div>
  );

  const renderAutoPickTile = (rowIndex, colIndex) => (
    <div
      key={`col-${colIndex}`}
      onClick={() => handleAutoClick(rowIndex, colIndex)}
      className={`${tileShellClass} cursor-pointer ${getAutoBoxColor(
        rowIndex,
        colIndex
      )} ${getAutobg(rowIndex, colIndex)}`}
    />
  );

  const getBoxColor = (rowIndex, colIndex) => {
    const selected = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    if (selected) {
      return selected.correct
        ? "bg-[#1a2c38] border border-[#56687A]"
        : "!bg-red-500 bg-opacity-75";
    }

    // Highlight current row
    if (rowIndex === currentRow && bettingStarted && !gameOver && !gameWon) {
      return "bg-yellow-400 bg-opacity-25 hover:bg-yellow-400 hover:bg-opacity-40";
    }

    return "bg-[#213743]";
  };

  const getbg = (rowIndex, colIndex) => {
    const selected = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    return selected
      ? ""
      : "after:bg-[linear-gradient(25deg,transparent_48%,rgba(255,255,255,0.1)_50%,transparent_52%),linear-gradient(-45deg,transparent_48%,rgba(255,255,255,0.1)_50%,transparent_52%)]";
  };

  const getAutoBoxColor = (rowIndex) => {
    const firstZeroRow = autoArray.findLastIndex((row) =>
      row.every((cell) => cell === 0)
    );

    if (rowIndex === firstZeroRow) {
      return "bg-yellow-500";
    }

    return "";
  };

  const getAutobg = (rowIndex, colIndex) => {
    const selected = autoSelectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    return selected
      ? "bg-black border border-[#56687A] bg-opacity-10"
      : "bg-[#213743] border-1";
  };

  const getIsTrue = (rowIndex, colIndex) => {
    const selected = selectedBoxes.find(
      (box) => box.row === rowIndex && box.col === colIndex
    );

    return selected ? "bg-green-500" : "";
  };

  const handleAutoClick = (rowIndex, colIndex) => {
    const lastZeroRow = autoArray.findLastIndex((row) =>
      row.every((cell) => cell === 0)
    );

    if (rowIndex !== lastZeroRow) {
      return;
    }

    setAutoSelectedBoxes((prev) => [...prev, { row: rowIndex, col: colIndex }]);
    setAutoArray((prev) =>
      prev.map((row, rIndex) =>
        rIndex === rowIndex
          ? row.map((cell, cIndex) => (cIndex === colIndex ? 1 : cell))
          : row
      )
    );
  };

  useEffect(() => {
    if (startAutoBet && nbets > 0) {
      autoBet(nbets);
    }
  }, [startAutoBet]);

  const autoBet = async (remaining) => {
    if (remaining <= 0) {
      setStartAutoBet(false);
      return;
    }

    toast.info("Tower autobet still uses the legacy client path.");
    setStartAutoBet(false);
  };

  const shouldShowRowMultiplier = (rowIndex) =>
    bettingStarted &&
    !gameOver &&
    !gameWon &&
    !roundLocked &&
    currentRow != null &&
    rowIndex === currentRow;

  const renderGridRow = (rowIndex, renderTiles) => (
    <div key={`row-${rowIndex}`} className="tower-row">
      {renderTiles()}
    </div>
  );

  const renderGridRows = () => {
    if (mode === "auto") {
      if (startAutoBet) {
        return Array.from({ length: rows }).map((_, rowIndex) =>
          renderGridRow(rowIndex, () =>
            Array.from({ length: cols }).map((_, colIndex) =>
              renderAutoPlayTile(rowIndex, colIndex)
            )
          )
        );
      }

      return autoArray.map((colArray, rowIndex) =>
        renderGridRow(rowIndex, () =>
          colArray.map((_, colIndex) => renderAutoPickTile(rowIndex, colIndex))
        )
      );
    }

    return Array.from({ length: rows }).map((_, rowIndex) =>
      renderGridRow(rowIndex, () =>
        Array.from({ length: cols }).map((_, colIndex) =>
          renderManualTile(rowIndex, colIndex)
        )
      )
    );
  };

  return (
    <div className="tower-play relative flex h-full w-full flex-col items-center justify-end">
      <div className="tower-board-layout">
        <div className="tower-board-column">
          <div className="tower-board-shell bg-[#56687A]">
            <img src="/tower.gif" className="tower-hero" alt="Tower" />
            <div className="tower-board-inner rounded bg-[#1a2c38]">
              <div className="tower-grid" style={{ "--tower-cols": cols }}>
                {renderGridRows()}
              </div>
            </div>
          </div>
          {endMultiplier != null && (
            <div className="tower-settle-overlay" aria-live="polite">
              <span
                className={`tower-settle-multiplier ${
                  endMultiplier > 0
                    ? "tower-settle-multiplier--win"
                    : "tower-settle-multiplier--loss"
                }`}
              >
                {formatTowerMultiplier(endMultiplier)}x
              </span>
            </div>
          )}
        </div>
        <div className="tower-mult-rail" aria-hidden={!bettingStarted}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`mult-${rowIndex}`}
              className={`tower-row-mult-slot ${
                shouldShowRowMultiplier(rowIndex)
                  ? "tower-row-mult-slot--active"
                  : ""
              }`}
            >
              {shouldShowRowMultiplier(rowIndex) && (
                <span className="tower-row-mult__value">
                  {formatTowerMultiplier(
                    getTowerRowMultiplier(Difficulty, rowIndex, rows)
                  )}
                  x
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {roundFairness && (
        <button
          type="button"
          className="tower-pf text-center text-label hover:text-white"
          onClick={() => onFairnessUpdate?.({ ...roundFairness, open: true })}
        >
          Fair · nonce {roundFairness.nonce} · step {roundFairness.step}
          {roundFairness.checkoutMultiplier != null && (
            <> · cashout {formatTowerMultiplier(roundFairness.checkoutMultiplier)}x</>
          )}
        </button>
      )}
      {showDisconnectModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
          <div className="mx-auto w-full max-w-md rounded-lg bg-gray-800 p-4 shadow-xl sm:p-6">
            <h2 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl">
              {isDisconnected ? "Disconnected from Game" : "Session Expired"}
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              {isDisconnected
                ? "You have been disconnected from the game server. Would you like to reconnect?"
                : "Your session has expired. Please login again to continue playing."}
            </p>
            <div className="flex gap-4 justify-center">
              {isDisconnected ? (
                <button
                  className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (token) {
                      initializeTowerSocket(token);
                      socketRef.current = getTowerSocket();
                    }
                  }}
                >
                  Reconnect
                </button>
              ) : (
                <button
                  className="px-6 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                  onClick={() => navigate("?tab=login", { replace: true })}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showExistingGameModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
          <div className="mx-auto w-full max-w-md rounded-lg bg-gray-800 p-4 shadow-xl sm:p-6">
            <h2 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl">
              Active Game Found
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              You have an active game. Would you like to continue or checkout?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="px-6 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                onClick={handleContinueGame}
              >
                Continue Game
              </button>
              <button
                className={`px-6 py-3 text-lg rounded-md font-semibold ${
                  canCheckout
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "cursor-not-allowed bg-gray-600 text-gray-300 opacity-60"
                }`}
                onClick={handleCheckout}
                disabled={!canCheckout}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
