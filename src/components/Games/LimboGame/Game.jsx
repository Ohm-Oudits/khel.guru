const GameComponent = ({
  number,
  finalNumber,
  targetMultiplier,
  defaultColor,
  isAnimating,
}) => {
  const parsedTargetMultiplier = parseFloat(targetMultiplier).toFixed(2);
  const shown =
    number !== null && number !== undefined
      ? Number(number).toFixed(2)
      : "1.00";

  const getNumberColor = () => {
    if (isAnimating || defaultColor) return "text-white";
    if (finalNumber === null) return "text-gray-400";
    return Number(finalNumber) >= Number(parsedTargetMultiplier)
      ? "text-green-500"
      : "text-red-500";
  };

  return (
    <div className="relative flex w-full flex-col items-center justify-center px-3 pt-11 pb-2 lg:pt-4 lg:pb-2">
      <div
        className={`tabular-nums rounded-md px-4 py-2 font-bold lg:px-8 lg:py-4 ${getNumberColor()}`}
        style={{
          fontSize: "clamp(3rem, 16vw, 8rem)",
          lineHeight: 1,
        }}
      >
        {shown}x
      </div>
    </div>
  );
};

export default GameComponent;
