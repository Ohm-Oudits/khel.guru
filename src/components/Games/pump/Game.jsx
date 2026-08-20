import { useState, useEffect } from "react";
import gaspump from "../../../assets/pump/gas.png";
import { IoIosArrowUp } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";

const GameComponent = ({
  bettingStarted,
  pumpClicked,
  setBettingStarted,
  balloonNumber,
  setBalloonNumber,
  balloonSize,
  setBalloonSize,
  isPopped,
  setIsPopped,
  targetMultiplier,
  setTargetMultiplier,
  setCurrenthistory,
  pumpMultipler,
  risk,
}) => {
  useEffect(() => {
    setIsPopped(false);
    resetGame();
    const randomMultiplier =
      pumpMultipler[Math.floor(Math.random() * pumpMultipler.length)];
    setTargetMultiplier(randomMultiplier);
  }, []);

  useEffect(() => {
    if (bettingStarted) {
      resetGame();
    }
  }, [bettingStarted]);

  useEffect(() => {
    if (balloonNumber >= targetMultiplier) {
      setCurrenthistory((prev) => [
        ...prev,
        {
          result: 0.0,
          color: "red",
        },
      ]);
      setIsPopped(true);
      setBettingStarted(false);
      setTimeout(() => {
        resetGame();
      }, 2000);
    }
  }, [balloonNumber, targetMultiplier]);

  const pumpBalloon = () => {
    if (!isPopped) {
      setBalloonSize((prevSize) => Math.min(prevSize + 10, 200));
      setBalloonNumber((prevNumber) => {
        const index = pumpMultipler.indexOf(prevNumber);
        return index !== -1 && index + 1 < pumpMultipler.length
          ? pumpMultipler[index + 1]
          : prevNumber;
      });
    }
  };

  useEffect(() => {
    pumpBalloon();
  }, [pumpClicked]);

  const resetGame = () => {
    setIsPopped(false);
    setBalloonSize(50);
    setBalloonNumber(pumpMultipler[0]);
    const randomMultiplier =
      pumpMultipler[Math.floor(Math.random() * pumpMultipler.length)];
    setTargetMultiplier(randomMultiplier);
  };

  const [currentIndex, setCurrentIndex] = useState(
    pumpMultipler.indexOf(balloonNumber) || 0
  );

  useEffect(() => {
    setCurrentIndex(pumpMultipler.indexOf(balloonNumber));
  }, [balloonNumber]);
  const handleScrollUp = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleScrollDown = () => {
    if (currentIndex < pumpMultipler.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  return (
    <section className="flex w-full h-full justify-center">
      <div className="flex  h-[100%] -mt-20  flex-col  my-auto w-[40%]   items-center justify-end  text-white">
        <div className={`-ml-[150px]  `}>
          <div
            className={`flex  items-center ${
              isPopped ? "animate-float-up" : ""
            } bg-red-600 sheen-effect justify-center transition-all duration-300 ease-in-out`}
            style={{
              width: `${balloonSize * 1}px`,
              height: `${balloonSize * 1.5}px`,
              borderRadius: "50%",
              // marginTop: `-${balloonSize * 0.75}px`, // Moves the balloon upwards
            }}
          >
            <span className="text-sm font-bold">{balloonNumber} X</span>
          </div>
        </div>
        <img src={gaspump} alt="" />
      </div>
      <div className="relative flex mt-[30%] flex-col justify-between items-center  h-[160px] w-32 my-10 overflow-hidden">
        <div className="-mb-10 w-[50%] cursor-pointer z-50 rounded-full items-center justify-center flex ">
          <IoIosArrowUp
            className="text-white/20 z-10"
            onClick={handleScrollUp}
          />
        </div>

        <div className="flex flex-col   items-center">
          {pumpMultipler.map((x, index) => {
            const isCentered = x === balloonNumber;
            return (
              <div
                key={index}
                className={`px-3 py-1 rounded-md text-2xl transition-all duration-300 ${
                  x == 1.01 ? "" : ""
                }  ${
                  isCentered
                    ? "text-green-500  "
                    : "text-gray-500  opacity-50 scale-75"
                }`}
                style={{
                  transition: "opacity 0.3s, transform 0.3s",
                  display:
                    Math.abs(index - currentIndex) <= 1 ? "block" : "none",
                }}
              >
                {x} x
              </div>
            );
          })}
        </div>
        <div className="-mt-10 w-[50%] cursor-pointer rounded-full items-center justify-center flex ">
          <IoIosArrowDown
            className="text-white/20    z-10"
            onClick={handleScrollDown}
          />
        </div>
      </div>
    </section>
  );
};

export default GameComponent;
