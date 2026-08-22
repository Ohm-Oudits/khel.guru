import { FaArrowLeft } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

export const isGameRoute = (pathname = "") =>
  pathname.startsWith("/game/") ||
  pathname.startsWith("/casino/slots/") ||
  pathname.startsWith("/casino/live/");

const GameBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate("/casino");
  };

  return (
    <div className="px-4 py-1 md:px-6 xl:px-8">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-accent hover:underline"
        aria-label="Back"
      >
        <FaArrowLeft className="text-[11px]" />
        Back
      </button>
    </div>
  );
};

export default GameBackButton;
