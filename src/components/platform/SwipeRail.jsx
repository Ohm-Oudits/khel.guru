import { Children, useEffect, useRef, useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { classNames } from "./classNames";

const chunkItems = (items, size) => {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
};

const RailRow = ({
  items,
  className = "",
  itemClassName,
  gridClassName,
  alwaysSwipe = false,
  moreTo,
  moreLabel = "See all",
  hasMore = false,
  label,
}) => {
  const showMoreCard = Boolean(moreTo && hasMore);
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const rail = scrollRef.current;
    if (!rail) return;

    setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8);
  };

  useEffect(() => {
    const rail = scrollRef.current;
    if (!rail) return undefined;

    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateScrollState);
    observer?.observe(rail);

    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      observer?.disconnect();
    };
  }, [items.length, showMoreCard]);

  const scrollMore = () => {
    const rail = scrollRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: Math.max(rail.clientWidth * 0.7, 160),
      behavior: "smooth",
    });
  };

  return (
    <div className={classNames("relative w-full min-w-0", className)}>
      <div
        ref={scrollRef}
        role="list"
        aria-label={label}
        className={classNames(
          "scrollbar-hide flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1",
          alwaysSwipe
            ? ""
            : "md:grid md:w-full md:overflow-visible md:pb-0 md:snap-none",
          alwaysSwipe ? "" : gridClassName
        )}
      >
        {items.map((child, index) => (
          <div
            key={child.key ?? index}
            role="listitem"
            className={classNames(
              "relative shrink-0 snap-start",
              alwaysSwipe ? "" : "md:w-auto md:min-w-0 md:shrink",
              itemClassName
            )}
          >
            {child}
          </div>
        ))}
        {showMoreCard ? (
          <div
            role="listitem"
            className={classNames(
              "relative shrink-0 snap-start",
              alwaysSwipe ? "" : "md:w-auto md:min-w-0 md:shrink",
              itemClassName
            )}
          >
            <Link
              to={moreTo}
              aria-label={moreLabel}
              className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-background-tertiary transition hover:-translate-y-1 hover:border-brand-primary/40"
            >
              <div className="relative flex aspect-[4/5] flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,_rgba(0,212,170,0.18),_transparent_55%),linear-gradient(180deg,_rgba(8,8,8,0.72),_rgba(18,18,18,0.88))] text-white backdrop-blur-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/10 text-lg shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                  <FaChevronRight />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  {moreLabel}
                </span>
              </div>
            </Link>
          </div>
        ) : null}
      </div>

      {canScrollRight ? (
        <div
          className={classNames(
            "pointer-events-none absolute inset-y-0 right-0 z-20 flex w-[22%] min-w-[4.75rem] items-center justify-center",
            !alwaysSwipe && "md:hidden"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/35 to-transparent backdrop-blur-[6px] [mask-image:linear-gradient(to_left,black_40%,transparent)]" />
          <button
            type="button"
            onClick={scrollMore}
            aria-label="Swipe for more"
            className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-brand-primary/50 hover:bg-black/60"
          >
            <FaChevronRight />
          </button>
        </div>
      ) : null}
    </div>
  );
};

const SwipeRail = ({
  children,
  className = "",
  itemClassName = "w-[30vw] sm:w-[22vw]",
  gridClassName = "md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
  contained = false,
  alwaysSwipe = false,
  moreTo,
  moreLabel = "See all",
  hasMore = false,
  rowSize,
  label,
}) => {
  const items = Children.toArray(children).filter(Boolean);
  const shouldStackRows = Boolean(rowSize) && items.length > rowSize;
  const rowProps = {
    itemClassName,
    gridClassName,
    moreTo,
    moreLabel,
    hasMore,
    label,
  };

  if (shouldStackRows && !alwaysSwipe) {
    const rows = chunkItems(items, rowSize);

    return (
      <div className={classNames("flex min-w-0 flex-col gap-4", className)}>
        <div className="flex min-w-0 flex-col gap-4 md:hidden">
          {rows.map((row, index) => (
            <RailRow
              key={`${label || "rail"}-row-${index}`}
              {...rowProps}
              alwaysSwipe
              hasMore={false}
              items={row}
              label={label ? `${label} row ${index + 1}` : undefined}
            />
          ))}
        </div>
        <div className="hidden md:block">
          <RailRow {...rowProps} items={items} />
        </div>
      </div>
    );
  }

  return (
    <RailRow
      {...rowProps}
      alwaysSwipe={alwaysSwipe}
      className={className}
      items={items}
    />
  );
};

export default SwipeRail;
