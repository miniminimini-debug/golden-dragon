const PLAYERS = [
  { key: 'emiliano', emoji: '🦅', border: 'border-amber-500', hover: 'hover:bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  { key: 'nico',     emoji: '🦁', border: 'border-blue-500',  hover: 'hover:bg-blue-500/10',  text: 'text-blue-400',  glow: 'shadow-blue-500/20' },
  { key: 'bruno',    emoji: '🐉', border: 'border-emerald-500', hover: 'hover:bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
];

export default function PlayerSelect({ onSelect }) {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 p-6 gap-8">
      <div className="text-center space-y-2">
        <div className="text-6xl mb-2">🐉</div>
        <h1 className="text-3xl font-black text-amber-400 tracking-tight">Golden Dragon</h1>
        <p className="text-zinc-400 text-lg">Who are you?</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {PLAYERS.map(({ key, emoji, border, hover, text, glow }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full border-2 ${border} ${hover} rounded-2xl p-5 flex items-center gap-5 transition-all active:scale-95 shadow-lg ${glow}`}
          >
            <span className="text-5xl">{emoji}</span>
            <span className={`text-2xl font-bold capitalize ${text}`}>{key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
