import { create } from './db'
// Milestones live on the goal; progress = done units / total units, never a guessed percentage.
export const addGoal = (uid, g) => create(uid, 'goals', { description: '', category: null, targetDate: null, status: 'active', priority: 'medium', milestones: [], ...g })
export const progress = (goal, tasks) => {
  const units = [...(goal.milestones || []).map((m) => m.done), ...tasks.filter((t) => t.goalId === goal.id && t.status !== 'cancelled').map((t) => t.status === 'completed')]
  return units.length ? Math.round((units.filter(Boolean).length / units.length) * 100) : 0
}
