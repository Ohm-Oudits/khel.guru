import Frame from "./Frame";
import { initializeBaccaratSocket } from "../../../socket/games/baccarat";
import { useSelector } from "react-redux";
import { getSocket } from "../../../socket/socket";
import { useEffect } from "react";

const Baccarat = () => {
  const token = useSelector((state) => state.auth?.token);
  const socket = getSocket();

  useEffect(() => {
    if (token && socket) {
      initializeBaccaratSocket(token);
    }
  }, [socket, token]);

  return (
    <div className="w-full">
      <Frame />
    </div>
  );
};

export default Baccarat;
