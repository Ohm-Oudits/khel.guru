import { useSelector } from "react-redux";
import Frame from "./Frame";
import "./pump.css";
import { useEffect } from "react";
import { initializePumpSocket } from "../../../socket/games/pump";

const PumpPage = () => {
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (authToken) {
      initializePumpSocket(authToken);
    }
  }, [token]);

  return (
    <div className="w-full bg-secondry">
      <div className="max-w-[1200px] mx-auto">
        <Frame />
      </div>
    </div>
  );
};

export default PumpPage;
