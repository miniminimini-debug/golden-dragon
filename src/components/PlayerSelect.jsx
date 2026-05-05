import { useApp } from '../context/AppContext.jsx';

const PLAYERS = [
  { key: 'emiliano', emoji: '🦅', color: 'border-amber-500 hover:bg-amber-500/10 text-amber-400', glow: 'shadow-amber-500/20' },
  { key: 'nico',     emoji: '🦁', color: 'border-blue-500 hover:bg-blue-500/10 text-blue-400',   glow: 'shadow-blue-500/20' },
  { key: 'bruno',    emoji: '🐉', color: 'border-emerald-500 hover:bg-emerald-500/10 text-emerald-400', glow: 'shadow-emerald-500/20' },
];

export default function PlayerSelect() {
  const { dispatch } = useApp();

  function choose(player) {
    dispatch({ type: 'SET_CURRENT_USER', player });
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 p-6 gap-8">
      <div className="text-center space-y-2">
        <div className="text-6xl mb-4">🐉</div>
        <h1 className="text-3xl font-black text-amber-400 tracking-tight">Golden Dragon</h1>
        <p className="text-zinc-400 text-base">Who are you?</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {PLAYERS.map(({ key, emoji, color, glow }) => (
          <button
            key={key}
            onClick={() => choose(key)}
            className={`w-full border-2 ${color} rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-95 shadow-lg ${glow}`}
          >
            <span className="text-4xl">{emoji}</span>
            <span className="text-2xl font-bold capitalize">{key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
