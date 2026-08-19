import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaShieldAlt } from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";
import { TransactionType } from "./LeftSection";
import apiService from "../../config/api";

const FAIRNESS_GAME_KEY = "dice";

const Verify = () => {
  const user = useSelector((state) => state.auth?.user);
  const [fairnessOverview, setFairnessOverview] = useState(null);
  const [kycProfile, setKycProfile] = useState(null);
  const [currentSeed, setCurrentSeed] = useState(null);
  const [seedHistory, setSeedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    let active = true;

    const loadVerificationData = async () => {
      setLoading(true);

      try {
        const fairnessRequest = apiService.games.getFairnessOverview();
        const requests = [fairnessRequest];

        if (user) {
          requests.push(apiService.account.getKycProfile());
          requests.push(apiService.games.getFairnessCurrentSeed(FAIRNESS_GAME_KEY));
          requests.push(apiService.games.getFairnessSeeds());
        }

        const [fairnessResponse, kycResponse, currentSeedResponse, seedHistoryResponse] =
          await Promise.all(requests);

        if (!active) {
          return;
        }

        setFairnessOverview(fairnessResponse.data);
        setKycProfile(kycResponse?.data?.kycProfile || null);
        setCurrentSeed(currentSeedResponse?.data?.seed || null);
        setSeedHistory(seedHistoryResponse?.data?.seeds || []);
      } catch {
        if (!active) {
          return;
        }

        setFairnessOverview(null);
        setKycProfile(null);
        setCurrentSeed(null);
        setSeedHistory([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadVerificationData();

    return () => {
      active = false;
    };
  }, [user]);

  const handleRotateSeed = async () => {
    setRotating(true);

    try {
      await apiService.games.rotateFairnessSeed(FAIRNESS_GAME_KEY);
      const [currentSeedResponse, seedHistoryResponse] = await Promise.all([
        apiService.games.getFairnessCurrentSeed(FAIRNESS_GAME_KEY),
        apiService.games.getFairnessSeeds(),
      ]);

      setCurrentSeed(currentSeedResponse.data.seed);
      setSeedHistory(seedHistoryResponse.data.seeds);
    } finally {
      setRotating(false);
    }
  };

  return (
    <main className="m p-6 max-w-[1200px] flex justify-between mx-auto text-white">
      <TransactionType type={"Verify"} />
      <section className="max-w-[900px] w-full bg-gray-900 p-4 py-6 rounded-md">
        <div className="rounded-md border border-gray-700 bg-gray-800 p-6">
          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <FaShieldAlt className="text-[#00D4AA]" size={26} />
              <div>
                <h2 className="text-xl font-semibold">
                  Verification and provably fair controls
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  KYC readiness, seed rotation, and fairness verification now
                  live in one account surface.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-gray-700 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#00D4AA]">
                KYC Status
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                {loading ? "Loading..." : kycProfile?.status || "Sign in required"}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Documents:{" "}
                {kycProfile?.documentStatus || "Not started"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Risk: {kycProfile?.riskStatus || "Unavailable"}
              </p>
            </div>

            <div className="rounded-md border border-gray-700 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#00D4AA]">
                Current Dice Seed
              </p>
              <h3 className="mt-2 text-lg font-black text-white break-all">
                {loading
                  ? "Loading..."
                  : currentSeed?.serverSeedHash || "Sign in to create a seed"}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Client seed: {currentSeed?.clientSeed || "Unavailable"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Nonce: {currentSeed?.nonce ?? "Unavailable"}
              </p>
              {user ? (
                <button
                  onClick={handleRotateSeed}
                  disabled={rotating}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00D4AA] px-4 py-2 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FaRotateRight />
                  {rotating ? "Rotating..." : "Rotate Seed"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-md border border-gray-700 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#00D4AA]">
                Supported Fairness Games
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(fairnessOverview?.games || []).map((game) => (
                  <div
                    key={game.gameKey}
                    className="rounded-md border border-gray-700 bg-gray-800 p-4"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Mode: {game.verificationMode}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Edge:{" "}
                      {game.defaultHouseEdgePercent !== null
                        ? `${game.defaultHouseEdgePercent}%`
                        : "Pending shared round engine"}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Status: {game.engineStatus}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-gray-700 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#00D4AA]">
                Verification Flow
              </p>
              <div className="mt-4 space-y-3">
                {(fairnessOverview?.verificationSteps || []).map((step) => (
                  <div
                    key={step}
                    className="rounded-md border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {user ? (
            <div className="mt-6 rounded-md border border-gray-700 bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#00D4AA]">
                Revealed Seed History
              </p>
              <div className="mt-4 space-y-3">
                {seedHistory.length ? (
                  seedHistory.slice(0, 5).map((seed) => (
                    <div
                      key={seed.id}
                      className="rounded-md border border-gray-700 bg-gray-800 p-4"
                    >
                      <p className="text-sm font-semibold text-white">
                        {seed.gameKey} {seed.status}
                      </p>
                      <p className="mt-2 break-all text-xs text-gray-400">
                        Hash: {seed.serverSeedHash}
                      </p>
                      {seed.serverSeed ? (
                        <p className="mt-2 break-all text-xs text-gray-400">
                          Revealed seed: {seed.serverSeed}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">
                          Server seed stays hidden until rotation.
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-gray-700 bg-gray-800 p-4 text-sm text-gray-400">
                    Rotate a seed to reveal previous hashes and build a
                    verifiable history.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export default Verify;
