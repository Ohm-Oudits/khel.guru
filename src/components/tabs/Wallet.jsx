import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(window.location.pathname, { replace: true });
  };

  return (
    <>
      <div
        className="bg-[rgba(0,0,0,0.7)]  cursor-pointer backdrop-blur-sm w-full h-screen fixed top-0 left-0 z-[99] overflow-y-auto flex items-center justify-center"
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-primary cursor-default text-white rounded flex-col w-[90%] max-w-[540px] px-4 py-5 animate-fadeUp relative"
        >
          <div
            onClick={handleClose}
            className="absolute cursor-pointer top-5 right-5"
          >
            <IoMdClose size={20} />
          </div>
          <div className="h-[240px] text-zinc-300 uppercase flex items-center justify-center w-full">
            Khel - guru
          </div>
          <div className="my-2">
            <h1 className="mt-1 text-2xl font-semibold text-start">
              Lets setup your wallet & get started!
            </h1>
            <p className="text-base mt-2 text-zinc-400">
              The cashier handles UPI and crypto deposits, withdrawals with
              review protection, and your full transaction history — all from
              one place.
            </p>
            <button
              onClick={() => navigate("/wallet")}
              className="mt-5 w-full py-2 bg-ter active:scale-[0.9] transition"
            >
              Open Cashier
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Wallet;
