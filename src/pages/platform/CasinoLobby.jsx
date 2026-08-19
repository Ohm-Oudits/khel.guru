import { Link } from "react-router-dom";
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
    <div className="px-4 pb-24 pt-6 md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-brand-primary/20 bg-[linear-gradient(135deg,_rgba(11,24,22,1)_0%,_rgba(12,12,12,1)_55%,_rgba(33,22,11,1)_100%)] p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-accent">
            Casino
          </p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
            Browse like a real product, not a loose set of game routes.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-text-secondary">
            Stake puts category entry, trending titles, and fast access at the
            center of the casino experience. This Khel Guru lobby now does the
            same while reusing the existing originals catalog.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {casinoBrowseLinks.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="rounded-[28px] border border-white/10 bg-background-secondary p-5 transition hover:-translate-y-1 hover:border-brand-primary/40"
            >
              <item.icon className="text-2xl text-brand-primary" />
              <h2 className="mt-4 text-2xl font-black text-white">
                {item.label}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {item.description}
              </p>
            </Link>
          ))}
        </section>

        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-[28px] border border-white/10 bg-background-secondary p-6"
          >
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
          </section>
        ))}
      </div>
    </div>
  );
};

export default CasinoLobby;
