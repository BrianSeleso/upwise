import { create, setState, remove } from './db'
// Timestamps are the source of truth; the on-screen counter is only a visual refresh.
export const elapsedSeconds = (t, now = Date.now()) =>
  Math.max(0, Math.round((t.segments || []).reduce((s, g) => s + ((g.end ?? now) - g.start), 0) / 1000))
export const startTimer = (uid, taskId) => setState(uid, 'timer', { taskId, status: 'running', sessionId: crypto.randomUUID(), segments: [{ start: Date.now(), end: null }] })
export const pauseTimer = (uid, t) => setState(uid, 'timer', { ...t, status: 'paused', segments: t.segments.map((g) => (g.end ? g : { ...g, end: Date.now() })) })
export const resumeTimer = (uid, t) => setState(uid, 'timer', { ...t, status: 'running', segments: [...t.segments, { start: Date.now(), end: null }] })
export async function finishTimer(uid, t) {
  const segs = t.segments.map((g) => (g.end ? g : { ...g, end: Date.now() }))
  // sessionId as document ID: retries and double clicks cannot create duplicates.
  create(uid, 'timeEntries', { taskId: t.taskId, startedAt: new Date(segs[0].start).toISOString(), endedAt: new Date(segs.at(-1).end).toISOString(),
    durationSeconds: elapsedSeconds({ segments: segs }), entryType: 'timer', notes: '' }, t.sessionId)
  await remove(uid, 'state', 'timer')
}
export const logManual = (uid, taskId, minutes, dateISO) => create(uid, 'timeEntries', { taskId, startedAt: dateISO, endedAt: dateISO, durationSeconds: minutes * 60, entryType: 'manual', notes: '' })
