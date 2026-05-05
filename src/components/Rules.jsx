const RULES = [
  {
    number: 1,
    title: 'Weekly Buy-in',
    icon: '💰',
    text: 'Each player contributes €20 at the start of every week. Total pot: €60.',
  },
  {
    number: 2,
    title: 'Set Your Goal',
    icon: '🎯',
    text: 'At the start of the week, each player sets a personal points goal for that week.',
  },
  {
    number: 3,
    title: '75% — Goal Pool',
    icon: '🏅',
    text: '€45 (75% of the pot) is split equally among all players who reached their weekly points goal.',
  },
  {
    number: 4,
    title: '25% — First Place',
    icon: '👑',
    text: '€15 (25% of the pot) goes to whoever finishes with the most points. If tied, the money is split equally among those tied.',
  },
  {
    number: 5,
    title: 'Wake-Up — max 4 pts',
    icon: '⏰',
    text: 'Wake up at 8:00 AM = 4 pts. Each hour later costs 1 point (9:00 = 3, 10:00 = 2, 11:00 = 1). From 12:00 PM onwards = 0 pts. Half hours count as half points (8:30 = 3.5). You must send a message to the group to confirm you\'re alive.',
  },
  {
    number: 6,
    title: 'Food Log — max 4 pts',
    icon: '🍽️',
    text: 'At the end of each day, describe what you ate and answer: "Did I eat adequately today?" Self-score up to 4 pts. The other players vote — the strictest (lowest) vote is the final score.',
  },
  {
    number: 7,
    title: 'Addiction — max 2 pts',
    icon: '🚫',
    text: 'Worth 2 pts if maintained, 0 if not. Addiction is player-specific: some players must not smoke; others must not use Instagram or X for more than 15 minutes in any single hour.',
  },
  {
    number: 8,
    title: 'Work Goal — max 4 pts',
    icon: '💼',
    text: 'At the end of each day, set your work goal for the following day — what you\'ll work on and for how many hours. Weekday minimum: 2 hours. The others can veto your goal if they don\'t consider it ambitious enough. Points (max 4) are awarded based on the percentage of the goal you actually achieved.',
  },
  {
    number: 9,
    title: 'Day Off — once per week',
    icon: '🏖️',
    text: 'Once per week, you can declare a day off. On that day, you receive enough bonus points to bring your daily total up to 7, even if you achieved fewer through normal activities.',
  },
  {
    number: 10,
    title: 'Sick Rule',
    icon: '🤒',
    text: 'If you are seriously ill to the point of not being able to work, you can appeal to the other players. Extraordinary rules can be agreed upon for that week. However, if this rule is invoked, the sick player cannot receive more than €20 (their original buy-in) regardless of their performance.',
  },
];

export default function Rules() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-center py-2">
        <p className="text-2xl mb-1">📜</p>
        <h1 className="text-xl font-black text-amber-400">The Rules</h1>
        <p className="text-zinc-500 text-sm mt-1">Golden Dragon Habit Tracker</p>
      </div>

      <div className="bg-zinc-900 border border-amber-900/40 rounded-xl p-4 text-center">
        <p className="text-amber-300 text-sm font-semibold">Max points per day: 14</p>
        <p className="text-zinc-500 text-xs mt-1">Wake-up (4) + Food (4) + Addiction (2) + Work (4)</p>
      </div>

      <div className="space-y-3">
        {RULES.map((rule) => (
          <div key={rule.number} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{rule.icon}</span>
              <div>
                <span className="text-zinc-600 text-xs">Rule {rule.number}</span>
                <h3 className="text-white font-bold text-sm leading-tight">{rule.title}</h3>
              </div>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">{rule.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
        <p className="text-zinc-500 text-xs">Good luck. May the best dragon win. 🐉</p>
      </div>
    </div>
  );
}
