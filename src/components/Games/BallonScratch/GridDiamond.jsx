const GridDiamond = ({ color = "green", reveal = false }) => (
  <div
    className={`grid-diamond grid-diamond--${color}${reveal ? " grid-diamond--reveal" : ""}`}
    aria-hidden="true"
  />
);

export default GridDiamond;
