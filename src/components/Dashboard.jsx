import { useApp } from '../context/AppContext.jsx';
import PlayerCard, { PLAYER_META } from './PlayerCard.jsx';
import QuoteWidget from './QuoteWidget.jsx';
import { calcWeekTotal } from '../utils/points.js';
import { calcGoalProbability } from '../utils/probability.js';
import { weekRangeLabel, getWeekDays, todayKey } from '../utils/dates.js';

export default function Dashboard({ currentUser }) {
  const { state } = useApp();
  const week = state.weeks[state.currentWeekId];
  const today = todayKey();

  if (!week) return null;

  const days = getWeekDays(state.currentWeekId);
  const daysLeft = days.filter((d) => d > today).length;
  const others = ['emiliano', 'nico', 'bruno'].filter((p) => p !== currentUser);

  const myPoints = calcWeekTotal(currentUser, week);
  const myGoal = week.goals?.[currentUser] ?? 0;
  const myProb = calcGoalProbability(currentUser, week);
  const myProgress = myGoal > 0 ? Math.min(100, (myPoints / myGoal) * 100) : 0;
  const meta = PLAYER_META[currentUser];
  const probColor = myProb >= 70 ? 'text-emerald-400' : myProb >= 40 ? 'text-amber-400' : 'text-red-400';

  const allPoints = ['emiliano', 'nico', 'bruno'].map((p) => calcWeekTotal(p, week));
  const myRank = allPoints.filter((p) => p > myPoints).length + 1;
  const rankLabel = myRank === 1 ? '👑 Leading' : myRank === 2 ? '🥈 2nd' : '🥉 3rd';

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Your week hero card */}
      <div className={`bg-zinc-900 border-2 ${meta.border} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Your Week</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{meta.emoji}</span>
              <span className={`text-xl font-black capitalize ${meta.text}`}>{currentUser}</span>
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{rankLabel}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-white">{myPoints.toFixed(1)}</p>
            <p className="text-zinc-500 text-sm">of {myGoal} pts</p>
          </div>
        </div>

        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>{myProgress.toFixed(0)}% of goal</span>
          <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
          <div className={`h-full ${meta.bar} transition-all`} style={{ width: `${myProgress}%` }} />
        </div>

        <div className="flex justify-between items-center bg-zinc-800/60 rounded-xl px-4 py-3">
          <span className="text-zinc-400 text-sm">Goal probability</span>
          <span className={`text-2xl font-black ${probColor}`}>{myProb}%</span>
        </div>
      </div>

      <QuoteWidget />

      {/* Others */}
      <div>
        <h2 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">The Pack</h2>
        <div className="space-y-3">
          {others.map((player) => (
            <PlayerCard key={player} playerKey={player} weekData={week} />
          ))}
        </div>
      </div>

      {/* Pot */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Prize Pool — €60</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">75% — Goal achievers</span>
            <span className="text-white font-semibold">€45</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">25% — First place</span>
            <span className="text-white font-semibold">€15</span>
          </div>
        </div>
      </div>

    </div>
  );
}
