import { useState } from 'react';
import { CRINGE_QUOTES } from '../data/quotes.js';

export default function QuoteWidget() {
  const [idx, setIdx] = useState(() => new Date().getDate() % CRINGE_QUOTES.length);

  return (
    <div
      className="bg-zinc-900 border border-amber-900/40 rounded-xl p-4 cursor-pointer active:scale-95 transition-transform"
      onClick={() => setIdx((i) => (i + 1) % CRINGE_QUOTES.length)}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">✨</span>
        <div>
          <p className="text-amber-300 italic text-sm leading-relaxed">
            "{CRINGE_QUOTES[idx]}"
          </p>
          <p className="text-zinc-600 text-xs mt-1">Tap for more wisdom</p>
        </div>
      </div>
    </div>
  );
}
