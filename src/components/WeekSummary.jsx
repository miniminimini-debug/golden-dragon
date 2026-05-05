import { useApp } from '../context/AppContext.jsx';
import { calcMoneyDistribution } from '../utils/money.js';
import { calcWeekTotal } from '../utils/points.js';
import { PLAYER_META } from './PlayerCard.jsx';
import { weekRangeLabel, getWeekId } from '../utils/dates.js';

const PLAYERS = ['emiliano', 'nico', 'bruno'];

export default function WeekSummary() {
  const { state, dispatch } = useApp();
  const week = state.weeks[state.currentWeekId];

  if (!week) return <div className="p-4 text-zinc-500 text-center">No active week</div>;

  const dist = calcMoneyDistribution(week);
  const sorted = [...PLAYERS].sort((a, b) => dist[b].points - dist[a].points);

  function startNewWeek() {
    dispatch({ type: 'SET_TAB', tab: 'dashboard' });
    // Force week setup by clearing currentWeekId (new week will show setup)
    // We'll handle this by setting currentWeekId to the new week which doesn't exist yet
    const newWeekId = getWeekId();
    if (newWeekId !== state.currentWeekId) {
      dispatch({ type: 'SET_WEEK_ID', weekId: newWeekId });
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-xl font-bold text-amber-400">Week Summary</h2>
        <p className="text-zinc-500 text-sm">{weekRangeLabel(state.currentWeekId)}</p>
      </div>

      {/* Final standings */}
      <div className="space-y-3">
        {sorted.map((player, rank) => {
          const meta = PLAYER_META[player];
          const d = dist[player];
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <div key={player} className={`bg-zinc-900 border ${meta.border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{medals[rank]}</span>
                  <span className={`font-bold ${meta.text}`}>{meta.label}</span>
                  {d.isFirst && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">1st Place</span>}
                  {d.reachedGoal && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Goal ✓</span>}
                  {week.sick?.[player] && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">🤒 Sick</span>}
                </div>
                <span className="text-xl font-black text-white">{d.points.toFixed(1)} pts</span>
              </div>
              <div className="text-xs text-zinc-500 space-y-1">
                <div className="flex justify-between">
                  <span>Goal ({d.goal} pts)</span>
                  <span className={d.reachedGoal ? 'text-emerald-400' : 'text-red-400'}>
                    {d.reachedGoal ? '✓ Reached' : '✗ Missed'}
                  </span>
                </div>
              </div>
              <div className="mt-3 border-t border-zinc-800 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>From goal pool</span>
                  <span>€{d.fromGoal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>From 1st place</span>
                  <span>€{d.fromFirst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-zinc-800 pt-2 mt-1">
                  <span className={meta.text}>Total payout</span>
                  <span className="text-white">€{d.total.toFixed(2)}</span>
                </div>
                {week.sick?.[player] && d.total < d.fromGoal + d.fromFirst && (
                  <p className="text-red-400 text-xs">Capped at €20 (sick rule)</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pot breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm">
        <h3 className="text-zinc-400 font-semibold uppercase tracking-wider text-xs mb-3">Pot Breakdown</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Total pot</span>
            <span className="text-white">€60.00</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Goal pool (75%)</span>
            <span>€45.00</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>1st place (25%)</span>
            <span>€15.00</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: 'SET_TAB', tab: 'dashboard' })}
        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
