import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import PlatformStateCard from "../../components/platform/PlatformStateCard";
import apiService from "../../config/api";
import { settingsSections } from "../../config/platformNavigation";

const SettingsHub = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setOverview(null);
      return;
    }

    setLoading(true);
    apiService.account
      .getOverview()
      .then((response) => {
        setOverview(response.data);
      })
      .catch(() => {
        setOverview(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Settings"
        title="Security, preferences, sessions, and verification from one top-level account hub."
        description="Stake keeps account control easy to locate. Khel Guru now has a proper Settings landing page that points into the deeper account subsections already present in the codebase."
        tone="settings"
      />

      {!user ? (
        <PlatformStateCard
          eyebrow="Account Access"
          title="Sign in to unlock verification and safer-play controls"
          description="KYC, session security, vault preferences, and safer-play limits should sit behind the signed-in account layer."
          actions={
            <>
              <button
                className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-bold text-text-inverse transition hover:bg-interactive-primaryHover"
                onClick={() => navigate("/wallet?tab=login")}
              >
                Open Login
              </button>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                onClick={() => navigate("/wallet?tab=register")}
              >
                Open Register
              </button>
            </>
          }
        />
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          <PlatformPanel className="xl:col-span-2">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Account Snapshot
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  KYC Status
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {loading
                    ? "Loading..."
                    : overview?.verification?.kycStatus || "Unavailable"}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Documents:{" "}
                  {overview?.verification?.documentStatus || "Unavailable"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  Active Sessions
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {loading
                    ? "Loading..."
                    : overview?.security?.activeSessions ?? "Unavailable"}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Current session is tracked in the platform session registry.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  Self Exclusion
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {loading
                    ? "Loading..."
                    : overview?.selfExclusion?.status || "Inactive"}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Scope: {overview?.selfExclusion?.scope || "None"}
                </p>
              </div>
            </div>
          </PlatformPanel>

          <PlatformPanel>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
              Safer Play
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Cooling Off</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {overview?.responsibleGaming?.coolingOffUntil
                    ? new Date(
                        overview.responsibleGaming.coolingOffUntil
                      ).toLocaleString()
                    : "Not active"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Deposit Limit</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Daily:{" "}
                  {overview?.responsibleGaming?.depositLimit?.daily ?? "Not set"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-bold text-white">Session Limit</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {overview?.responsibleGaming?.sessionLimitMinutes ??
                    "Not set"}{" "}
                  minutes
                </p>
              </div>
            </div>
          </PlatformPanel>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map((section) => (
          <PlatformFeatureTile
            key={section.title}
            to={section.path}
            eyebrow="Settings section"
            title={section.title}
            description={section.description}
          />
        ))}
      </section>
    </PlatformPage>
  );
};

export default SettingsHub;
