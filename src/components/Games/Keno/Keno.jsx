import { useSelector } from "react-redux";
import Frame from "./Frame";

const Keno = () => {
  const token = useSelector((state) => state.auth?.token);

  return (
    <div className="w-full bg-secondry">
      <div className="max-w-[1200px] mx-auto">
        <Frame key={token ? "authed" : "guest"} />
      </div>
    </div>
  );
};

export default Keno;
