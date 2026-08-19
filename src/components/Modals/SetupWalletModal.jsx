import React from "react";
import { useNavigate } from "react-router-dom";

// Wallet accounts are provisioned automatically at signup; deposits run
// through the cashier's payment-intent flow rather than an instant credit.
const SetupWalletModal = ({ onClose }) => {
  const navigate = useNavigate();

  const openCashier = () => {
    onClose();
    navigate("/wallet");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-background-secondary rounded-xl p-8 w-full max-w-sm shadow-lg relative transform transition-all duration-300 scale-95 animate-scale-in">
        <button
          className="absolute top-4 right-4 text-2xl text-text-tertiary hover:text-text-primary"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2 text-text-primary text-center">
          Your Wallet Is Ready
        </h2>
        <p className="text-center text-text-tertiary mb-6">
          Make your first deposit from the cashier — UPI sandbox or crypto
          testnet, your pick.
        </p>
        <button
          type="button"
          onClick={openCashier}
          className="w-full bg-interactive-primary hover:bg-interactive-primaryHover text-white font-bold py-3 rounded-lg transition-transform transform hover:scale-105"
        >
          Open Cashier
        </button>
      </div>
    </div>
  );
};

export default SetupWalletModal;
