import { create, patch } from './db'
// Rescheduling edits scheduledDate/weekId on the same task: identity and history stay intact.
export const addTask = (uid, t) => create(uid, 'tasks', { description: '', goalId: null, category: null, priority: 'medium',
  status: 'todo', dueDate: null, estimatedMinutes: 30, completedAt: null, ...t })
export const reschedule = (uid, id, scheduledDate, weekId) => patch(uid, 'tasks', id, { scheduledDate, weekId })
export const setStatus = (uid, id, status) => patch(uid, 'tasks', id, { status, completedAt: status === 'completed' ? new Date().toISOString() : null })
