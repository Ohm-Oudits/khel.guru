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
          ? "w-24 h-36 rounded max-lg:h-[6.75rem] max-lg:w-[4.5rem]"
          : "w-28 h-[10.5rem] rounded-xl"
      } shadow-lg ${isRed ? "text-red-600" : "text-black"} ${
        shrink
          ? "bg-transparent text-gray-600 border border-gray-600"
          : "bg-white"
      }`}
    >
      <div className="p-3 flex flex-col h-full justify-between">
        <div
          className={`${
            small ? "text-base" : medium ? "text-lg max-lg:text-sm" : "text-xl"
          } font-bold`}
        >
          {value}
          <span className="ml-1">{suit}</span>
        </div>
        <div className="text-center text-6xl max-lg:text-4xl">{suit}</div>
        <div className={`text-xl max-lg:text-sm font-bold self-end rotate-180`}>
          {value}
          <span className="ml-1">{suit}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Card;
