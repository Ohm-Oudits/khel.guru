import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserData } from "../store/slices/authSlice";
import { fetchContinueGames, getPopularGames } from "../store/slices/gameSlice";
import { initializeSocket } from "../socket/socket";
import { attachBetSettledListener } from "../socket/betNotifications";

export const useAuthState = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const token = useSelector((state) => state.auth?.token);
  const authLoading = useSelector((state) => state.auth?.loading);

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication and socket connection
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
          // Dispatch user data fetch and continue games
          await Promise.all([
            dispatch(fetchUserData()),
            dispatch(fetchContinueGames()),
          ]);

          // Initialize socket connection
          initializeSocket(storedToken);
          attachBetSettledListener();
        }

        // Always fetch popular games regardless of auth status
        dispatch(getPopularGames());
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Update initialization state when auth state changes
  useEffect(() => {
    if (!authLoading) {
      setIsInitialized(true);
    }
  }, [authLoading]);

  return {
    user,
    token,
    authLoading,
    isInitialized,
    isAuthenticated: !!user && !!token,
  };
};
