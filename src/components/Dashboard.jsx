import { useApp } from '../context/AppContext.jsx';
import PlayerCard from './PlayerCard.jsx';
import QuoteWidget from './QuoteWidget.jsx';
import { calcWeekTotal } from '../utils/points.js';
import { weekRangeLabel, getWeekDays, todayKey } from '../utils/dates.js';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const week = state.weeks[state.currentWeekId];
  const today = todayKey();

  if (!week) return null;

  const days = getWeekDays(state.currentWeekId);
  const daysElapsed = days.filter((d) => d <= today).length;
  const daysLeft = 7 - daysElapsed;

  const standings = ['emiliano', 'nico', 'bruno']
    .map((p) => ({ player: p, points: calcWeekTotal(p, week) }))
    .sort((a, b) => b.points - a.points);

  function handlePlayerClick(player) {
    dispatch({ type: 'SET_PLAYER', player });
    dispatch({ type: 'SET_TAB', tab: 'log' });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-xs">Week {state.currentWeekId?.split('-W')[1]}</p>
          <p className="text-zinc-400 text-sm">{weekRangeLabel(state.currentWeekId)}</p>
        </div>
        <div className="text-right">
          <p className="text-amber-400 font-bold text-lg">€60 pot</p>
          <p className="text-zinc-500 text-xs">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</p>
        </div>
      </div>

      <QuoteWidget />

      <div className="space-y-3">
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Standings</h2>
        {standings.map(({ player }, rank) => (
          <div key={player} className="relative">
            {rank === 0 && (
              <span className="absolute -top-2 -right-1 text-lg z-10">👑</span>
            )}
            <PlayerCard
              playerKey={player}
              weekData={week}
              onClick={() => handlePlayerClick(player)}
            />
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Prize Pool</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">75% — Goal achievers</span>
            <span className="text-white font-semibold">€45.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">25% — First place</span>
            <span className="text-white font-semibold">€15.00</span>
          </div>
          <div className="border-t border-zinc-800 pt-2 flex justify-between">
            <span className="text-zinc-500">Total</span>
            <span className="text-amber-400 font-bold">€60.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
