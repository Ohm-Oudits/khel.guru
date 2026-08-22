import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import HouseSlotMachine from "../../components/Games/Slots/HouseSlotMachine";
import { apiService } from "../../config/api";

const SlotSandboxPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [game, setGame] = useState(null);
  const [launch, setLaunch] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [gameRes, launchRes] = await Promise.all([
          apiService.games.getSlot(slug),
          apiService.games.launchSlot(slug, { mode: "demo" }),
        ]);
        if (cancelled) return;
        setGame(gameRes.data?.game || null);
        setLaunch(launchRes.data?.launch || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "This slot is not available.");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const session = searchParams.get("session") || launch?.sessionId;
  const embedUrl = launch?.embedUrl;

  if (error) {
    return (
      <div className="w-full bg-secondry pt-[1px] pb-[12px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="game-stage my-12 max-lg:my-3 mx-auto flex w-[96%] max-w-[1400px] items-center justify-center rounded bg-primary p-6 max-lg:max-w-[450px] lg:h-[600px]">
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <div className="w-full bg-secondry pt-[1px] pb-[12px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="game-stage my-12 max-lg:my-3 mx-auto w-[96%] max-w-[1400px] overflow-hidden rounded bg-primary max-lg:max-w-[450px] lg:h-[600px]">
            <iframe
              title={game?.name || "Partner slot"}
              src={embedUrl}
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
          <div className="game-stage my-12 max-lg:my-3 mx-auto flex w-[96%] max-w-[1400px] items-center justify-center rounded bg-primary p-6 max-lg:max-w-[450px] lg:h-[600px]">
            <p className="text-sm text-text-secondary">Loading reels…</p>
          </div>
        </div>
      </div>
    );
  }

  return <HouseSlotMachine game={game} sessionId={session} />;
};

export default SlotSandboxPage;
