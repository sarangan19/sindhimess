"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [menu, setMenu] = useState(null);
  const [prices, setPrices] = useState(null);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    async function fetchMenu() {
      const res = await fetch("/menu_with_prices_4weeks_full.json");
      const data = await res.json();

      setPrices(data.prices);

      // Week logic
      const today = new Date();
      const startDate = new Date("2025-01-01");
      const weekNumber = Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000));
      const weekIndex = (weekNumber % 4) + 1; // 1,2,3,4
      const weekType = `week${weekIndex}`;

      const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      const day = days[today.getDay()];

      // Date string
      setTodayDate(today.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }));

      const todaysMenu = data[weekType][day];
      setMenu(todaysMenu);

      // Detect current meal (IST)
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000);
      const totalMinutes = nowIST.getUTCHours() * 60 + nowIST.getUTCMinutes();

      const lunchStart = 11*60 + 30, lunchEnd = 14*60 + 30;
      const dinnerStart = 19*60, dinnerEnd = 21*60 + 30;

      if (totalMinutes >= lunchStart && totalMinutes <= lunchEnd) {
        setCurrentMeal("lunch");
      } else if (totalMinutes >= dinnerStart && totalMinutes <= dinnerEnd) {
        setCurrentMeal("dinner");
      }
    }
    fetchMenu();
  }, []);

  if (!menu) return <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Loading...</main>;

  if (menu === "Holiday") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="bg-red-900/40 p-6 rounded-lg shadow text-center">
          <h1 className="text-3xl font-bold mb-2">Sindhi Mess Menu</h1>
          <p className="text-lg">Mess Closed (Sunday)</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="w-full py-6 text-center border-b border-gray-800">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Sindhi Mess Menu
        </h1>
        <p className="text-sm text-gray-400 mt-1">{todayDate}</p>
      </header>

      {/* Meals */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {Object.entries(menu).map(([meal, items]) => (
          <div
            key={meal}
            className={`relative rounded-2xl p-1 transition-transform hover:scale-[1.01] 
              ${meal === currentMeal ? "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"}`}
          >
            <div className="rounded-xl p-6 bg-gray-900">
              <h2 className="text-xl font-semibold capitalize mb-4 flex justify-between items-center">
                <span>🍽️ {meal}</span>
                {meal === "lunch" && <span className="text-xs text-gray-400">11:45 – 14:15 IST</span>}
                {meal === "dinner" && <span className="text-xs text-gray-400">19:00 – 21:30 IST</span>}
              </h2>

              {items.veg?.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-400 font-semibold">Veg</span>
                    <span className="text-xs text-gray-400">₹{prices?.veg}</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.veg.map((dish, idx) => (
                      <li key={idx} className="bg-gray-800 px-3 py-2 rounded-lg shadow-sm">{dish}</li>
                    ))}
                  </ul>
                </div>
              )}

              {items.nonveg?.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-red-400 font-semibold">Non-Veg</span>
                    <span className="text-xs text-gray-400">₹{prices?.nonveg}</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.nonveg.map((dish, idx) => (
                      <li key={idx} className="bg-gray-800 px-3 py-2 rounded-lg shadow-sm">{dish}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extras */}
              <div className="mt-4">
                <span className="text-yellow-400 font-semibold mb-2 block">✨ Extras</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(prices?.extras || {}).map(([extra, price]) => (
                    <li key={extra} className="bg-gray-800 px-3 py-2 rounded-lg shadow-sm flex justify-between">
                      <span>{extra}</span>
                      <span className="text-gray-400">₹{price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="text-gray-600 text-xs text-center py-6">
        Sindhi Mess · Designed with ❤️
      </footer>
    </main>
  );
}
