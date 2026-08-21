import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaTelegram,
  FaTwitter,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  googleAuth,
  xAuth,
  telegramAuth,
} from "../../store/slices/authSlice";
import { auth, googleProvider, twitterProvider } from "../../config/firebase";
import { signInWithPopup } from "firebase/auth";
import { toast } from "react-toastify";
import { fetchContinueGames } from "../../store/slices/gameSlice";
import AuthModalShell, {
  AuthSpinner,
  NestedAuthDialog,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from "./AuthModalShell";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [forgotPassword, setForgotPassword] = useState(false);
  const [restore, setRestore] = useState(false);
  const [sendingRestore, setSendingRestore] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      const currentPath = location.pathname;
      const params = new URLSearchParams(location.search);

      if (params.has("tab")) {
        params.delete("tab");
        const newSearch = params.toString();
        navigate(`${currentPath}${newSearch ? `?${newSearch}` : ""}`, {
          replace: true,
        });
      }
    }
  }, [isAuthenticated, location, navigate]);

  const handleTabNavigation = (tab) => {
    navigate(`?tab=${tab}`, { replace: true });
  };

  const handleClose = () => {
    navigate(window.location.pathname, { replace: true });
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await dispatch(
        googleAuth({
          googleId: user.uid,
          email: user.email,
        })
      ).unwrap();

      dispatch(fetchContinueGames());
      toast.success("User Logged In Successfully");
    } catch (error) {
      console.error("Google auth error:", error);
    }
  };

  const handleTwitterLogin = async () => {
    try {
      const result = await signInWithPopup(auth, twitterProvider);
      const user = result.user;

      await dispatch(
        xAuth({
          xId: user.uid,
        })
      ).unwrap();
      dispatch(fetchContinueGames());

      toast.success("User Logged In Successfully");
    } catch (error) {
      console.error("Twitter auth error:", error);
    }
  };

  const handleTelgramClick = () => {
    if (window.Telegram?.Login?.auth) {
      window.Telegram.Login.auth(
        {
          bot_id: "7946592761",
          request_access: "write",
        },
        async (user) => {
          if (!user) return;

          try {
            await dispatch(
              telegramAuth({
                telegramId: user.id.toString(),
                first_name: user.first_name,
                auth_date: user.auth_date,
                hash: user.hash,
              })
            ).unwrap();
            dispatch(fetchContinueGames());

            toast.success("User Logged In Successfully");
          } catch (error) {
            console.error("Telegram auth error:", error);
          }
        }
      );
    } else {
      console.error("Telegram widget not loaded yet");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await dispatch(login({ email, password, rememberMe })).unwrap();
      dispatch(fetchContinueGames());
      toast.success("User Logged In Successfully");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <>
      {forgotPassword && (
        <NestedAuthDialog onClose={() => setForgotPassword(false)}>
          {!restore && (
            <h2 className="text-center text-xl font-black text-white">
              Forgot password?
            </h2>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {!restore && (
              <input
                id="femail"
                disabled={restore}
                className={authInputClass}
                placeholder="Enter your email address"
              />
            )}
            {!restore && (
              <button
                type="button"
                onClick={() => {
                  setSendingRestore(true);
                  setTimeout(() => {
                    setSendingRestore(false);
                    setRestore(true);
                  }, 1000);
                }}
                className={authPrimaryButtonClass}
              >
                {sendingRestore ? <AuthSpinner /> : "Restore password"}
              </button>
            )}
            {restore && (
              <p className="text-center text-sm text-text-secondary">
                A recovery link to reset your password was sent to your email.
              </p>
            )}
          </div>
        </NestedAuthDialog>
      )}

      <AuthModalShell onClose={handleClose}>
        <h1 className="text-2xl font-black leading-tight text-white">
          Login to your account
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => handleTabNavigation("register")}
            className={authLinkClass}
          >
            Register
          </button>
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className={authLabelClass}>
              Username or Email
            </label>
            <input
              id="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              placeholder="Username or email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${authInputClass} pr-10`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-black/25 accent-brand-primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setForgotPassword(true)}
              className="text-sm text-text-tertiary transition hover:text-white"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={authPrimaryButtonClass}
          >
            {loading ? <AuthSpinner /> : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
          or continue with
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={authSecondaryButtonClass}
          >
            <FaGoogle />
            <span className="hidden sm:inline">Google</span>
          </button>
          <button
            type="button"
            onClick={handleTelgramClick}
            className={authSecondaryButtonClass}
          >
            <FaTelegram />
            <span className="hidden sm:inline">Telegram</span>
          </button>
          <button
            type="button"
            onClick={handleTwitterLogin}
            className={authSecondaryButtonClass}
          >
            <FaTwitter />
            <span className="hidden sm:inline">X</span>
          </button>
        </div>
      </AuthModalShell>
    </>
  );
};

export default Login;
