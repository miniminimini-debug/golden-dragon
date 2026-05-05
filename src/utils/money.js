import { calcWeekTotal } from './points.js';

const PLAYERS = ['emiliano', 'nico', 'bruno'];
const POT = 60;

export function calcMoneyDistribution(weekData) {
  const goalPot = POT * 0.75;
  const firstPot = POT * 0.25;
  const goals = weekData?.goals || {};

  const points = {};
  PLAYERS.forEach((p) => { points[p] = calcWeekTotal(p, weekData); });

  const goalReachers = PLAYERS.filter((p) => points[p] >= (goals[p] ?? Infinity));
  const maxPts = Math.max(...PLAYERS.map((p) => points[p]));
  const firstPlacers = PLAYERS.filter((p) => points[p] === maxPts);

  const result = {};
  PLAYERS.forEach((p) => {
    const fromGoal = goalReachers.includes(p) ? goalPot / goalReachers.length : 0;
    const fromFirst = firstPlacers.includes(p) ? firstPot / firstPlacers.length : 0;
    let total = fromGoal + fromFirst;
    if (weekData?.sick?.[p]) total = Math.min(20, total);
    result[p] = {
      points: points[p],
      goal: goals[p] ?? 0,
      reachedGoal: goalReachers.includes(p),
      isFirst: firstPlacers.includes(p),
      fromGoal,
      fromFirst,
      total,
    };
  });

  return result;
}
