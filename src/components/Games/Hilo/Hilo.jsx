import { useSelector } from "react-redux";
import { getSocket } from "../../../socket/socket";
import Frame from "./Frame";
import { useEffect } from "react";
import { initializeHiloSocket } from "../../../socket/games/hilo";

const Hilo = () => {
  const token = useSelector((state) => state.auth?.token);
  const socket = getSocket();

  useEffect(() => {
    if (token && socket) {
      initializeHiloSocket(token);
    }
  }, [socket, token]);

  return (
    <div className="w-full">
      <Frame />
    </div>
  );
};

export default Hilo;
