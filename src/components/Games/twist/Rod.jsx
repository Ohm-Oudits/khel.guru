import React, { useEffect, useState, useRef } from "react";
import "./style.css";
import gemImage from "../../../assets/twist/gem.png";
import skullImage from "../../../assets/twist/skull.png";
import nullImage from "../../../assets/twist/null.png";
import rubyImage from "../../../assets/twist/ruby.png";
import mineImage from "../../../assets/twist/mine.png";
import { TWIST_RING_MULTIPLIERS } from "./twistMultipliers";

// eslint-disable-next-line react/prop-types
const SegmentedCircle = ({
  totalSegments,
  outerRadius,
  thickness,
  color,
  index,
  multipliers,
  CurrentDiamond,
  loading,
}) => {
  const canvasRef = useRef(null);
  const canvasSize = outerRadius * 2 + thickness * 2;

  const drawSegments = (ctx) => {
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const segmentAngle = (2 * Math.PI) / totalSegments;

    for (let i = 0; i < totalSegments; i++) {
      const startAngle = i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Calculate points for the arrow-shaped segment
      const outerStartX = centerX + outerRadius * Math.cos(startAngle);
      const outerStartY = centerY + outerRadius * Math.sin(startAngle);

      const outerEndX = centerX + outerRadius * Math.cos(endAngle);
      const outerEndY = centerY + outerRadius * Math.sin(endAngle);

      const innerStartX =
        centerX + (outerRadius + thickness) * Math.cos(startAngle);
      const innerStartY =
        centerY + (outerRadius + thickness) * Math.sin(startAngle);

      const innerEndX =
        centerX + (outerRadius + thickness) * Math.cos(endAngle);
      const innerEndY =
        centerY + (outerRadius + thickness) * Math.sin(endAngle);

      const StartedgeEndX =
        centerX +
        (outerRadius + thickness / 2) * Math.cos(endAngle + Math.PI / 36);
      const StartedgeEndY =
        centerY +
        (outerRadius + thickness / 2) * Math.sin(endAngle + Math.PI / 36);

      const EndedgeEndX =
        centerX +
        (outerRadius + thickness / 2) * Math.cos(startAngle + Math.PI / 36);
      const EndedgeEndY =
        centerY +
        (outerRadius + thickness / 2) * Math.sin(startAngle + Math.PI / 36);

      const purplegradient = ctx.createRadialGradient(
        centerX,
        centerY,
        outerRadius,
        centerX,
        centerY,
        outerRadius + thickness
      );

      purplegradient.addColorStop(0, "#703ac7");
      purplegradient.addColorStop(0.475, "#703ac7");
      purplegradient.addColorStop(0.524, "#8f4bff");
      purplegradient.addColorStop(1, "#8f4bff");

      const orangegradient = ctx.createRadialGradient(
        centerX,
        centerY,
        outerRadius,
        centerX,
        centerY,
        outerRadius + thickness
      );
      orangegradient.addColorStop(0, "#c76621");
      orangegradient.addColorStop(0.475, "#c76621");
      orangegradient.addColorStop(0.524, "#ff8228");
      orangegradient.addColorStop(1, "#ff8228");

      const greengradient = ctx.createRadialGradient(
        centerX,
        centerY,
        outerRadius,
        centerX,
        centerY,
        outerRadius + thickness
      );

      greengradient.addColorStop(0, "#26a962");
      greengradient.addColorStop(0.475, "#26a962");
      greengradient.addColorStop(0.524, "#2cd97d");
      greengradient.addColorStop(1, "#2cd97d");

      const defaultgradient = ctx.createRadialGradient(
        centerX,
        centerY,
        outerRadius,
        centerX,
        centerY,
        outerRadius + thickness
      );
      defaultgradient.addColorStop(0, "#3c4344");
      defaultgradient.addColorStop(0.475, "#3c4344");
      defaultgradient.addColorStop(0.524, "#4d5657");
      defaultgradient.addColorStop(1, "#4d5657");
      // Draw the arrow shape

      // (totalSegments == 4) ?
      //   greengradient : (totalSegments == 6) ?
      //     orangegradient : purplegradient

      ctx.fillStyle =
        index - 1 >= i
          ? color === "purple"
            ? purplegradient
            : color === "orange"
            ? orangegradient
            : greengradient
          : defaultgradient;

      ctx.beginPath();
      ctx.moveTo(outerStartX, outerStartY);

      for (let j = 0; j < 10; j++) {
        const angle = startAngle + ((endAngle - startAngle) * j) / 10;
        const x = centerX + outerRadius * Math.cos(angle);
        const y = centerY + outerRadius * Math.sin(angle);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(outerEndX, outerEndY);
      ctx.lineTo(StartedgeEndX, StartedgeEndY);
      ctx.lineTo(innerEndX, innerEndY);

      for (let j = 0; j < 10; j++) {
        const angle = endAngle + ((startAngle - endAngle) * j) / 10;
        const x = centerX + (outerRadius + thickness) * Math.cos(angle);
        const y = centerY + (outerRadius + thickness) * Math.sin(angle);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(innerStartX, innerStartY);

      ctx.lineTo(EndedgeEndX, EndedgeEndY);

      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      const textRadius = outerRadius + thickness / 2;
      const textX =
        centerX + textRadius * Math.cos((startAngle + endAngle) / 2);
      const textY =
        centerY + textRadius * Math.sin((startAngle + endAngle) / 2);

      ctx.save();
      ctx.translate(textX, textY);
      if (
        i === 0 ||
        (totalSegments > 4 && i == 1) ||
        i > 3 ||
        i == totalSegments - 1
      ) {
        ctx.rotate((startAngle + endAngle) / 2 + Math.PI / 2);
      } else {
        ctx.rotate((startAngle + endAngle) / 2 - Math.PI / 2);
      }
      ctx.fillStyle = "black";
      ctx.font =
        multipliers[i].length > 5
          ? "800 14px Arial"
          : multipliers[i].length > 4
            ? "800 15px Arial"
            : "900 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(multipliers[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw the circular arrowhead segments
    drawSegments(ctx);
  }, [totalSegments, index, color]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="twist-wheel-canvas"
    />
  );
};
const ResponsiveSegmentedCircles = ({
  CurrentDiamond,
  loading,
  green,
  orange,
  purple,
  betTrigger,
  onSpinEnd,
}) => {
  const imageUrls = [gemImage, skullImage, nullImage, rubyImage, mineImage];
  const [spinning, setSpinning] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [orangeIn, setorangeIn] = useState(0);
  const [purpleIn, setpurpleIn] = useState(0);
  const [greenIn, setgreenIn] = useState(0);
  const diamondRef = useRef(CurrentDiamond);
  const onSpinEndRef = useRef(onSpinEnd);

  diamondRef.current = CurrentDiamond;
  onSpinEndRef.current = onSpinEnd;

  useEffect(() => {
    setorangeIn(orange);
    setgreenIn(green);
    setpurpleIn(purple);
  }, [orange, purple, green]);

  const rotateImages = () => {
    setSpinning(true);
    const diamonds = ["purple", "skull", "null", "orange", "green"];
    let index = 0;

    const sequenceInterval = setInterval(() => {
      setActiveIndex(index);
      index++;
      if (index >= diamonds.length) {
        index = 0;
      }
    }, 300);

    setTimeout(() => {
      clearInterval(sequenceInterval);
      const finalIndex = diamonds.findIndex((x) => x === diamondRef.current);
      setActiveIndex(finalIndex < 0 ? 0 : finalIndex);
      setSpinning(false);
      onSpinEndRef.current?.();
    }, 3000);
  };

  useEffect(() => {
    if (betTrigger) {
      rotateImages();
    }
  }, [betTrigger]);

  const rings = [
    TWIST_RING_MULTIPLIERS.purple,
    TWIST_RING_MULTIPLIERS.orange,
    TWIST_RING_MULTIPLIERS.green,
  ];

  const outerRadius8 = 200;
  const outerRadius6 = 155;
  const outerRadius4 = 110;
  const thickness = 35;
  const wheelCenter = 245;
  const gemSlot = 36;

  /** 12 o'clock midline of each ring band, in the 490px canvas. */
  const ringMidY = (outerRadius) =>
    wheelCenter - (outerRadius + thickness / 2);

  const gemPillTop = ringMidY(outerRadius8) - gemSlot / 2 - 4;
  const gemPillHeight =
    ringMidY(outerRadius4) - ringMidY(outerRadius8) + gemSlot + 8;

  const ringGemSlots = [
    { src: gemImage, outerRadius: outerRadius8, label: "purple" },
    { src: rubyImage, outerRadius: outerRadius6, label: "orange" },
    { src: mineImage, outerRadius: outerRadius4, label: "green" },
  ];

  return (
    <div className="twist-wheel-host flex w-full items-center justify-center py-1 max-lg:py-0">
      <div className="twist-wheel-stage">
        <div className="twist-wheel-inner">
          <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
            <div className="twist-wheel-bg main h-[490px] w-[490px] rounded-full" />
          </div>

          <div className="twist-wheel-rings">
            <SegmentedCircle
              totalSegments={8}
              outerRadius={outerRadius8}
              thickness={thickness}
              color="purple"
              multipliers={rings[0]}
              CurrentDiamond={CurrentDiamond}
              loading={loading}
              index={purpleIn}
            />
            <SegmentedCircle
              totalSegments={6}
              outerRadius={outerRadius6}
              thickness={thickness}
              color="orange"
              multipliers={rings[1]}
              CurrentDiamond={CurrentDiamond}
              loading={loading}
              index={orangeIn}
            />
            <SegmentedCircle
              totalSegments={4}
              outerRadius={outerRadius4}
              thickness={thickness}
              color="green"
              multipliers={rings[2]}
              CurrentDiamond={CurrentDiamond}
              loading={loading}
              index={greenIn}
            />
          </div>

          <div className="twist-wheel-gems">
            <div
              className="twist-wheel-gem-pill"
              style={{ top: `${gemPillTop}px`, height: `${gemPillHeight}px` }}
            >
              {ringGemSlots.map(({ src, outerRadius, label }) => (
                <div
                  key={label}
                  className="twist-wheel-gem-slot"
                  style={{
                    top: `${ringMidY(outerRadius) - gemPillTop}px`,
                  }}
                >
                  <img src={src} alt={`${label} ring marker`} />
                </div>
              ))}
            </div>
          </div>

          <div className="twist-wheel-center">
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="absolute w-full h-full transition-transform duration-200 ease-linear"
            style={{
              transform: `translateY(-${activeIndex * 100}%)`,
            }}
          >
            {imageUrls.map((image, index) => (
              <div
                key={index}
                className="flex justify-center items-center h-full"
              >
                <img
                  className="w-[100px] h-[100px] z-10"
                  src={image}
                  alt={`slot-image-${index}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
};

export default ResponsiveSegmentedCircles;
