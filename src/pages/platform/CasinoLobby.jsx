import { Link } from "react-router-dom";
import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import PlatformPanel from "../../components/platform/PlatformPanel";
import { casinoBrowseLinks } from "../../config/platformNavigation";
import { originals } from "../../constants";

const sections = [
  {
    title: "Originals Shelf",
    description: "In-house games should be the fastest path from lobby to round.",
    games: originals.slice(0, 6),
  },
  {
    title: "Table & Precision",
    description: "Classic card and wheel experiences with stronger trust surfaces.",
    games: originals.filter((game) =>
      ["Roulette", "Blackjack", "Baccarat", "Hilo"].includes(game.name)
    ),
  },
];

const CasinoLobby = () => {
  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Casino"
        title="Browse like a real product, not a loose set of game routes."
        description="Stake puts category entry, trending titles, and fast access at the center of the casino experience. This Khel Guru lobby now does the same while reusing the existing originals catalog."
        tone="casino"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {casinoBrowseLinks.map((item) => (
          <PlatformFeatureTile
            key={item.label}
            to={item.path}
            icon={item.icon}
            title={item.label}
            description={item.description}
          />
        ))}
      </section>

      {sections.map((section) => (
        <PlatformPanel key={section.title}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
                Catalog Section
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {section.description}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {section.games.map((game) => (
              <Link
                key={`${section.title}-${game.name}`}
                to={game.link}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
              >
                <div
                  className="aspect-[4/5] bg-cover bg-center"
                  style={{ backgroundImage: `url(${game.img})` }}
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {game.exclusive ? "Exclusive" : "Ready to play"}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-white">
                    {game.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {game.creator}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </PlatformPanel>
      ))}
    </PlatformPage>
  );
};

export default CasinoLobby;
