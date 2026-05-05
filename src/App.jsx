import { AppProvider, useApp } from './context/AppContext.jsx';
import Dashboard from './components/Dashboard.jsx';
import DailyLog from './components/DailyLog.jsx';
import VotingPanel from './components/VotingPanel.jsx';
import WeekSetup from './components/WeekSetup.jsx';
import WeekSummary from './components/WeekSummary.jsx';
import PlayerSelect from './components/PlayerSelect.jsx';
import { PLAYER_META } from './components/PlayerCard.jsx';
import { getWeekId } from './utils/dates.js';

const TABS = [
  { id: 'dashboard', label: 'Home',    icon: '🏠' },
  { id: 'log',       label: 'Log',     icon: '📝' },
  { id: 'votes',     label: 'Votes',   icon: '🗳️' },
  { id: 'summary',   label: 'Results', icon: '🏆' },
];

function AppShell() {
  const { state, dispatch } = useApp();
  const currentWeekId = getWeekId();
  const needsSetup = !state.weeks[currentWeekId];
  const user = state.currentUser;
  const meta = user ? PLAYER_META[user] : null;

  if (!user) return <PlayerSelect />;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 max-w-[480px] mx-auto">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐉</span>
          <span className="text-lg font-black text-amber-400 tracking-tight">Golden Dragon</span>
        </div>
        <div className="flex items-center gap-3">
          {state.currentWeekId && (
            <span className="text-amber-400 font-bold text-sm">€60 pot</span>
          )}
          <button
            onClick={() => dispatch({ type: 'SET_CURRENT_USER', player: null })}
            className={`flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${meta?.text}`}
          >
            <span>{meta?.emoji}</span>
            <span className="capitalize">{user}</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {state.activeTab === 'dashboard' && <Dashboard />}
        {state.activeTab === 'log'       && <DailyLog />}
        {state.activeTab === 'votes'     && <VotingPanel />}
        {state.activeTab === 'summary'   && <WeekSummary />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-zinc-900/90 backdrop-blur border-t border-zinc-800 flex z-40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_TAB', tab: tab.id })}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              state.activeTab === tab.id ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Week setup modal */}
      {needsSetup && <WeekSetup onDone={() => dispatch({ type: 'SET_TAB', tab: 'dashboard' })} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
