import { motion } from "framer-motion";

const Card = ({
  // eslint-disable-next-line
  shrink = false,
  // eslint-disable-next-line
  small = false,
  // eslint-disable-next-line
  medium = false,
  // eslint-disable-next-line
  index = 0,
  // eslint-disable-next-line
  value,
  // eslint-disable-next-line
  suit,
  // eslint-disable-next-line
  isRed = false,
}) => {
  return (
    <motion.div
      initial={
        index === 0
          ? {
              scale: shrink ? 0.7 : 1,
            }
          : {
              rotateY: 180,
              scale: 0.5,
              zIndex: 100,
            }
      }
      animate={{
        rotateY: 0,
        scale: shrink ? 0.7 : 1,
        zIndex: index,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.8,
        duration: 1,
        delay: index * 0.3,
      }}
      className={`${
        small
          ? "h-[8.4rem] w-[5.6rem] rounded"
          : medium
          ? "h-[6.25rem] w-[4.25rem] rounded md:h-36 md:w-24"
          : "w-32 h-48 rounded-xl"
      } shadow-lg ${isRed ? "text-red-600" : "text-black"} ${
        shrink
          ? "bg-transparent text-gray-600 border border-gray-600"
          : "bg-white"
      }`}
    >
      <div className="flex h-full flex-col justify-between p-1.5 md:p-3">
        <div
          className={`${
            small ? "text-base" : medium ? "text-[0.7rem] md:text-lg" : "text-xl"
          } font-bold`}
        >
          {value}
          <span className="ml-1">{suit}</span>
        </div>
        <div className="text-center text-3xl md:text-5xl">{suit}</div>
        <div className="rotate-180 self-end text-[0.7rem] font-bold md:text-xl">
          {value}
          <span className="ml-1">{suit}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Card;
