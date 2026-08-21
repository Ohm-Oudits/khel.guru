import { useState, useEffect, useRef, useMemo } from "react";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import PumpVisual from "./PumpVisual";
import {
  BALLOON_WIDTH_MIN,
  canBalloonGrowVisually,
  getBalloonVisualFill,
  getBalloonVisualScale,
} from "./pumpNozzle";
import "./pump.css";

const midRadius = (fill) =>
  `${58 - fill * 6}% ${42 + fill * 6}% ${64 - fill * 8}% ${36 + fill * 8}% / ${
    40 + fill * 5
  }% ${60 - fill * 5}% ${36 + fill * 6}% ${64 - fill * 6}%`;

const PumpBalloon = ({
  balloonNumber,
  pumpIndex,
  pumpMultipler,
  isPopped,
  bettingStarted,
}) => {
  const [bounce, setBounce] = useState(false);
  const prevIndexRef = useRef(pumpIndex);
  const prevScaleRef = useRef(1);

  useEffect(() => {
    const scaleNow = getBalloonVisualScale(pumpIndex);
    const grewVisually =
      pumpIndex > prevIndexRef.current &&
      scaleNow > prevScaleRef.current + 0.001 &&
      canBalloonGrowVisually(prevIndexRef.current) &&
      bettingStarted &&
      !isPopped;
    if (grewVisually) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 420);
      prevIndexRef.current = pumpIndex;
      prevScaleRef.current = scaleNow;
      return () => clearTimeout(timer);
    }
    prevIndexRef.current = pumpIndex;
    prevScaleRef.current = scaleNow;
  }, [pumpIndex, bettingStarted, isPopped]);

  const scale = useMemo(
    () => getBalloonVisualScale(pumpIndex),
    [pumpIndex]
  );

  const fill = useMemo(
    () => getBalloonVisualFill(balloonNumber, pumpMultipler, pumpIndex),
    [balloonNumber, pumpMultipler, pumpIndex]
  );

  const width = BALLOON_WIDTH_MIN * scale;
  const height = width * (0.84 + fill * 0.22);
  const borderRadius =
    fill < 0.08
      ? "78% 22% 64% 36% / 32% 68% 42% 58%"
      : fill < 0.98
        ? midRadius(fill)
        : "50%";

  const scaleY = 0.86 + fill * 0.12;

  const bgColor =
    fill < 0.12
      ? "linear-gradient(148deg, #6b1515 0%, #8b1a1a 38%, #6b1515 100%)"
      : fill < 0.5
        ? "linear-gradient(160deg, #b91c1c 0%, #dc2626 55%, #b91c1b 100%)"
        : "linear-gradient(160deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)";

  const balloonStyle = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius,
    background: bgColor,
    "--balloon-scale-y": String(scaleY),
    "--wrinkle-opacity": String(Math.max(0, 1 - fill * 1.2)),
    "--fold-opacity": String(Math.max(0, 0.85 - fill * 0.9)),
    filter: `brightness(${0.68 + fill * 0.32}) saturate(${0.7 + fill * 0.3})`,
    boxShadow:
      fill < 0.1
        ? "inset -6px -10px 18px rgba(0,0,0,0.5), inset 4px 2px 8px rgba(255,255,255,0.04), 0 1px 4px rgba(0,0,0,0.3)"
        : `inset -3px -6px 12px rgba(0,0,0,${
            0.3 - fill * 0.12
          }), 0 ${4 + fill * 10}px ${14 + fill * 18}px rgba(220,38,38,${
            0.12 + fill * 0.22
          })`,
  };

  return (
    <div
      className={`pump-balloon-stack ${
        isPopped ? "pump-balloon-stack--blast" : ""
      } ${bounce ? "pump-balloon-stack--bounce" : ""}`}
      style={{ "--fill": String(fill) }}
    >
      <div className="pump-balloon" style={balloonStyle}>
        <div className="pump-balloon__fold" />
        <div className="pump-balloon__wrinkles" />
        <span
          className="pump-balloon__label text-white"
          style={{
            fontSize: `${Math.max(9, 9 + fill * 7)}px`,
            opacity: bettingStarted || isPopped ? 0.95 : 0.5,
          }}
        >
          {Number(balloonNumber).toFixed(2)}x
        </span>
      </div>
      <div
        className="pump-balloon__knot"
        style={{ "--fill": String(fill) }}
      />
      <div
        className="pump-balloon__neck"
        style={{
          "--fill": String(fill),
          "--neck-length": `${Math.max(6, 6 + fill * 10)}px`,
        }}
      />
    </div>
  );
};

const MultiplierRail = ({
  pumpMultipler,
  balloonNumber,
  previewIndex,
  setPreviewIndex,
  bettingStarted,
}) => {
  const pumpIndex = pumpMultipler.indexOf(balloonNumber);
  const activeIndex = bettingStarted
    ? pumpIndex === -1
      ? 0
      : pumpIndex
    : previewIndex ?? (pumpIndex === -1 ? 0 : pumpIndex);

  const scrollUp = () => {
    if (activeIndex > 0) setPreviewIndex(activeIndex - 1);
  };

  const scrollDown = () => {
    if (activeIndex < pumpMultipler.length - 1) setPreviewIndex(activeIndex + 1);
  };

  useEffect(() => {
    setPreviewIndex(null);
  }, [balloonNumber]);

  const visible = pumpMultipler
    .map((value, index) => ({ value, index }))
    .filter(({ index }) => Math.abs(index - activeIndex) <= 1);

  return (
    <div className="pump-multiplier-rail">
      <button
        type="button"
        className="pump-multiplier-rail__arrow"
        onClick={scrollUp}
        aria-label="Previous multiplier"
      >
        <IoIosArrowUp />
      </button>
      <div className="pump-multiplier-rail__values">
        {visible.map(({ value, index }) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={`${value}-${index}`}
              className={`pump-multiplier-rail__chip ${
                isActive
                  ? "pump-multiplier-rail__chip--active"
                  : "pump-multiplier-rail__chip--idle"
              }`}
            >
              {value}x
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="pump-multiplier-rail__arrow"
        onClick={scrollDown}
        aria-label="Next multiplier"
      >
        <IoIosArrowDown />
      </button>
    </div>
  );
};

const GameComponent = ({
  bettingStarted,
  balloonNumber,
  isPopped,
  pumpMultipler,
  roundLocked,
}) => {
  const [previewIndex, setPreviewIndex] = useState(null);

  const pumpIndex = useMemo(() => {
    const idx = pumpMultipler.findIndex(
      (value) => Math.abs(value - balloonNumber) < 0.001
    );
    return idx === -1 ? 0 : idx;
  }, [balloonNumber, pumpMultipler]);

  const fill = useMemo(
    () =>
      getBalloonVisualFill(
        balloonNumber,
        pumpMultipler,
        bettingStarted || isPopped ? pumpIndex : 0
      ),
    [balloonNumber, pumpMultipler, pumpIndex, bettingStarted, isPopped]
  );

  return (
    <section className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="pump-stage">
        <MultiplierRail
          pumpMultipler={pumpMultipler}
          balloonNumber={balloonNumber}
          previewIndex={previewIndex}
          setPreviewIndex={setPreviewIndex}
          bettingStarted={bettingStarted}
        />
        <div className="pump-assembly">
          <PumpVisual fill={fill}>
            <PumpBalloon
              balloonNumber={balloonNumber}
              pumpIndex={bettingStarted || isPopped ? pumpIndex : 0}
              pumpMultipler={pumpMultipler}
              isPopped={isPopped}
              bettingStarted={bettingStarted}
            />
          </PumpVisual>
        </div>
      </div>
      {roundLocked && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-black/20" />
      )}
    </section>
  );
};

export default GameComponent;
