import { motion } from "framer-motion";

const sizeClass = ({ small, shrink }) => {
  if (small) return "h-[5.5rem] w-[3.7rem] rounded md:h-[8.4rem] md:w-[5.6rem]";
  if (shrink) return "h-[5.75rem] w-[3.85rem] rounded-lg md:h-32 md:w-[5.35rem]";
  return "h-[7.5rem] w-[5rem] rounded-xl md:h-48 md:w-32";
};

const CardFace = ({ small, shrink, isRed, value, suit }) => (
  <div
    className={`${sizeClass({ small, shrink })} shadow-lg ${
      isRed ? "text-red-600" : "text-black"
    } ${
      shrink
        ? "border border-gray-600 bg-transparent text-gray-600"
        : "bg-white"
    }`}
  >
    <div className="flex h-full flex-col justify-between p-1.5 md:p-3">
      <div
        className={`font-bold ${
          small || shrink ? "text-xs md:text-base" : "text-sm md:text-xl"
        }`}
      >
        {value}
        <span className="ml-1">{suit}</span>
      </div>
      <div
        className={`text-center ${
          small || shrink ? "text-2xl md:text-4xl" : "text-3xl md:text-6xl"
        }`}
      >
        {suit}
      </div>
      <div
        className={`rotate-180 self-end font-bold ${
          small || shrink ? "text-xs md:text-base" : "text-sm md:text-xl"
        }`}
      >
        {value}
        <span className="ml-1">{suit}</span>
      </div>
    </div>
  </div>
);

const Card = ({
  shrink = false,
  small = false,
  value,
  suit,
  isRed = false,
  skipMotion = false,
}) => {
  if (skipMotion) {
    return (
      <CardFace
        small={small}
        shrink={shrink}
        isRed={isRed}
        value={value}
        suit={suit}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.7, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <CardFace
        small={small}
        shrink={shrink}
        isRed={isRed}
        value={value}
        suit={suit}
      />
    </motion.div>
  );
};

export default Card;
