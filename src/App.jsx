import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";

// Components
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import Layout from "./components/Layout/Layout";
import AppRoutes from "./components/Routes/AppRoutes";
import ModalContainer from "./components/Modals/ModalContainer";

// Hooks
import { useAuthState } from "./hooks/useAuthState";
import { useModalState } from "./hooks/useModalState";

// Toast notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { isInitialized } = useAuthState();
  const { modals, isAnyModalOpen } = useModalState();
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <LoadingSpinner
          size="xl"
          text="Loading Khel Guru..."
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background-primary">
        {/* Modal Overlay */}
        {isAnyModalOpen && <ModalContainer modals={modals} />}

        {/* Main Layout */}
        <Layout>
          <AppRoutes />
        </Layout>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={150}
          limit={3}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover={false}
          theme="dark"
          toastClassName="bg-background-secondary border border-border-primary"
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
