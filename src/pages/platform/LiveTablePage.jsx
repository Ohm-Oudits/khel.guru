import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LiveStudio from "../../components/Games/Live/LiveStudio";
import { apiService } from "../../config/api";

const LiveTablePage = () => {
  const { slug } = useParams();
  const [game, setGame] = useState(null);
  const [launch, setLaunch] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [gameRes, launchRes] = await Promise.all([
          apiService.games.getLiveTable(slug),
          apiService.games.launchLive(slug, { mode: "demo" }),
        ]);
        if (cancelled) return;
        setGame(gameRes.data?.game || null);
        setLaunch(launchRes.data?.launch || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "This live table is not available.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="w-full bg-secondry pt-[1px] pb-[12px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="game-stage my-12 mx-auto flex w-[96%] max-w-[1400px] items-center justify-center rounded bg-primary p-6 max-lg:my-3 max-lg:max-w-[450px] lg:h-[600px]">
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (launch?.embedUrl) {
    return (
      <div className="w-full bg-secondry pt-[1px] pb-[12px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="game-stage my-12 mx-auto w-[96%] max-w-[1400px] overflow-hidden rounded bg-primary max-lg:my-3 max-lg:max-w-[450px] lg:h-[600px]">
            <iframe
              title={launch.name || "Live table"}
              src={launch.embedUrl}
              className="h-[600px] w-full bg-black max-lg:h-[70vh]"
              allow="autoplay; fullscreen"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="w-full bg-secondry pt-[1px] pb-[12px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="game-stage my-12 mx-auto flex w-[96%] max-w-[1400px] items-center justify-center rounded bg-primary p-6 max-lg:my-3 max-lg:max-w-[450px] lg:h-[600px]">
            <p className="text-sm text-text-secondary">Opening live table…</p>
          </div>
        </div>
      </div>
    );
  }

  return <LiveStudio game={game} sessionId={launch?.sessionId} />;
};

export default LiveTablePage;
