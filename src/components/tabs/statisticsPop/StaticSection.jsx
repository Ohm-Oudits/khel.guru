import { useState } from "react";
import { originals } from "../../../constants";

const currencies = ["INR"];

export const StatisticsSection = () => {
  const [type, settype] = useState("All");
  const [currency, setcurrency] = useState("All");

  const data = {
    bets: 1200,
    wins: 300,
    lost: 230,
    wagered: 12000,
  };

  return (
    <section>
      <div className="flex gap-x-3 ">
        <div className="order-10 md:order-2 mb-2 mt-3 w-full">
          <label
            htmlFor="type"
            className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
          >
            <h1>Type</h1>
          </label>

          <select
            className="w-full mt-2 h-full rounded bg-secondry outline-none bg-gray-900 text-white px-3 pr-6 py-1"
            value={type}
            id="risk"
            onChange={(e) => settype(e.target.value)}
          >
            <option value="All">All</option>
            {originals.map((i, index) => {
              return <option value={i.name}>{i.name}</option>;
            })}
          </select>
        </div>
        <div className="order-10 md:order-2 mb-2 mt-3 w-full">
          <label
            htmlFor="type"
            className="flex items-center mb-[-4px] pl-[2px] justify-between w-full font-semibold text-label"
          >
            <h1>Type</h1>
          </label>

          <select
            className="w-full mt-2 h-full rounded bg-secondry outline-none bg-gray-900 text-white px-3 pr-6 py-1"
            value={currency}
            id="risk"
            onChange={(e) => setcurrency(e.target.value)}
          >
            <option value="All">All</option>
            {currencies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="my-10 gap-y-2 grid grid-cols-2 gap-x-3">
        <div className="rounded-md p-4 bg-gray-900">
          <div className="text-gray-300">Total Bets</div>
          <div className="text-3xl font-bold">{data.bets}</div>
        </div>
        <div className="rounded-md p-4 bg-gray-900">
          <div className="text-gray-300">Number of wins </div>
          <div className="text-3xl font-bold">{data.wins}</div>
        </div>
        <div className="rounded-md p-4 bg-gray-900">
          <div className="text-gray-300">Number of Losses </div>
          <div className="text-3xl font-bold">{data.lost}</div>
        </div>{" "}
        <div className="rounded-md p-4 bg-gray-900">
          <div className="text-gray-300">Waggered </div>
          <div className="text-3xl font-bold">{data.wagered}</div>
        </div>
      </div>
    </section>
  );
};
