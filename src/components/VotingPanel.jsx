import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { PLAYER_META } from './PlayerCard.jsx';
import { todayKey, getWeekDays } from '../utils/dates.js';

const PLAYERS = ['emiliano', 'nico', 'bruno'];

export default function VotingPanel() {
  const { state, dispatch } = useApp();
  const week = state.weeks[state.currentWeekId];
  const today = todayKey();
  const days = week ? getWeekDays(state.currentWeekId) : [];
  const pastAndToday = days.filter((d) => d <= today);

  const [voter, setVoter] = useState('emiliano');

  if (!week) return <div className="p-4 text-zinc-500 text-center">No active week</div>;

  // Collect pending food votes
  const pendingFoodVotes = [];
  pastAndToday.forEach((date) => {
    PLAYERS.forEach((target) => {
      if (target === voter) return;
      const food = week.days?.[date]?.[target]?.food;
      if (!food) return;
      if (food.votes?.[voter] !== undefined) return; // already voted
      pendingFoodVotes.push({ date, target, food });
    });
  });

  // Collect pending work goal vetoes
  const pendingGoals = [];
  days.forEach((date) => {
    PLAYERS.forEach((target) => {
      if (target === voter) return;
      const goal = week.workGoals?.[date]?.[target];
      if (!goal) return;
      if (goal.vetoes?.[voter] !== undefined || goal.approvals?.[voter] !== undefined) return;
      pendingGoals.push({ date, target, goal });
    });
  });

  // Sick appeals
  const sickPlayers = PLAYERS.filter((p) => p !== voter && !week.sick?.[p]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Voter selector */}
      <div>
        <p className="text-zinc-500 text-xs mb-2">You are voting as:</p>
        <div className="flex gap-2">
          {PLAYERS.map((p) => {
            const m = PLAYER_META[p];
            return (
              <button
                key={p}
                onClick={() => setVoter(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  voter === p
                    ? `bg-zinc-800 ${m.text} ring-1 ${m.ring}`
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {m.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food votes */}
      <div>
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Food Votes ({pendingFoodVotes.length} pending)
        </h2>
        {pendingFoodVotes.length === 0 && (
          <p className="text-zinc-600 text-sm bg-zinc-900 rounded-xl p-4 text-center">Nothing to vote on</p>
        )}
        {pendingFoodVotes.map(({ date, target, food }) => (
          <FoodVoteCard
            key={`${date}-${target}`}
            date={date}
            target={target}
            food={food}
            voter={voter}
            dispatch={dispatch}
          />
        ))}
      </div>

      {/* Work goal vetoes */}
      <div>
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Work Goals ({pendingGoals.length} pending)
        </h2>
        {pendingGoals.length === 0 && (
          <p className="text-zinc-600 text-sm bg-zinc-900 rounded-xl p-4 text-center">Nothing to veto</p>
        )}
        {pendingGoals.map(({ date, target, goal }) => (
          <WorkGoalCard
            key={`${date}-${target}`}
            date={date}
            target={target}
            goal={goal}
            voter={voter}
            dispatch={dispatch}
          />
        ))}
      </div>

      {/* Sick appeals */}
      <div>
        <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">Sick Appeal</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-zinc-500 text-xs">Mark a player as sick (they can earn max €20 this week)</p>
          {PLAYERS.filter((p) => p !== voter).map((p) => {
            const meta = PLAYER_META[p];
            const isSick = week.sick?.[p];
            return (
              <div key={p} className="flex items-center justify-between">
                <span className={`text-sm ${meta.text}`}>{meta.emoji} {meta.label}</span>
                <button
                  onClick={() => dispatch({ type: 'SET_SICK', player: p, sick: !isSick })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isSick ? 'bg-red-900/40 text-red-400 border border-red-500/40' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isSick ? '🤒 Sick (click to remove)' : 'Mark sick'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FoodVoteCard({ date, target, food, voter, dispatch }) {
  const [vote, setVote] = useState(null);
  const meta = PLAYER_META[target];

  function submitVote() {
    if (vote === null) return;
    dispatch({ type: 'VOTE_FOOD', voter, targetPlayer: target, date, points: vote });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-2 space-y-3">
      <div className="flex items-center gap-2">
        <span>{meta.emoji}</span>
        <span className={`font-semibold text-sm ${meta.text}`}>{meta.label}</span>
        <span className="text-zinc-500 text-xs">— {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300 italic">"{food.description || 'No description'}"</div>
      <div className="text-xs text-zinc-500">Self-score: {food.selfPoints}/4</div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-sm">Your vote:</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setVote(n)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                vote === n ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={submitVote}
        disabled={vote === null}
        className="w-full bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-400 py-2 rounded-lg text-sm font-semibold transition-colors"
      >
        Submit Vote
      </button>
    </div>
  );
}

function WorkGoalCard({ date, target, goal, voter, dispatch }) {
  const meta = PLAYER_META[target];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-2 space-y-3">
      <div className="flex items-center gap-2">
        <span>{meta.emoji}</span>
        <span className={`font-semibold text-sm ${meta.text}`}>{meta.label}</span>
        <span className="text-zinc-500 text-xs">— for {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="bg-zinc-800 rounded-lg p-3 space-y-1">
        <p className="text-zinc-300 text-sm">{goal.description}</p>
        <p className="text-zinc-500 text-xs">{goal.hours} hours</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'APPROVE_WORK_GOAL', voter, targetPlayer: target, date })}
          className="flex-1 bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 border border-emerald-500/40 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => dispatch({ type: 'VETO_WORK_GOAL', voter, targetPlayer: target, date })}
          className="flex-1 bg-red-900/30 hover:bg-red-800/40 text-red-400 border border-red-500/40 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          ✗ Veto
        </button>
      </div>
    </div>
  );
}
