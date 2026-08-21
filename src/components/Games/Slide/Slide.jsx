import { useSelector } from "react-redux";
import SlideFrame from "./Frame";

const SlidePage = () => {
  return (
    <div className="w-full bg-secondry">
      <div className="max-w-[1200px] mx-auto">
        <SlideFrame />
      </div>
    </div>
  );
};

export default SlidePage;
