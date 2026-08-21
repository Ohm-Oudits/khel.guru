import { motion } from "framer-motion";

const Card = ({
  shrink = false,
  small = false,
  medium = false,
  index = 0,
  value,
  suit,
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
          ? "h-32 w-20 rounded max-lg:h-[5.3rem] max-lg:w-[3.4rem]"
          : "w-28 h-[10.5rem] rounded-xl"
      } shadow-lg ${isRed ? "text-red-600" : "text-black"} ${
        shrink
          ? "bg-transparent text-gray-600 border border-gray-600"
          : "bg-white"
      }`}
    >
      <div
        className={`flex h-full flex-col justify-between ${
          small ? "p-3" : medium ? "p-2.5 max-lg:p-2" : "p-3"
        }`}
      >
        <div
          className={`${
            small ? "text-base" : medium ? "text-base max-lg:text-xs" : "text-xl"
          } font-bold`}
        >
          {value}
          <span className="ml-1">{suit}</span>
        </div>
        <div className="text-center text-5xl max-lg:text-[1.8rem]">{suit}</div>
        <div
          className={`self-end rotate-180 font-bold ${
            medium ? "text-base max-lg:text-xs" : "text-xl max-lg:text-sm"
          }`}
        >
          {value}
          <span className="ml-1">{suit}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Card;
