import { useState } from 'react';
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

function SwitchModal({ currentUser, onSwitch, onClose }) {
  const meta = PLAYER_META[currentUser];
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-xs text-center space-y-4">
        <span className="text-4xl">{meta.emoji}</span>
        <p className="text-white font-bold text-lg">Switch player?</p>
        <p className="text-zinc-400 text-sm">You are currently logged in as <span className={`font-bold capitalize ${meta.text}`}>{currentUser}</span>. Your data is saved.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
            Stay
          </button>
          <button onClick={onSwitch} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl text-sm font-bold transition-colors">
            Switch
          </button>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { state, dispatch } = useApp();
  const currentWeekId = getWeekId();
  const needsSetup = !state.weeks[currentWeekId];
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const [currentUser, setCurrentUserState] = useState(
    () => localStorage.getItem('gd-user') || null
  );

  function choosePlayer(player) {
    localStorage.setItem('gd-user', player);
    setCurrentUserState(player);
    dispatch({ type: 'SET_PLAYER', player });
  }

  function switchPlayer() {
    localStorage.removeItem('gd-user');
    setCurrentUserState(null);
    setShowSwitchModal(false);
  }

  if (!currentUser) {
    return <PlayerSelect onSelect={choosePlayer} />;
  }

  const meta = PLAYER_META[currentUser];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 max-w-[480px] mx-auto">
      <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐉</span>
          <span className="text-lg font-black text-amber-400 tracking-tight">Golden Dragon</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Static identity — not a nav button */}
          <div className={`flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-xl text-sm font-semibold ${meta.text}`}>
            <span>{meta.emoji}</span>
            <span className="capitalize">{currentUser}</span>
          </div>
          {/* Explicit switch button */}
          <button
            onClick={() => setShowSwitchModal(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-1.5 rounded-xl text-xs transition-colors"
            title="Switch player"
          >
            ⇄
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {state.activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
        {state.activeTab === 'log'       && <DailyLog currentUser={currentUser} />}
        {state.activeTab === 'votes'     && <VotingPanel currentUser={currentUser} />}
        {state.activeTab === 'summary'   && <WeekSummary currentUser={currentUser} />}
      </main>

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

      {needsSetup && <WeekSetup onDone={() => dispatch({ type: 'SET_TAB', tab: 'dashboard' })} />}

      {showSwitchModal && (
        <SwitchModal
          currentUser={currentUser}
          onSwitch={switchPlayer}
          onClose={() => setShowSwitchModal(false)}
        />
      )}
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
