import { motion } from "framer-motion";

// eslint-disable-next-line
const Chances = ({ risk, segment }) => {
  const profit = "45.20";

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-[750px] px-2 text-sm font-semibold lg:text-base">
      <div className="relative flex w-full items-center justify-around gap-2 lg:gap-3">
        {risk === "Low" && (
          <>
            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 0.0}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${0.2 * segment} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 group w-full  rounded-md bg-inactive ratebtns ratebtns1">
                0.00x
              </button>
            </div>
            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 1.2}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${0.7 * segment} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns2">
                1.20x
              </button>
            </div>
            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 1.5}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${segment * 0.1} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns3">
                1.50x
              </button>
            </div>
          </>
        )}

        {risk === "Medium" && (
          <>
            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 0.0}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${0.5 * segment} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 group w-full  rounded-md bg-inactive ratebtns ratebtns1">
                0.00x
              </button>
            </div>

            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 1.5}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${
                        segment == 20
                          ? "2"
                          : segment == 50
                          ? "13"
                          : segment * 0.2
                      } / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns3">
                1.50x
              </button>
            </div>

            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 1.7}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${segment == 50 ? "8" : 1} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns2">
                1.70x
              </button>
            </div>

            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 2.0}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${
                        segment == 10
                          ? "1"
                          : segment == 20
                          ? "6"
                          : segment == 40
                          ? "7"
                          : segment == 50
                          ? "3"
                          : segment * 0.2
                      } / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns4">
                2.00x
              </button>
            </div>

            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 3.0}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${segment == 40 ? "4" : "1"} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns5">
                3.00x
              </button>
            </div>

            {segment == 30 && (
              <div className="group w-full">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUpVariants}
                  transition={{ duration: 0.5 }}
                  className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                      <h1>Profit on Win</h1>
                    </div>

                    <div className="relative w-full">
                      <input
                        className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                        value={profit * 4.0}
                        type="number"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                      <h1>Chance</h1>
                    </div>

                    <div className="relative w-full">
                      <input
                        className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                        value={`1 / ${segment}`}
                        type="text"
                        disabled
                      />
                    </div>
                  </div>
                </motion.div>
                <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns6">
                  4.00x
                </button>
              </div>
            )}
          </>
        )}

        {risk === "High" && (
          <>
            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * 0.0}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`${segment - 1} / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 group w-full  rounded-md bg-inactive ratebtns ratebtns1">
                0.00x
              </button>
            </div>

            <div className="group w-full">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                transition={{ duration: 0.5 }}
                className="absolute  w-full text-[0.9rem] z-[3] bottom-[125%] rounded-md left-0 right-0 py-2 px-4 bg-inactive opacity-0 group-hover:opacity-100 hidden group-hover:flex items-center justify-center gap-4"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Profit on Win</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={profit * (segment * 0.99)}
                      type="number"
                      disabled
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-[-5px] font-semibold text-label">
                    <h1>Chance</h1>
                  </div>

                  <div className="relative w-full">
                    <input
                      className="w-full mt-2 h-full rounded bg-secondry outline-none text-white px-2 pr-6 py-2 border border-activeHover hover:border-active"
                      value={`1 / ${segment}`}
                      type="text"
                      disabled
                    />
                  </div>
                </div>
              </motion.div>
              <button className="py-2 w-full rounded-md bg-inactive ratebtns ratebtns7">
                {`${segment * 0.99}`}x
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chances;
