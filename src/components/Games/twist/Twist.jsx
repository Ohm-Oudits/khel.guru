import { useSelector } from "react-redux";
import { getSocket } from "../../../socket/socket";
import Frame from "./Frame";
import { useEffect } from "react";
import { initializeTwistSocket } from "../../../socket/games/twist";

const WheelPage = () => {
  const token = useSelector((state) => state.auth?.token);
  const socket = getSocket();

  useEffect(() => {
    if (token && socket) {
      initializeTwistSocket(token);
    }
  }, [socket, token]);

  return (
    <div className="w-full bg-secondry">
      <Frame />
    </div>
  );
};

export default WheelPage;
