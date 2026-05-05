import { createContext, useContext, useReducer, useEffect } from 'react';
import { loadState, saveState } from '../data/storage.js';
import { getWeekId } from '../utils/dates.js';
import { getFoodPoints, calcWorkPoints, calcWakeUpPoints } from '../utils/points.js';

const AppContext = createContext(null);

const INITIAL_SETTINGS = {
  players: {
    emiliano: { addiction: 'smoking' },
    nico: { addiction: 'instagram' },
    bruno: { addiction: 'instagram' },
  },
};

function buildInitialState() {
  return {
    settings: INITIAL_SETTINGS,
    currentWeekId: null,
    weeks: {},
    activeTab: 'dashboard',
    selectedPlayer: 'emiliano',
    currentUser: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_WEEK': {
      const { weekId, goals } = action;
      return {
        ...state,
        currentWeekId: weekId,
        weeks: {
          ...state.weeks,
          [weekId]: {
            id: weekId,
            goals,
            dayOff: { emiliano: null, nico: null, bruno: null },
            sick: { emiliano: false, nico: false, bruno: false },
            days: {},
            workGoals: {},
          },
        },
      };
    }

    case 'SET_ADDICTION': {
      const { player, addiction } = action;
      return {
        ...state,
        settings: {
          ...state.settings,
          players: {
            ...state.settings.players,
            [player]: { ...state.settings.players[player], addiction },
          },
        },
      };
    }

    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.player,
        selectedPlayer: action.player || state.selectedPlayer,
      };

    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_PLAYER':
      return { ...state, selectedPlayer: action.player };

    case 'LOG_WAKE_UP': {
      const { player, date, time, messageSent } = action;
      const points = calcWakeUpPoints(time);
      return updateDayEntry(state, player, date, { wakeUp: { time, messageSent, points } });
    }

    case 'LOG_FOOD': {
      const { player, date, description, selfPoints } = action;
      const week = state.weeks[state.currentWeekId];
      const existing = week?.days?.[date]?.[player]?.food;
      const votes = existing?.votes || {};
      const finalPoints = getFoodPoints(selfPoints, votes);
      return updateDayEntry(state, player, date, {
        food: { description, selfPoints, votes, finalPoints },
      });
    }

    case 'VOTE_FOOD': {
      const { voter, targetPlayer, date, points } = action;
      const week = state.weeks[state.currentWeekId];
      const food = week?.days?.[date]?.[targetPlayer]?.food;
      if (!food) return state;
      const newVotes = { ...food.votes, [voter]: points };
      const finalPoints = getFoodPoints(food.selfPoints, newVotes);
      return updateDayEntry(state, targetPlayer, date, {
        food: { ...food, votes: newVotes, finalPoints },
      });
    }

    case 'LOG_ADDICTION': {
      const { player, date, maintained } = action;
      const addiction = state.settings.players[player]?.addiction || 'instagram';
      const pts = maintained ? 2 : 0;
      return updateDayEntry(state, player, date, {
        addiction: { maintained, addiction, points: pts },
      });
    }

    case 'SET_WORK_GOAL': {
      const { player, date, description, hours } = action;
      const weekId = state.currentWeekId;
      const week = state.weeks[weekId];
      return {
        ...state,
        weeks: {
          ...state.weeks,
          [weekId]: {
            ...week,
            workGoals: {
              ...week.workGoals,
              [date]: {
                ...(week.workGoals[date] || {}),
                [player]: { description, hours, status: 'pending', vetoes: {} },
              },
            },
          },
        },
      };
    }

    case 'VETO_WORK_GOAL': {
      const { voter, targetPlayer, date } = action;
      const weekId = state.currentWeekId;
      const week = state.weeks[weekId];
      const goal = week?.workGoals?.[date]?.[targetPlayer];
      if (!goal) return state;
      const newVetoes = { ...goal.vetoes, [voter]: true };
      const vetoed = Object.keys(newVetoes).length > 0;
      return {
        ...state,
        weeks: {
          ...state.weeks,
          [weekId]: {
            ...week,
            workGoals: {
              ...week.workGoals,
              [date]: {
                ...week.workGoals[date],
                [targetPlayer]: { ...goal, vetoes: newVetoes, status: vetoed ? 'vetoed' : 'pending' },
              },
            },
          },
        },
      };
    }

    case 'APPROVE_WORK_GOAL': {
      const { voter, targetPlayer, date } = action;
      const weekId = state.currentWeekId;
      const week = state.weeks[weekId];
      const goal = week?.workGoals?.[date]?.[targetPlayer];
      if (!goal) return state;
      const approvals = { ...(goal.approvals || {}), [voter]: true };
      const allApproved = ['emiliano', 'nico', 'bruno']
        .filter((p) => p !== targetPlayer)
        .every((p) => approvals[p]);
      return {
        ...state,
        weeks: {
          ...state.weeks,
          [weekId]: {
            ...week,
            workGoals: {
              ...week.workGoals,
              [date]: {
                ...week.workGoals[date],
                [targetPlayer]: {
                  ...goal,
                  approvals,
                  status: allApproved ? 'approved' : 'pending',
                },
              },
            },
          },
        },
      };
    }

    case 'LOG_WORK': {
      const { player, date, achievedHours } = action;
      const week = state.weeks[state.currentWeekId];
      const goalData = week?.workGoals?.[date]?.[player];
      const goalHours = goalData?.hours ?? 0;
      const pts = calcWorkPoints(achievedHours, goalHours);
      return updateDayEntry(state, player, date, {
        work: {
          goalDescription: goalData?.description || '',
          goalHours,
          achievedHours,
          points: pts,
        },
      });
    }

    case 'USE_DAY_OFF': {
      const { player, date } = action;
      const weekId = state.currentWeekId;
      const week = state.weeks[weekId];
      return {
        ...state,
        weeks: {
          ...state.weeks,
          [weekId]: {
            ...week,
            dayOff: { ...week.dayOff, [player]: date },
          },
        },
      };
    }

    case 'SET_SICK': {
      const { player, sick } = action;
      const weekId = state.currentWeekId;
      const week = state.weeks[weekId];
      return {
        ...state,
        weeks: {
          ...state.weeks,
          [weekId]: {
            ...week,
            sick: { ...week.sick, [player]: sick },
          },
        },
      };
    }

    default:
      return state;
  }
}

function updateDayEntry(state, player, date, patch) {
  const weekId = state.currentWeekId;
  const week = state.weeks[weekId];
  const dayEntries = week?.days?.[date] || {};
  const existing = dayEntries[player] || {};
  return {
    ...state,
    weeks: {
      ...state.weeks,
      [weekId]: {
        ...week,
        days: {
          ...week.days,
          [date]: {
            ...dayEntries,
            [player]: { ...existing, ...patch },
          },
        },
      },
    },
  };
}

export function AppProvider({ children }) {
  const saved = loadState();
  const [state, dispatch] = useReducer(reducer, saved || buildInitialState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const currentWeekId = getWeekId();
    if (state.currentWeekId !== currentWeekId && !state.weeks[currentWeekId]) {
      // New week detected — app will show setup modal
    }
  }, [state.currentWeekId]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
