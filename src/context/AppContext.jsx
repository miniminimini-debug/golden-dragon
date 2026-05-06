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

function makeWeekRecord(weekId, goals) {
  return {
    id: weekId,
    goals,
    dayOff: { emiliano: null, nico: null, bruno: null },
    sick: { emiliano: false, nico: false, bruno: false },
    days: {},
    workGoals: {},
  };
}

function updateDayEntry(state, weekId, player, date, patch) {
  const week = state.weeks[weekId];
  if (!week) return state;
  const dayEntries = week.days?.[date] || {};
  const existing = dayEntries[player] || {};
  return {
    ...state,
    weeks: {
      ...state.weeks,
      [weekId]: {
        ...week,
        days: {
          ...week.days,
          [date]: { ...dayEntries, [player]: { ...existing, ...patch } },
        },
      },
    },
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_WEEK': {
      const { weekId, goals } = action;
      return {
        ...state,
        currentWeekId: weekId,
        weeks: { ...state.weeks, [weekId]: makeWeekRecord(weekId, goals) },
      };
    }

    case 'INIT_HISTORICAL_WEEK': {
      const { weekId, goals } = action;
      if (state.weeks[weekId]) return state;
      return {
        ...state,
        weeks: { ...state.weeks, [weekId]: makeWeekRecord(weekId, goals) },
      };
    }

    case 'SET_ADDICTION': {
      const { player, addiction } = action;
      return {
        ...state,
        settings: {
          ...state.settings,
          players: { ...state.settings.players, [player]: { ...state.settings.players[player], addiction } },
        },
      };
    }

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.player, selectedPlayer: action.player || state.selectedPlayer };

    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_PLAYER':
      return { ...state, selectedPlayer: action.player };

    case 'LOG_WAKE_UP': {
      const { weekId = state.currentWeekId, player, date, time, messageSent } = action;
      return updateDayEntry(state, weekId, player, date, { wakeUp: { time, messageSent, points: calcWakeUpPoints(time) } });
    }

    case 'LOG_FOOD': {
      const { weekId = state.currentWeekId, player, date, description, selfPoints } = action;
      const existing = state.weeks[weekId]?.days?.[date]?.[player]?.food;
      const votes = existing?.votes || {};
      return updateDayEntry(state, weekId, player, date, {
        food: { description, selfPoints, votes, finalPoints: getFoodPoints(selfPoints, votes) },
      });
    }

    case 'VOTE_FOOD': {
      const { weekId = state.currentWeekId, voter, targetPlayer, date, points } = action;
      const food = state.weeks[weekId]?.days?.[date]?.[targetPlayer]?.food;
      if (!food) return state;
      const newVotes = { ...food.votes, [voter]: points };
      return updateDayEntry(state, weekId, targetPlayer, date, {
        food: { ...food, votes: newVotes, finalPoints: getFoodPoints(food.selfPoints, newVotes) },
      });
    }

    case 'LOG_ADDICTION': {
      const { weekId = state.currentWeekId, player, date, maintained } = action;
      const addiction = state.settings.players[player]?.addiction || 'instagram';
      return updateDayEntry(state, weekId, player, date, {
        addiction: { maintained, addiction, points: maintained ? 4 : 0 },
      });
    }

    case 'SET_WORK_GOAL': {
      const { weekId = state.currentWeekId, player, date, description, hours } = action;
      const week = state.weeks[weekId];
      if (!week) return state;
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
      const { weekId = state.currentWeekId, voter, targetPlayer, date } = action;
      const week = state.weeks[weekId];
      const goal = week?.workGoals?.[date]?.[targetPlayer];
      if (!goal) return state;
      const newVetoes = { ...goal.vetoes, [voter]: true };
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
                [targetPlayer]: { ...goal, vetoes: newVetoes, status: Object.keys(newVetoes).length > 0 ? 'vetoed' : 'pending' },
              },
            },
          },
        },
      };
    }

    case 'APPROVE_WORK_GOAL': {
      const { weekId = state.currentWeekId, voter, targetPlayer, date } = action;
      const week = state.weeks[weekId];
      const goal = week?.workGoals?.[date]?.[targetPlayer];
      if (!goal) return state;
      const approvals = { ...(goal.approvals || {}), [voter]: true };
      const allApproved = ['emiliano', 'nico', 'bruno'].filter(p => p !== targetPlayer).every(p => approvals[p]);
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
                [targetPlayer]: { ...goal, approvals, status: allApproved ? 'approved' : 'pending' },
              },
            },
          },
        },
      };
    }

    case 'LOG_WORK': {
      const { weekId = state.currentWeekId, player, date, achievedHours } = action;
      const week = state.weeks[weekId];
      const goalData = week?.workGoals?.[date]?.[player];
      const goalHours = goalData?.hours ?? 0;
      return updateDayEntry(state, weekId, player, date, {
        work: {
          goalDescription: goalData?.description || '',
          goalHours,
          achievedHours,
          points: calcWorkPoints(achievedHours, goalHours),
        },
      });
    }

    // For historical days: set goal and log work in one action
    case 'LOG_WORK_WITH_GOAL': {
      const { weekId = state.currentWeekId, player, date, description, goalHours, achievedHours } = action;
      const week = state.weeks[weekId];
      if (!week) return state;
      const stateWithGoal = {
        ...state,
        weeks: {
          ...state.weeks,
          [weekId]: {
            ...week,
            workGoals: {
              ...week.workGoals,
              [date]: {
                ...(week.workGoals[date] || {}),
                [player]: { description, hours: goalHours, status: 'pending', vetoes: {} },
              },
            },
          },
        },
      };
      return updateDayEntry(stateWithGoal, weekId, player, date, {
        work: {
          goalDescription: description,
          goalHours,
          achievedHours,
          points: calcWorkPoints(achievedHours, goalHours),
        },
      });
    }

    case 'USE_DAY_OFF': {
      const { weekId = state.currentWeekId, player, date } = action;
      const week = state.weeks[weekId];
      if (!week) return state;
      return {
        ...state,
        weeks: { ...state.weeks, [weekId]: { ...week, dayOff: { ...week.dayOff, [player]: date } } },
      };
    }

    case 'SET_SICK': {
      const { weekId = state.currentWeekId, player, sick } = action;
      const week = state.weeks[weekId];
      if (!week) return state;
      return {
        ...state,
        weeks: { ...state.weeks, [weekId]: { ...week, sick: { ...week.sick, [player]: sick } } },
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const saved = loadState();
  const [state, dispatch] = useReducer(reducer, saved || buildInitialState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
