"use client";

import { useEffect, useState } from "react";

// --- QUICK OVERRIDES ---
// Set WEEK_OVERRIDE to 1..4 or null to auto-rotate.
const WEEK_OVERRIDE = 4;
// Set DAY_OVERRIDE to "monday".."sunday" or null to use today's IST day.
const DAY_OVERRIDE = null;

// Meal windows (IST)
const LUNCH_WINDOW = { startMin: 11 * 60 + 45, endMin: 14 * 60 + 15 };
const DINNER_WINDOW = { startMin: 19 * 60, endMin: 21 * 60 + 30 };

const SOURCES = [
  "/menu_with_prices_4weeks_full.json", // 4-week file
  "/fortnightly_menu.json",              // fallback 2-week file
];

// Return a Date that represents "now" in IST, then use getUTCDay/getUTCHours on it.
function nowInIST() {
  const nowUTC = new Date();
  return new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000);
}

export default function Home() {
  const [menu, setMenu] = useState(null);
  const [prices, setPrices] = useState(null);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [todayDate, setTodayDate] = useState("");
  const [debug, setDebug] = useState({ source: "", weekKey: "", day: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setError("");

        // Time/date in IST (for reliable day calculation)
        const ist = nowInIST();
        const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        const istDay = dayNames[ist.getUTCDay()];
        const day = DAY_OVERRIDE ?? istDay;

        const dateHuman = ist.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Kolkata"
        });
        if (mounted) setTodayDate(dateHuman);

        // Try to load JSON (4w first, then 2w)
        let data = null;
        let chosenSource = "";
        for (const url of SOURCES) {
          try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
              data = await res.json();
              chosenSource = url;
              break;
            }
          } catch { /* try next */ }
        }
        if (!data) throw new Error("Couldn’t load any menu JSON from /public.");

        const hasFour = !!(data.week1 || data.week2 || data.week3 || data.week4);
        const hasTwo  = !!(data.weekA || data.weekB);

        // Determine week key
        let weekKey = "";
        if (hasFour) {
          if (WEEK_OVERRIDE) {
            weekKey = `week${WEEK_OVERRIDE}`;
          } else {
            // Anchor in IST for week rotation as well
            const anchor = new Date(Date.UTC(2025, 0, 1));
            const weekNum = Math.floor((ist - anchor) / (7 * 24 * 60 * 60 * 1000));
            weekKey = `week${((weekNum % 4) + 1)}`;
          }
          if (mounted) setPrices(data.prices ?? null);
        } else if (hasTwo) {
          if (WEEK_OVERRIDE) {
            weekKey = (WEEK_OVERRIDE % 2 === 1) ? "weekA" : "weekB";
          } else {
            const anchor = new Date(Date.UTC(2025, 0, 1));
            const weekNum = Math.floor((ist - anchor) / (7 * 24 * 60 * 60 * 1000));
            weekKey = (weekNum % 2 === 0) ? "weekA" : "weekB";
          }
          if (mounted) setPrices({
            veg: 120,
            nonveg: 135,
            extras: {
              "Butter Milk": 10,
              "Fruit Juice": 50,
              "Lassi": 35,
              "Boiled Eggs": 10,
            },
          });
        } else {
          throw new Error("Menu format not recognized (expect week1..4 or weekA/weekB).");
        }

        const todaysMenu = data[weekKey]?.[day];
        if (mounted) setDebug({ source: chosenSource, weekKey, day });

        if (!todaysMenu) {
          if (mounted) setMenu("Holiday");
        } else {
          if (mounted) setMenu(todaysMenu);
        }

        // Current meal highlight (IST)
        const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
        if (mins >= LUNCH_WINDOW.startMin && mins <= LUNCH_WINDOW.endMin) {
          if (mounted) setCurrentMeal("lunch");
        } else if (mins >= DINNER_WINDOW.startMin && mins <= DINNER_WINDOW.endMin) {
          if (mounted) setCurrentMeal("dinner");
        } else {
          if (mounted) setCurrentMeal(null);
        }
      } catch (e) {
        if (mounted) setError(String(e.message || e));
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-6">
        <div className="bg-red-900/40 border border-red-700/50 p-6 rounded-xl max-w-xl w-full">
          <h1 className="text-2xl font-bold mb-2">Sindhi Mess Menu</h1>
          <p className="whitespace-pre-wrap text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        Loading…
      </main>
    );
  }

  if (menu === "Holiday") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="bg-red-900/40 p-6 rounded-lg shadow text-center">
          <h1 className="text-3xl font-bold mb-2">Sindhi Mess Menu</h1>
          <p className="text-lg">Mess Closed</p>
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
        {/* Debug: remove later */}
        /*<p className="text-xs text-gray-500 mt-1">
          source: {debug.source || "?"} · week: {debug.weekKey || "?"} · day: {debug.day || "?"}
        </p>*/
      </header>

      {/* Meals */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {Object.entries(menu).map(([meal, items]) => (
          <div
            key={meal}
            className={`relative rounded-2xl p-1 transition-transform hover:scale-[1.01]
              ${meal === currentMeal
                ? "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"
                : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"}`}
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
                    <span className="text-xs text-gray-400">₹{prices?.veg ?? 120}</span>
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
                    <span className="text-xs text-gray-400">₹{prices?.nonveg ?? 135}</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.nonveg.map((dish, idx) => (
                      <li key={idx} className="bg-gray-800 px-3 py-2 rounded-lg shadow-sm">{dish}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extras (after each meal) */}
              {prices?.extras && (
                <div className="mt-4">
                  <span className="text-yellow-400 font-semibold mb-2 block">✨ Extras</span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(prices.extras).map(([extra, price]) => (
                      <li key={extra} className="bg-gray-800 px-3 py-2 rounded-lg shadow-sm flex justify-between">
                        <span>{extra}</span>
                        <span className="text-gray-400">₹{price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="text-gray-600 text-xs text-center py-6">
        Sindhi Mess · Designed with ❤️
      </footer>
    </main>
  );
}
