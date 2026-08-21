import { useState, useEffect, useRef } from "react";
import "../../../../styles/Roulette.css";
import {
  ROULETTE_WHEEL_ORDER,
  getRoulettePocketColor,
} from "../roulette.constants";

const SPIN_DURATION_MS = 9000;
const RESULT_HOLD_MS = 1000;

const Roulette = ({
  spinPocket,
  spinKey = 0,
  onBallLand,
  onAnimationComplete,
}) => {
  const [result, setResult] = useState(null);
  const [spinto, setSpinto] = useState("");
  const timersRef = useRef([]);
  const plateRef = useRef(null);
  const activeSpinKeyRef = useRef(null);
  const onBallLandRef = useRef(onBallLand);
  const onCompleteRef = useRef(onAnimationComplete);

  onBallLandRef.current = onBallLand;

  const resetPlateSpin = () => {
    const plate = plateRef.current;
    if (!plate) {
      return;
    }
    plate.style.animation = "none";
    void plate.offsetWidth;
    plate.style.animation = "";
  };

  onCompleteRef.current = onAnimationComplete;

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    if (spinPocket == null || Number.isNaN(Number(spinPocket))) {
      return undefined;
    }

    if (activeSpinKeyRef.current === spinKey) {
      return undefined;
    }
    activeSpinKeyRef.current = spinKey;

    const pocket = Number(spinPocket);
    clearTimers();
    setResult(null);
    setSpinto("");
    resetPlateSpin();

    const startTimer = setTimeout(() => {
      setSpinto(String(pocket));
    }, 50);

    const revealTimer = setTimeout(() => {
      setResult({
        number: pocket,
        color: getRoulettePocketColor(pocket),
      });
      onBallLandRef.current?.(pocket);
    }, SPIN_DURATION_MS);

    const completeTimer = setTimeout(() => {
      setSpinto("");
      setResult(null);
      onCompleteRef.current?.();
    }, SPIN_DURATION_MS + RESULT_HOLD_MS);

    timersRef.current = [startTimer, revealTimer, completeTimer];

    return () => {
      if (activeSpinKeyRef.current !== spinKey) {
        clearTimers();
      }
    };
  }, [spinPocket, spinKey]);

  useEffect(() => () => clearTimers(), []);

  return (
    <div className="roulette-container">
      <div className="plate" ref={plateRef}>
        <ul className="inner" data-spinto={spinto || undefined}>
          {ROULETTE_WHEEL_ORDER.map((num) => {
            const color = getRoulettePocketColor(num);
            return (
              <li key={num} className={`number number-${color}`}>
                <div className="pit">{num}</div>
              </li>
            );
          })}
        </ul>
      </div>
      {result ? (
        <div className="roulette-result-overlay" aria-live="polite">
          <span className={`result-color color-${result.color}`}>
            {result.number}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default Roulette;
