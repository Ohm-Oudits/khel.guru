import React, { useEffect, useRef, useState } from "react";
import { getBinPayouts } from "./constant";
import usePlinkoStore from "./store";

const BinRow = ({
  plinkoEngine,
  rowCount,
  riskLevel,
  isAnimationOn = true,
}) => {
  const node = useRef(null);

  const rowCountOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16];


  const interpolateRgbColors = (from, to, length) => {
    return Array.from({ length }, (_, i) => ({
      r: Math.round(from.r + ((to.r - from.r) / (length - 1)) * i),
      g: Math.round(from.g + ((to.g - from.g) / (length - 1)) * i),
      b: Math.round(from.b + ((to.b - from.b) / (length - 1)) * i),
    }));
  };

  const getBinColors = (rowCount) => {
    const binColor = {
      background: { red: { r: 255, g: 0, b: 63 }, yellow: { r: 255, g: 192, b: 0 } },
      shadow: { red: { r: 166, g: 0, b: 4 }, yellow: { r: 171, g: 121, b: 0 } },
    };

    const binCount = rowCount + 1;
    const isBinsEven = binCount % 2 === 0;
    const redToYellowLength = Math.ceil(binCount / 2);

    const redToYellowBg = interpolateRgbColors(
      binColor.background.red,
      binColor.background.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    const redToYellowShadow = interpolateRgbColors(
      binColor.shadow.red,
      binColor.shadow.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    return {
      background: [...redToYellowBg, ...redToYellowBg.reverse().slice(isBinsEven ? 0 : 1)],
      shadow: [...redToYellowShadow, ...redToYellowShadow.reverse().slice(isBinsEven ? 0 : 1)],
    };
  };

  const binColorsByRowCount = rowCountOptions.reduce(
    (acc, rowCount) => {
      acc[rowCount] = getBinColors(rowCount);
      return acc;
    }, {}
  );


  const binAnimationsRef = useRef({});
  const currentBinIndex = usePlinkoStore((state) => state.currentBinIndex);
  const landNonce = usePlinkoStore((state) => state.landNonce);

  const initAnimation = (node, binIndex) => {
    if (!node || binAnimationsRef.current[binIndex]) return;

    const bounceAnimation = node.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(35%)" },
        { transform: "translateY(0)" },
      ],
      {
        duration: 380,
        easing: "cubic-bezier(0.18, 0.89, 0.32, 1.28)",
      }
    );
    bounceAnimation.pause();
    binAnimationsRef.current[binIndex] = bounceAnimation;
  };

  const playAnimation = (binIndex) => {
    if (!isAnimationOn || binIndex == null) return;

    const animation = binAnimationsRef.current[binIndex];
    if (!animation) return;
    animation.cancel();
    animation.play();
  };

  useEffect(() => {
    playAnimation(currentBinIndex);
  }, [currentBinIndex, landNonce, isAnimationOn]);
  
  if (!plinkoEngine) {
    return null;
  }

  return (
    <div className="flex h-[clamp(10px,0.352px+2.609vw,16px)] w-full justify-center lg:h-7">

      <div
        className="flex gap-[1%]"
        // eslint-disable-next-line react/prop-types
        style={{ width: `${(plinkoEngine.binsWidthPercentage ?? 0) * 100}%` }}
      >
        {getBinPayouts(rowCount, riskLevel).map((payout, binIndex) => {
          return (
            <div
              key={binIndex}
              ref={(node) => {
                if (node) initAnimation(node, binIndex);
              }}
              className="flex flex-1 items-center justify-center rounded-sm text-[clamp(6px,2.784px+0.87vw,8px)] font-bold text-gray-950 shadow-[0_2px_var(--shadow-color)] lg:rounded-md lg:text-[clamp(10px,-16.944px+2.632vw,12px)] lg:shadow-[0_3px_var(--shadow-color)]"
              style={{
                backgroundColor: binColorsByRowCount[rowCount].background[binIndex],
                "--shadow-color": binColorsByRowCount[rowCount].shadow[binIndex],
              }}
            >
              {payout}
              {payout < 100 ? "x" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BinRow;
