import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getWeekId, weekRangeLabel } from '../utils/dates.js';
import { PLAYER_META } from './PlayerCard.jsx';

export default function WeekSetup({ onDone }) {
  const { state, dispatch } = useApp();
  const weekId = getWeekId();

  const [goals, setGoals] = useState({ emiliano: 70, nico: 70, bruno: 70 });
  const [addictions, setAddictions] = useState({
    emiliano: state.settings.players.emiliano.addiction,
    nico: state.settings.players.nico.addiction,
    bruno: state.settings.players.bruno.addiction,
  });

  function handleStart() {
    // Save addiction settings
    ['emiliano', 'nico', 'bruno'].forEach((p) => {
      if (addictions[p] !== state.settings.players[p].addiction) {
        dispatch({ type: 'SET_ADDICTION', player: p, addiction: addictions[p] });
      }
    });
    dispatch({ type: 'INIT_WEEK', weekId, goals });
    onDone?.();
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐉</div>
          <h2 className="text-xl font-bold text-amber-400">New Week</h2>
          <p className="text-zinc-500 text-sm mt-1">{weekRangeLabel(weekId)}</p>
          <p className="text-zinc-400 text-xs mt-1">Pot: €60 total</p>
        </div>

        <div className="space-y-5">
          {['emiliano', 'nico', 'bruno'].map((p) => {
            const meta = PLAYER_META[p];
            return (
              <div key={p} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>{meta.emoji}</span>
                  <span className={`font-semibold ${meta.text}`}>{meta.label}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-zinc-400 text-sm w-20 shrink-0">Points goal</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={goals[p]}
                    onChange={(e) => setGoals((g) => ({ ...g, [p]: parseInt(e.target.value) || 0 }))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-zinc-400 text-sm w-20 shrink-0">Addiction</label>
                  <select
                    value={addictions[p]}
                    onChange={(e) => setAddictions((a) => ({ ...a, [p]: e.target.value }))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="smoking">🚬 No smoking</option>
                    <option value="instagram">📱 No Instagram/X &gt;15min</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleStart}
          className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors"
        >
          Start the Week 🔥
        </button>
      </div>
    </div>
  );
}
