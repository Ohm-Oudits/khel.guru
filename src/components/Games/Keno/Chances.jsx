/* eslint-disable react/prop-types */
import "../../../styles/Keno.css";

const Chances = ({ arrayLength, winlength, things }) => {
  return (
    <div className="w-full text-base font-semibold max-lg:text-xs max-xl:text-sm max-sm:text-[0.6rem]">
      <div className="w-full">
        <div className="grid w-full grid-cols-[repeat(auto-fit,_minmax(0,_1fr))] gap-[1%]">
          {Array.from({ length: arrayLength + 1 }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`w-full justify-center rounded-lg py-2 ${
                winlength === index ? "bg-green-600" : "bg-inactive"
              }`}
            >
              <div style={{ fontSize: "clamp(9px, 2vw, 0.8vw)" }}>
                {things[arrayLength - 1]?.values[0]?.[index] || 0}x
              </div>
            </button>
          ))}
        </div>

        {arrayLength > 0 ? (
          <div className="mt-2 mb-0 flex h-[40px] rounded-md bg-inactive">
            {Array.from({ length: arrayLength + 1 }, (_, index) => (
              <div
                key={index}
                className="flex w-full items-center justify-center py-2 text-center"
              >
                <span
                  className="ml-2 text-sm font-medium"
                  style={{ fontSize: "clamp(9px, 2vw, 0.8vw)" }}
                >
                  {index}x
                </span>
                <span
                  className="ml-[0.1rem] flex items-center justify-center"
                  style={{ "--gem-size": "clamp(12px, 2.5vw, 16px)" }}
                >
                  <div className="container">
                    <div className="sapphire">
                      <div className="shape">
                        <div className="shape top-left"></div>
                        <div className="shape top-right"></div>
                        <div className="shape left"></div>
                        <div className="shape right"></div>
                        <div className="shape bottom-left"></div>
                        <div className="shape bottom-right"></div>
                      </div>
                      <div className="hexagon">
                        <div className="hexagon top"></div>
                        <div className="hexagon middle"></div>
                        <div className="hexagon bottom"></div>
                      </div>
                    </div>
                  </div>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 mb-0 flex h-[40px] w-full items-center justify-center rounded-md bg-inactive">
            <p className="text-center text-sm text-zinc-300">
              Select 1 - 10 numbers to play
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chances;
