import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { calcMoneyDistribution } from '../utils/money.js';
import { calcWeekTotal, calcDayTotal } from '../utils/points.js';
import { PLAYER_META } from './PlayerCard.jsx';
import {
  weekRangeLabel, getWeekId, getWeekDays, dayLabel, shortDayLabel,
  prevWeekId, nextWeekId, todayKey,
} from '../utils/dates.js';

const PLAYERS = ['emiliano', 'nico', 'bruno'];

function getCategoryTotals(player, weekData) {
  if (!weekData?.days) return { wakeUp: 0, food: 0, addiction: 0, work: 0 };
  return Object.values(weekData.days).reduce(
    (acc, dayEntries) => {
      const e = dayEntries?.[player];
      if (!e) return acc;
      return {
        wakeUp: acc.wakeUp + (e.wakeUp?.points ?? 0),
        food: acc.food + (e.food?.finalPoints ?? 0),
        addiction: acc.addiction + (e.addiction?.points ?? 0),
        work: acc.work + (e.work?.points ?? 0),
      };
    },
    { wakeUp: 0, food: 0, addiction: 0, work: 0 }
  );
}

function Bar({ value, max, color, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-6 text-right shrink-0">{value}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DayCell({ value, hasData }) {
  if (!hasData) return <td className="text-center text-zinc-700 py-2 px-1">—</td>;
  const color = value >= 12 ? 'text-emerald-400' : value >= 8 ? 'text-amber-400' : 'text-red-400';
  return <td className={`text-center font-bold py-2 px-1 text-sm ${color}`}>{value.toFixed(0)}</td>;
}

export default function WeekSummary() {
  const { state } = useApp();
  const today = todayKey();
  const currentWeekId = getWeekId();

  const [selectedWeekId, setSelectedWeekId] = useState(currentWeekId);
  const [activeSection, setActiveSection] = useState('standings');

  const week = state.weeks[selectedWeekId];
  const isCurrentWeek = selectedWeekId === currentWeekId;

  function goToPrevWeek() {
    setSelectedWeekId(prevWeekId(selectedWeekId));
  }

  function goToNextWeek() {
    if (isCurrentWeek) return;
    const next = nextWeekId(selectedWeekId);
    if (next <= currentWeekId) setSelectedWeekId(next);
  }

  const allWeekIds = Object.keys(state.weeks).sort();

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-1">🏆</div>
        <h2 className="text-xl font-bold text-amber-400">Week Results</h2>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
        <button onClick={goToPrevWeek} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">{weekRangeLabel(selectedWeekId)}</p>
          <p className={`text-xs ${isCurrentWeek ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {isCurrentWeek ? 'Current week' : 'Past week'}
          </p>
        </div>
        <button
          onClick={goToNextWeek}
          disabled={isCurrentWeek}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {!week ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No data for this week yet
        </div>
      ) : (
        <>
          {/* Section tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {[
              { id: 'standings', label: 'Standings' },
              { id: 'breakdown', label: 'Daily' },
              { id: 'categories', label: 'By Category' },
              { id: 'history', label: 'History' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  activeSection === s.id ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* STANDINGS */}
          {activeSection === 'standings' && (
            <StandingsSection week={week} weekId={selectedWeekId} />
          )}

          {/* DAILY BREAKDOWN */}
          {activeSection === 'breakdown' && (
            <DailyBreakdown week={week} weekId={selectedWeekId} today={today} />
          )}

          {/* CATEGORY TOTALS */}
          {activeSection === 'categories' && (
            <CategorySection week={week} />
          )}

          {/* HISTORY */}
          {activeSection === 'history' && (
            <HistorySection allWeekIds={allWeekIds} weeks={state.weeks} currentWeekId={currentWeekId} today={today} />
          )}
        </>
      )}
    </div>
  );
}

function StandingsSection({ week, weekId }) {
  const dist = calcMoneyDistribution(week);
  const sorted = [...PLAYERS].sort((a, b) => dist[b].points - dist[a].points);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <div className="space-y-3">
        {sorted.map((player, rank) => {
          const meta = PLAYER_META[player];
          const d = dist[player];
          return (
            <div key={player} className={`bg-zinc-900 border ${meta.border} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{medals[rank]}</span>
                  <span className={`font-bold ${meta.text}`}>{meta.label}</span>
                  {d.isFirst && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">1st Place</span>}
                  {d.reachedGoal && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Goal ✓</span>}
                  {week.sick?.[player] && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">🤒 Sick</span>}
                </div>
                <span className="text-xl font-black text-white">{d.points.toFixed(1)} pts</span>
              </div>

              {/* Per-category mini bars */}
              <div className="mb-3 space-y-1">
                {(() => {
                  const cat = getCategoryTotals(player, week);
                  return (
                    <div className="grid grid-cols-4 gap-2 text-xs text-zinc-500">
                      <div className="text-center">
                        <div>☀️ {cat.wakeUp}</div>
                        <div className="text-zinc-700">wake</div>
                      </div>
                      <div className="text-center">
                        <div>🍽️ {cat.food}</div>
                        <div className="text-zinc-700">food</div>
                      </div>
                      <div className="text-center">
                        <div>💪 {cat.addiction}</div>
                        <div className="text-zinc-700">habit</div>
                      </div>
                      <div className="text-center">
                        <div>💼 {cat.work}</div>
                        <div className="text-zinc-700">work</div>
                      </div>
                    </div>
                  );
                })()}
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
    </>
  );
}

function DailyBreakdown({ week, weekId, today }) {
  const days = getWeekDays(weekId);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 px-3 text-zinc-500 font-semibold">Day</th>
              {PLAYERS.map((p) => {
                const meta = PLAYER_META[p];
                return (
                  <th key={p} className={`text-center py-3 px-1 font-semibold ${meta.text}`}>
                    {meta.emoji}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const isPast = d <= today;
              return (
                <tr key={d} className={`border-b border-zinc-800/50 ${d === today ? 'bg-zinc-800/30' : ''}`}>
                  <td className="py-2 px-3">
                    <span className="text-zinc-400">{shortDayLabel(d)}</span>
                    <span className="text-zinc-600 ml-1">{d.slice(8)}</span>
                    {d === today && <span className="text-amber-400 text-[10px] ml-1">today</span>}
                  </td>
                  {PLAYERS.map((p) => {
                    const entry = week.days?.[d]?.[p];
                    const isDayOff = week.dayOff?.[p] === d;
                    const hasData = !!entry;
                    const total = hasData ? calcDayTotal(entry, isDayOff) : 0;
                    return isPast ? (
                      <DayCell key={p} value={total} hasData={hasData} />
                    ) : (
                      <td key={p} className="text-center text-zinc-700 py-2 px-1">·</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-700">
              <td className="py-3 px-3 text-zinc-400 font-semibold text-xs">Total</td>
              {PLAYERS.map((p) => {
                const meta = PLAYER_META[p];
                const total = calcWeekTotal(p, week);
                const goal = week.goals?.[p] ?? 0;
                return (
                  <td key={p} className="text-center py-3 px-1">
                    <div className={`font-black text-sm ${meta.text}`}>{total.toFixed(0)}</div>
                    <div className="text-zinc-600 text-[10px]">/{goal}</div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Per-day detail rows for any day with data */}
      <div className="border-t border-zinc-800 p-4 space-y-3">
        <h4 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Day Details</h4>
        {days.filter((d) => d <= today && PLAYERS.some((p) => week.days?.[d]?.[p])).map((d) => (
          <div key={d} className="space-y-2">
            <p className="text-zinc-400 text-xs font-semibold">{dayLabel(d)}</p>
            <div className="grid grid-cols-3 gap-2">
              {PLAYERS.map((p) => {
                const entry = week.days?.[d]?.[p];
                const meta = PLAYER_META[p];
                if (!entry) return (
                  <div key={p} className="bg-zinc-800/40 rounded-lg p-2 text-center">
                    <div className={`text-xs ${meta.text}`}>{meta.emoji}</div>
                    <div className="text-zinc-700 text-xs">—</div>
                  </div>
                );
                const isDayOff = week.dayOff?.[p] === d;
                return (
                  <div key={p} className={`bg-zinc-800/60 border ${meta.border} rounded-lg p-2`}>
                    <div className={`text-xs font-bold ${meta.text} mb-1`}>{meta.emoji} {calcDayTotal(entry, isDayOff).toFixed(0)} pts</div>
                    <div className="text-zinc-600 text-[10px] space-y-0.5">
                      {entry.wakeUp && <div>☀️ {entry.wakeUp.points}pt</div>}
                      {entry.food && <div>🍽️ {entry.food.finalPoints}pt</div>}
                      {entry.addiction && <div>💪 {entry.addiction.points}pt</div>}
                      {entry.work && <div>💼 {entry.work.points}pt ({entry.work.achievedHours}h/{entry.work.goalHours}h)</div>}
                      {isDayOff && <div>🏖️ Day off</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySection({ week }) {
  const categories = [
    { key: 'wakeUp', label: '☀️ Wake-Up', max: 4 },
    { key: 'food', label: '🍽️ Food', max: 4 },
    { key: 'addiction', label: '💪 Habit', max: 4 },
    { key: 'work', label: '💼 Work', max: 4 },
  ];

  const days = Object.keys(week.days || {});
  const dayCount = days.length || 1;

  return (
    <div className="space-y-4">
      {categories.map(({ key, label, max }) => {
        const totals = PLAYERS.map((p) => getCategoryTotals(p, week)[key]);
        const maxTotal = Math.max(...totals, 1);

        return (
          <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h4 className="text-zinc-300 font-semibold text-sm mb-3">{label}</h4>
            <div className="space-y-2">
              {PLAYERS.map((p, i) => {
                const meta = PLAYER_META[p];
                const val = totals[i];
                const avg = dayCount > 0 ? (val / dayCount).toFixed(1) : '—';
                return (
                  <div key={p}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={meta.text}>{meta.emoji} {meta.label}</span>
                      <span className="text-zinc-400">{val} pts <span className="text-zinc-600">({avg}/day, max {max}/day)</span></span>
                    </div>
                    <Bar value={val} max={maxTotal} color={meta.bar} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Totals comparison */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-zinc-300 font-semibold text-sm mb-3">📊 Week Total</h4>
        <div className="space-y-2">
          {PLAYERS.map((p) => {
            const meta = PLAYER_META[p];
            const total = calcWeekTotal(p, week);
            const goal = week.goals?.[p] ?? 0;
            const pct = goal > 0 ? Math.round((total / goal) * 100) : 0;
            return (
              <div key={p}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={meta.text}>{meta.emoji} {meta.label}</span>
                  <span className="text-zinc-400">{total.toFixed(0)}/{goal} pts ({pct}%)</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${meta.bar} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HistorySection({ allWeekIds, weeks, currentWeekId, today }) {
  if (allWeekIds.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
        No history yet
      </div>
    );
  }

  const maxPoints = Math.max(
    ...allWeekIds.flatMap((wid) => PLAYERS.map((p) => calcWeekTotal(p, weeks[wid]))),
    1
  );

  return (
    <div className="space-y-4">
      {/* Week-by-week bars */}
      {allWeekIds.map((wid) => {
        const w = weeks[wid];
        const isCurrent = wid === currentWeekId;
        return (
          <div key={wid} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-300 text-sm font-semibold">{weekRangeLabel(wid)}</p>
              {isCurrent && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">In Progress</span>}
            </div>
            <div className="space-y-2">
              {PLAYERS.map((p) => {
                const meta = PLAYER_META[p];
                const total = calcWeekTotal(p, w);
                const goal = w.goals?.[p] ?? 0;
                const reachedGoal = total >= goal;
                return (
                  <div key={p}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={meta.text}>{meta.emoji} {meta.label}</span>
                      <div className="flex items-center gap-2">
                        {reachedGoal && <span className="text-emerald-400">✓</span>}
                        <span className="text-zinc-400">{total.toFixed(0)}<span className="text-zinc-600">/{goal}</span></span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full ${meta.bar} rounded-full transition-all`}
                        style={{ width: `${Math.min(100, (total / maxPoints) * 100)}%` }}
                      />
                      {/* Goal line */}
                      {goal > 0 && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-zinc-500 opacity-60"
                          style={{ left: `${Math.min(100, (goal / maxPoints) * 100)}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Summary table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-3 text-zinc-500">Week</th>
                {PLAYERS.map((p) => (
                  <th key={p} className={`text-center py-3 px-2 ${PLAYER_META[p].text}`}>{PLAYER_META[p].emoji}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allWeekIds.map((wid) => {
                const w = weeks[wid];
                const isCurrent = wid === currentWeekId;
                return (
                  <tr key={wid} className={`border-b border-zinc-800/50 ${isCurrent ? 'bg-zinc-800/30' : ''}`}>
                    <td className="py-2 px-3 text-zinc-400">
                      {weekRangeLabel(wid).split('–')[0].trim()}
                      {isCurrent && <span className="text-emerald-500 text-[10px] ml-1">●</span>}
                    </td>
                    {PLAYERS.map((p) => {
                      const meta = PLAYER_META[p];
                      const total = calcWeekTotal(p, w);
                      const goal = w.goals?.[p] ?? 0;
                      const reached = total >= goal;
                      return (
                        <td key={p} className="text-center py-2 px-2">
                          <span className={`font-bold ${reached ? meta.text : 'text-zinc-500'}`}>
                            {total.toFixed(0)}
                          </span>
                          {reached && <span className="text-emerald-400 text-[10px] ml-0.5">✓</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard across all weeks */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">All-Time Standings</h4>
        {(() => {
          const allTimePoints = PLAYERS.map((p) => ({
            player: p,
            total: allWeekIds.reduce((sum, wid) => sum + calcWeekTotal(p, weeks[wid]), 0),
            goalsReached: allWeekIds.filter((wid) => {
              const w = weeks[wid];
              return calcWeekTotal(p, w) >= (w.goals?.[p] ?? Infinity);
            }).length,
          })).sort((a, b) => b.total - a.total);

          return allTimePoints.map(({ player, total, goalsReached }, i) => {
            const meta = PLAYER_META[player];
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={player} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{medals[i]}</span>
                  <span className={`font-bold text-sm ${meta.text}`}>{meta.emoji} {meta.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-sm">{total.toFixed(0)} pts</div>
                  <div className="text-zinc-500 text-xs">{goalsReached}/{allWeekIds.length} goals</div>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
