import { useSelector } from "react-redux";
import Frame from "./Frame";
import { useEffect } from "react";
import { initializeCrashSocket } from "../../../socket/games/crash";

const Crash = () => {
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    initializeCrashSocket(token);
  }, [token]);

  return (
    <div className="w-full bg-secondry min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <Frame />
      </div>
    </div>
  );
};

export default Crash;
