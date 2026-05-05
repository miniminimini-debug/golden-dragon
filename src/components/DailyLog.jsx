import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { PLAYER_META } from './PlayerCard.jsx';
import { calcWakeUpPoints, calcWorkPoints } from '../utils/points.js';
import { todayKey, dayLabel, isWeekday, getWeekDays } from '../utils/dates.js';

const PLAYERS = ['emiliano', 'nico', 'bruno'];

function Section({ title, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function PointsBadge({ points, max }) {
  return (
    <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
      {points}/{max} pts
    </span>
  );
}

export default function DailyLog({ currentUser }) {
  const { state, dispatch } = useApp();
  const today = todayKey();
  const player = currentUser || state.selectedPlayer;
  const week = state.weeks[state.currentWeekId];
  const entry = week?.days?.[today]?.[player] || {};
  const meta = PLAYER_META[player];

  const [wakeTime, setWakeTime] = useState(entry.wakeUp?.time || '');
  const [msgSent, setMsgSent] = useState(entry.wakeUp?.messageSent || false);
  const [foodDesc, setFoodDesc] = useState(entry.food?.description || '');
  const [foodPts, setFoodPts] = useState(entry.food?.selfPoints ?? 3);
  const [addictionOk, setAddictionOk] = useState(entry.addiction?.maintained ?? true);
  const [achievedHours, setAchievedHours] = useState(entry.work?.achievedHours ?? '');
  const [tomorrowDesc, setTomorrowDesc] = useState('');
  const [tomorrowHours, setTomorrowHours] = useState('');
  const [saved, setSaved] = useState({});

  const addiction = state.settings.players[player]?.addiction || 'instagram';
  const addictionLabel = addiction === 'smoking' ? '🚬 No smoking today' : '📱 No Instagram/X >15min/hour';

  const tomorrow = (() => {
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const todayWorkGoal = week?.workGoals?.[today]?.[player];
  const dayOffUsed = week?.dayOff?.[player];
  const isDayOff = dayOffUsed === today;
  const canUseDayOff = !dayOffUsed;

  function flash(key) {
    setSaved((s) => ({ ...s, [key]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 1500);
  }

  function saveWakeUp() {
    if (!wakeTime) return;
    dispatch({ type: 'LOG_WAKE_UP', player, date: today, time: wakeTime, messageSent: msgSent });
    flash('wakeUp');
  }

  function saveFood() {
    dispatch({ type: 'LOG_FOOD', player, date: today, description: foodDesc, selfPoints: foodPts });
    flash('food');
  }

  function saveAddiction() {
    dispatch({ type: 'LOG_ADDICTION', player, date: today, maintained: addictionOk });
    flash('addiction');
  }

  function saveWork() {
    dispatch({ type: 'LOG_WORK', player, date: today, achievedHours: parseFloat(achievedHours) || 0 });
    flash('work');
  }

  function saveTomorrowGoal() {
    const hrs = parseFloat(tomorrowHours) || 0;
    if (isWeekday(tomorrow) && hrs < 2) {
      alert('Weekday goal must be at least 2 hours!');
      return;
    }
    dispatch({ type: 'SET_WORK_GOAL', player, date: tomorrow, description: tomorrowDesc, hours: hrs });
    flash('tomorrow');
    setTomorrowDesc('');
    setTomorrowHours('');
  }

  function useDayOff() {
    dispatch({ type: 'USE_DAY_OFF', player, date: today });
  }

  const previewWakePoints = calcWakeUpPoints(wakeTime);
  const previewWorkPoints = todayWorkGoal
    ? calcWorkPoints(parseFloat(achievedHours) || 0, todayWorkGoal.hours)
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Player selector */}
      <div className="flex gap-2">
        {PLAYERS.map((p) => {
          const m = PLAYER_META[p];
          return (
            <button
              key={p}
              onClick={() => dispatch({ type: 'SET_PLAYER', player: p })}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                state.selectedPlayer === p
                  ? `bg-zinc-800 ${m.text} ring-1 ${m.ring}`
                  : 'bg-zinc-900 text-zinc-500'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          );
        })}
      </div>

      <div className="text-center text-zinc-500 text-sm">{dayLabel(today)}</div>

      {/* Day off banner */}
      {isDayOff && (
        <div className="bg-purple-900/30 border border-purple-500/40 rounded-xl p-3 text-center">
          <span className="text-purple-300 font-semibold">🏖️ Day Off — minimum 7 pts guaranteed</span>
        </div>
      )}

      {/* Wake up */}
      <Section title="Wake Up — max 4 pts">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <PointsBadge points={previewWakePoints} max={4} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={msgSent}
              onChange={(e) => setMsgSent(e.target.checked)}
              className="accent-amber-500 w-4 h-4"
            />
            Sent wake-up message to group
          </label>
          <button
            onClick={saveWakeUp}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {saved.wakeUp ? '✓ Saved!' : 'Save Wake-Up'}
          </button>
        </div>
      </Section>

      {/* Food */}
      <Section title="Food Log — max 4 pts">
        <div className="space-y-2">
          <textarea
            value={foodDesc}
            onChange={(e) => setFoodDesc(e.target.value)}
            placeholder="What did you eat today?"
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">Self-score:</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setFoodPts(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                    foodPts === n ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {entry.food?.votes && Object.keys(entry.food.votes).length > 0 && (
            <p className="text-xs text-zinc-500">
              Final points (strictest vote): <span className="text-amber-400 font-bold">{entry.food.finalPoints}</span>
            </p>
          )}
          <button
            onClick={saveFood}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {saved.food ? '✓ Saved!' : 'Save Food Log'}
          </button>
        </div>
      </Section>

      {/* Addiction */}
      <Section title="Addiction — max 2 pts">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setAddictionOk((v) => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative ${addictionOk ? 'bg-emerald-500' : 'bg-zinc-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${addictionOk ? 'left-6' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-zinc-300">{addictionLabel}</span>
        </label>
        <p className="text-xs text-zinc-500">Points: <span className="text-amber-400 font-bold">{addictionOk ? 2 : 0}</span></p>
        <button
          onClick={saveAddiction}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors"
        >
          {saved.addiction ? '✓ Saved!' : 'Save Addiction'}
        </button>
      </Section>

      {/* Work */}
      <Section title="Work — max 4 pts">
        {todayWorkGoal ? (
          <div className="space-y-2">
            <div className="bg-zinc-800 rounded-lg p-3 text-sm">
              <p className="text-zinc-300">{todayWorkGoal.description}</p>
              <p className="text-zinc-500 mt-1">Goal: {todayWorkGoal.hours}h
                {todayWorkGoal.status === 'vetoed' && (
                  <span className="ml-2 text-red-400">⚠️ Vetoed — revise in Votes tab</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="0.5"
                value={achievedHours}
                onChange={(e) => setAchievedHours(e.target.value)}
                placeholder="Hours achieved"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <PointsBadge points={previewWorkPoints} max={4} />
            </div>
            <button
              onClick={saveWork}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors"
            >
              {saved.work ? '✓ Saved!' : 'Save Work'}
            </button>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No work goal set for today. Set one for tomorrow below.</p>
        )}
      </Section>

      {/* Tomorrow's work goal */}
      <Section title="Tomorrow's Work Goal">
        <div className="space-y-2">
          <input
            type="text"
            value={tomorrowDesc}
            onChange={(e) => setTomorrowDesc(e.target.value)}
            placeholder="What will you work on?"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.5"
              value={tomorrowHours}
              onChange={(e) => setTomorrowHours(e.target.value)}
              placeholder={`Hours ${isWeekday(tomorrow) ? '(min 2h)' : ''}`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {week?.workGoals?.[tomorrow]?.[player] && (
              <span className="text-xs text-emerald-400">✓ Set</span>
            )}
          </div>
          <button
            onClick={saveTomorrowGoal}
            disabled={!tomorrowDesc || !tomorrowHours}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {saved.tomorrow ? '✓ Saved!' : 'Set Tomorrow\'s Goal'}
          </button>
          <p className="text-zinc-600 text-xs">Others will be able to veto this in the Votes tab</p>
        </div>
      </Section>

      {/* Day off */}
      {canUseDayOff && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-zinc-400 font-semibold text-sm uppercase tracking-wide mb-2">Day Off 🏖️</h3>
          <p className="text-zinc-500 text-xs mb-3">Use your weekly day off — today's points will be topped up to 7.</p>
          <button
            onClick={useDayOff}
            className="w-full bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 text-purple-300 py-2 rounded-lg text-sm transition-colors"
          >
            Use Day Off Today
          </button>
        </div>
      )}
    </div>
  );
}
