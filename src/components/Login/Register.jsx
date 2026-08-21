import { useEffect, useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaTelegram,
  FaTwitter,
} from "react-icons/fa";
import { FaBoltLightning } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  register,
  googleAuth,
  telegramAuth,
  xAuth,
  instantRegister,
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

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [code, setCode] = useState(false);
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [instant, setInstant] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const [details, setDetails] = useState(false);
  const [usernameDetails, setUsernameDetails] = useState("");
  const [passwordDetails, setPasswordDetails] = useState("");
  const [email, setEmail] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [close, setClose] = useState(false);

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
  }, [isAuthenticated, navigate]);

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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!age || !terms) {
      alert("Please accept all required terms and conditions");
      return;
    }

    if (!usernameDetails || !email || !passwordDetails) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await dispatch(
        register({
          username: usernameDetails,
          email,
          password: passwordDetails,
        })
      ).unwrap();
      dispatch(fetchContinueGames());
      toast.success("User Logged In Successfully");
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const handleInstantRegister = async () => {
    setInstantLoading(true);
    try {
      const result = await dispatch(instantRegister()).unwrap();
      setInstant(false);
      setDetails(true);
      setUsernameDetails(result.credentials.username);
      setPasswordDetails(result.credentials.password);
      dispatch(fetchContinueGames());
    } catch (error) {
      console.error("Instant registration error:", error);
    } finally {
      setInstantLoading(false);
      toast.success("User Logged In Successfully");
    }
  };

  const copyCredentials = () => {
    const nextCredentials = {
      username: usernameDetails,
      password: passwordDetails,
    };
    navigator.clipboard.writeText(JSON.stringify(nextCredentials, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", "YOUR_BOT_NAME");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    document.head.appendChild(script);

    window.onTelegramAuth = (user) => {
      dispatch(
        telegramAuth({
          telegramId: user.id.toString(),
          username: user.username || `tg${user.id}`,
        })
      );
      dispatch(fetchContinueGames());
    };

    return () => {
      document.head.removeChild(script);
      delete window.onTelegramAuth;
    };
  }, [dispatch]);

  return (
    <>
      {instant && !close && (
        <NestedAuthDialog onClose={() => setInstant(false)}>
          <h2 className="text-center text-xl font-black text-white">
            Instant registration
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            This creates a random username and a strong password. Save them
            somewhere safe.
          </p>
          <div className="mt-5 flex gap-2">
            {instantLoading ? (
              <div className="flex w-full flex-col items-center gap-3 py-2">
                <AuthSpinner />
                <p className="text-sm text-text-secondary">
                  Creating your account...
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleInstantRegister}
                  className={authPrimaryButtonClass}
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setInstant(false)}
                  className={authSecondaryButtonClass}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </NestedAuthDialog>
      )}

      {details && (
        <NestedAuthDialog onClose={() => setDetails(false)}>
          <h2 className="text-center text-xl font-black text-white">
            Your account credentials
          </h2>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white">
            {JSON.stringify(
              {
                username: usernameDetails,
                password: passwordDetails,
              },
              null,
              2
            )}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={copyCredentials}
              className={authPrimaryButtonClass}
            >
              {isCopied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDetails(false);
                setClose(false);
              }}
              className={authSecondaryButtonClass}
            >
              Close
            </button>
          </div>
        </NestedAuthDialog>
      )}

      <AuthModalShell onClose={handleClose}>
        <h1 className="text-2xl font-black leading-tight text-white">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => handleTabNavigation("login")}
            className={authLinkClass}
          >
            Login
          </button>
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className={authLabelClass}>
              Username
            </label>
            <input
              id="username"
              onChange={(e) => setUsernameDetails(e.target.value)}
              className={authInputClass}
              placeholder="Username"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={authLabelClass}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              placeholder="Email address"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                onChange={(e) => setPasswordDetails(e.target.value)}
                className={`${authInputClass} pr-10`}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary transition hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="text-xs text-text-tertiary">
              Password must be at least 7 characters
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-black/25 accent-brand-primary"
              checked={code}
              onChange={() => setCode(!code)}
            />
            Referral code (optional)
          </label>
          {code && (
            <input
              id="code"
              type="text"
              className={authInputClass}
              placeholder="Referral code"
            />
          )}

          <div className="h-px w-full bg-white/10" />

          <label className="flex items-start gap-2 text-sm font-medium text-text-secondary">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/25 accent-brand-primary"
              checked={age}
              onChange={() => setAge(!age)}
            />
            I confirm I am 18 or older, in a permitted territory, and have no
            self-exclusions.
          </label>

          <label className="flex items-start gap-2 text-sm font-medium text-text-secondary">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/25 accent-brand-primary"
              checked={terms}
              onChange={() => setTerms(!terms)}
            />
            I have read and accept the Terms of Service, Privacy Policy, and
            Responsible Gambling Policy.
          </label>

          <button
            type="submit"
            disabled={loading}
            className={authPrimaryButtonClass}
          >
            {loading ? <AuthSpinner /> : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
          or continue with
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={authSecondaryButtonClass}
          >
            <FaGoogle />
            Google
          </button>
          <button
            type="button"
            onClick={handleTelgramClick}
            className={authSecondaryButtonClass}
          >
            <FaTelegram />
            Telegram
          </button>
          <button
            type="button"
            onClick={handleTwitterLogin}
            className={authSecondaryButtonClass}
          >
            <FaTwitter />
            X
          </button>
          <button
            type="button"
            onClick={() => setInstant(!instant)}
            className={authSecondaryButtonClass}
          >
            {instantLoading ? (
              <AuthSpinner />
            ) : (
              <>
                <FaBoltLightning />
                Instant
              </>
            )}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-text-muted">
          This site is protected by reCAPTCHA and the Google Privacy Policy and
          Terms of Service apply.
        </p>
      </AuthModalShell>
    </>
  );
};

export default Register;
