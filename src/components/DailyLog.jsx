import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { PLAYER_META } from './PlayerCard.jsx';
import { calcWakeUpPoints, calcWorkPoints } from '../utils/points.js';
import {
  todayKey, dayLabel, shortDayLabel, isWeekday,
  getWeekId, getWeekDays, weekRangeLabel, prevWeekId, nextWeekId,
} from '../utils/dates.js';

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

function InlineWeekSetup({ weekId, dispatch }) {
  const [goals, setGoals] = useState({ emiliano: 70, nico: 70, bruno: 70 });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="text-center">
        <div className="text-3xl mb-1">📋</div>
        <h3 className="text-amber-400 font-bold">Set Up This Week</h3>
        <p className="text-zinc-500 text-sm mt-1">{weekRangeLabel(weekId)}</p>
        <p className="text-zinc-600 text-xs mt-1">Enter weekly point goals to start logging</p>
      </div>
      {PLAYERS.map((p) => {
        const meta = PLAYER_META[p];
        return (
          <div key={p} className="flex items-center gap-3">
            <span className="text-xl">{meta.emoji}</span>
            <span className={`text-sm font-semibold ${meta.text} w-20 shrink-0`}>{meta.label}</span>
            <input
              type="number"
              min="10"
              max="200"
              value={goals[p]}
              onChange={(e) => setGoals((g) => ({ ...g, [p]: parseInt(e.target.value) || 0 }))}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <span className="text-zinc-600 text-xs shrink-0">pts goal</span>
          </div>
        );
      })}
      <button
        onClick={() => dispatch({ type: 'INIT_HISTORICAL_WEEK', weekId, goals })}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors"
      >
        Create Week
      </button>
    </div>
  );
}

// Keyed on date+weekId so all local state resets when switching days
function DayLogForm({ player, date, weekId, week, dispatch, settings, isHistorical }) {
  const entry = week?.days?.[date]?.[player] || {};
  const meta = PLAYER_META[player];

  const [wakeTime, setWakeTime] = useState(entry.wakeUp?.time || '');
  const [msgSent, setMsgSent] = useState(entry.wakeUp?.messageSent || false);
  const [foodDesc, setFoodDesc] = useState(entry.food?.description || '');
  const [foodPts, setFoodPts] = useState(entry.food?.selfPoints ?? 3);
  const [addictionOk, setAddictionOk] = useState(entry.addiction?.maintained ?? true);
  const [achievedHours, setAchievedHours] = useState(entry.work?.achievedHours ?? '');

  // Historical-only: combined goal + work logging
  const [histWorkDesc, setHistWorkDesc] = useState('');
  const [histGoalHrs, setHistGoalHrs] = useState('');
  const [histAchievedHrs, setHistAchievedHrs] = useState('');

  // Next day goal
  const nextDate = (() => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const nextDateWeekId = getWeekId(new Date(nextDate + 'T12:00:00'));
  const [nextDayDesc, setNextDayDesc] = useState('');
  const [nextDayHours, setNextDayHours] = useState('');

  const [saved, setSaved] = useState({});

  const addiction = settings.players[player]?.addiction || 'instagram';
  const addictionLabel = addiction === 'smoking' ? '🚬 No smoking today' : '📱 No Instagram/X >15min/hour';

  const todayWorkGoal = week?.workGoals?.[date]?.[player];
  const isDayOff = week?.dayOff?.[player] === date;
  const canUseDayOff = !week?.dayOff?.[player];

  function flash(key) {
    setSaved((s) => ({ ...s, [key]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 1500);
  }

  function saveWakeUp() {
    if (!wakeTime) return;
    dispatch({ type: 'LOG_WAKE_UP', weekId, player, date, time: wakeTime, messageSent: msgSent });
    flash('wakeUp');
  }

  function saveFood() {
    dispatch({ type: 'LOG_FOOD', weekId, player, date, description: foodDesc, selfPoints: foodPts });
    flash('food');
  }

  function saveAddiction() {
    dispatch({ type: 'LOG_ADDICTION', weekId, player, date, maintained: addictionOk });
    flash('addiction');
  }

  function saveWork() {
    dispatch({ type: 'LOG_WORK', weekId, player, date, achievedHours: parseFloat(achievedHours) || 0 });
    flash('work');
  }

  function saveHistoricalWork() {
    const goalHours = parseFloat(histGoalHrs) || 0;
    const achievedHrs = parseFloat(histAchievedHrs) || 0;
    dispatch({ type: 'LOG_WORK_WITH_GOAL', weekId, player, date, description: histWorkDesc, goalHours, achievedHours: achievedHrs });
    flash('work');
  }

  function saveNextDayGoal() {
    const hrs = parseFloat(nextDayHours) || 0;
    if (isWeekday(nextDate) && hrs < 2) {
      alert('Weekday goal must be at least 2 hours!');
      return;
    }
    dispatch({ type: 'SET_WORK_GOAL', weekId: nextDateWeekId, player, date: nextDate, description: nextDayDesc, hours: hrs });
    flash('nextDay');
    setNextDayDesc('');
    setNextDayHours('');
  }

  const previewWakePoints = calcWakeUpPoints(wakeTime);
  const previewWorkPoints = todayWorkGoal
    ? calcWorkPoints(parseFloat(achievedHours) || 0, todayWorkGoal.hours)
    : 0;
  const previewHistWork = calcWorkPoints(parseFloat(histAchievedHrs) || 0, parseFloat(histGoalHrs) || 0);

  const existingNextGoal = week?.workGoals?.[nextDate]?.[player];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className={`flex items-center gap-3 bg-zinc-900 border ${meta.border} rounded-xl px-4 py-3`}>
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <p className={`font-black text-lg capitalize ${meta.text}`}>{player}'s Log</p>
          <p className="text-zinc-500 text-xs">{dayLabel(date)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {isDayOff && (
            <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-500/40 px-2 py-1 rounded-lg">🏖️ Day Off</span>
          )}
          {isHistorical && (
            <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded-lg">Past</span>
          )}
        </div>
      </div>

      {/* Wake Up */}
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
          <button onClick={saveWakeUp} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors">
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
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${foodPts === n ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {entry.food?.votes && Object.keys(entry.food.votes).length > 0 && (
            <p className="text-xs text-zinc-500">
              Final (strictest vote): <span className="text-amber-400 font-bold">{entry.food.finalPoints}</span>
            </p>
          )}
          <button onClick={saveFood} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors">
            {saved.food ? '✓ Saved!' : 'Save Food Log'}
          </button>
        </div>
      </Section>

      {/* Addiction */}
      <Section title="Addiction — max 4 pts">
        <div className="flex gap-3">
          <button
            onClick={() => setAddictionOk(true)}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${
              addictionOk
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-600'
            }`}
          >
            <span className="text-4xl">{addiction === 'smoking' ? '🚭' : '📵'}</span>
            <span className="text-xs font-semibold">{addiction === 'smoking' ? "Didn't smoke" : 'No Instagram/X'}</span>
            <span className="text-xs opacity-70">4 pts</span>
          </button>
          <button
            onClick={() => setAddictionOk(false)}
            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors ${
              !addictionOk
                ? 'border-red-500 bg-red-500/20 text-red-400'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-600'
            }`}
          >
            <span className="text-4xl">{addiction === 'smoking' ? '🚬' : '📱'}</span>
            <span className="text-xs font-semibold">{addiction === 'smoking' ? 'Smoked' : 'Used too much'}</span>
            <span className="text-xs opacity-70">0 pts</span>
          </button>
        </div>
        <button onClick={saveAddiction} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors">
          {saved.addiction ? '✓ Saved!' : 'Save Addiction'}
        </button>
      </Section>

      {/* Work */}
      <Section title="Work — max 4 pts">
        {todayWorkGoal ? (
          <div className="space-y-2">
            <div className="bg-zinc-800 rounded-lg p-3 text-sm">
              <p className="text-zinc-300">{todayWorkGoal.description}</p>
              <p className="text-zinc-500 mt-1">
                Goal: {todayWorkGoal.hours}h
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
            <button onClick={saveWork} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm transition-colors">
              {saved.work ? '✓ Saved!' : 'Save Work'}
            </button>
          </div>
        ) : isHistorical ? (
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs">No goal was recorded — enter goal and achievement together:</p>
            <input
              type="text"
              value={histWorkDesc}
              onChange={(e) => setHistWorkDesc(e.target.value)}
              placeholder="What did you work on?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={histGoalHrs}
                onChange={(e) => setHistGoalHrs(e.target.value)}
                placeholder="Goal hours"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min="0"
                step="0.5"
                value={histAchievedHrs}
                onChange={(e) => setHistAchievedHrs(e.target.value)}
                placeholder="Achieved hours"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            {(histGoalHrs || histAchievedHrs) && (
              <p className="text-xs text-zinc-500">
                Points: <span className="text-amber-400 font-bold">{previewHistWork}/4</span>
              </p>
            )}
            <button
              onClick={saveHistoricalWork}
              disabled={!histWorkDesc || !histGoalHrs}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm transition-colors"
            >
              {saved.work ? '✓ Saved!' : 'Log Work'}
            </button>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No work goal set for today. Set one for tomorrow below.</p>
        )}
      </Section>

      {/* Next day goal */}
      <Section title={isHistorical ? `Work Goal for ${dayLabel(nextDate)}` : "Tomorrow's Work Goal"}>
        <div className="space-y-2">
          <input
            type="text"
            value={nextDayDesc}
            onChange={(e) => setNextDayDesc(e.target.value)}
            placeholder="What will you work on?"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.5"
              value={nextDayHours}
              onChange={(e) => setNextDayHours(e.target.value)}
              placeholder={`Hours ${isWeekday(nextDate) ? '(min 2h)' : ''}`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {existingNextGoal && (
              <span className="text-xs text-emerald-400">✓ Set ({existingNextGoal.hours}h)</span>
            )}
          </div>
          <button
            onClick={saveNextDayGoal}
            disabled={!nextDayDesc || !nextDayHours}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {saved.nextDay ? '✓ Saved!' : `Set Goal for ${isHistorical ? dayLabel(nextDate) : 'Tomorrow'}`}
          </button>
          {nextDateWeekId !== weekId && (
            <p className="text-zinc-600 text-xs">Note: next day is in a different week — make sure that week is set up.</p>
          )}
          {!isHistorical && <p className="text-zinc-600 text-xs">Others can veto this in the Votes tab</p>}
        </div>
      </Section>

      {/* Day Off */}
      {canUseDayOff && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-zinc-400 font-semibold text-sm uppercase tracking-wide mb-2">Day Off 🏖️</h3>
          <p className="text-zinc-500 text-xs mb-3">Use your weekly day off — score topped up to 7 pts minimum.</p>
          <button
            onClick={() => dispatch({ type: 'USE_DAY_OFF', weekId, player, date })}
            className="w-full bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 text-purple-300 py-2 rounded-lg text-sm transition-colors"
          >
            Use Day Off Today
          </button>
        </div>
      )}
    </div>
  );
}

export default function DailyLog({ currentUser }) {
  const { state, dispatch } = useApp();
  const today = todayKey();
  const currentWeekId = getWeekId();

  const [selectedWeekId, setSelectedWeekId] = useState(currentWeekId);
  const [selectedDate, setSelectedDate] = useState(today);

  const weekDays = getWeekDays(selectedWeekId);
  const isCurrentWeek = selectedWeekId === currentWeekId;
  const week = state.weeks[selectedWeekId];

  function goToPrevWeek() {
    const prev = prevWeekId(selectedWeekId);
    setSelectedWeekId(prev);
    const prevDays = getWeekDays(prev);
    const curDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
    setSelectedDate(prevDays.find((d) => new Date(d + 'T12:00:00').getDay() === curDayOfWeek) || prevDays[0]);
  }

  function goToNextWeek() {
    if (isCurrentWeek) return;
    const next = nextWeekId(selectedWeekId);
    if (next > currentWeekId) return;
    setSelectedWeekId(next);
    const nextDays = getWeekDays(next);
    const curDayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
    const candidate = nextDays.find((d) => new Date(d + 'T12:00:00').getDay() === curDayOfWeek) || nextDays[0];
    setSelectedDate(candidate > today ? nextDays.find((d) => d <= today) || nextDays[0] : candidate);
  }

  const isHistorical = selectedDate < today || selectedWeekId < currentWeekId;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
        <button
          onClick={goToPrevWeek}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
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

      {/* Day tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {weekDays.map((d) => {
          const isFuture = d > today;
          const isSelected = d === selectedDate;
          const isToday = d === today;
          return (
            <button
              key={d}
              onClick={() => !isFuture && setSelectedDate(d)}
              disabled={isFuture}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors text-xs
                ${isSelected
                  ? 'bg-amber-500 text-black font-bold'
                  : isFuture
                    ? 'text-zinc-700 cursor-default'
                    : isToday
                      ? 'text-amber-400 hover:bg-zinc-800'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
              <span>{shortDayLabel(d)}</span>
              <span className="text-[10px] opacity-70">{d.slice(8)}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {!week ? (
        <InlineWeekSetup weekId={selectedWeekId} dispatch={dispatch} />
      ) : (
        <DayLogForm
          key={`${selectedWeekId}-${selectedDate}`}
          player={currentUser}
          date={selectedDate}
          weekId={selectedWeekId}
          week={week}
          dispatch={dispatch}
          settings={state.settings}
          isHistorical={isHistorical}
        />
      )}
    </div>
  );
}
