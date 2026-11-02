import { useMemo, useState } from 'react'
import { addWeeks, format, isToday } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import useCollection from '../hooks/useCollection'
import TaskForm from '../components/TaskForm'
import { reschedule } from '../services/taskService'
import { create, remove } from '../services/db'
import { weekDays, weekId, iso } from '../utils/week'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 → 21:00

// --- Inline icons ---
const Icon = {
  ChevronLeft: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  ),
  Grid: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Board: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Inbox: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12l3-8h12l3 8v7a1 1 0 01-1 1H4a1 1 0 01-1-1z" /><path d="M3 12h5l1 3h6l1-3h5" />
    </svg>
  ),
}

// --- Task chip on the board ---
function TaskChip({ t, days, user, onDragStart }) {
  const done = t.status === 'completed'
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('id', t.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(t.id)
      }}
      className="group cursor-grab rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 transition hover:border-white/15 hover:bg-white/[0.07] active:cursor-grabbing"
    >
      <div className="flex items-start gap-1.5">
        <p className={`min-w-0 flex-1 truncate text-sm leading-snug ${done ? 'text-dim line-through' : 'text-white'}`}>
          {t.title}
        </p>
        {t.estimatedMinutes ? (
          <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[10px] text-dim">
            <Icon.Clock className="h-2.5 w-2.5" />
            {t.estimatedMinutes}
          </span>
        ) : null}
      </div>
      <select
        className="mt-1 w-full cursor-pointer appearance-none rounded bg-transparent text-[11px] text-dim transition hover:text-white focus:outline-none"
        value={t.scheduledDate || iso(days[0])}
        onChange={(e) => reschedule(user.uid, t.id, e.target.value, weekId(new Date(e.target.value)))}
        aria-label="Move to day"
      >
        {days.map((x) => (
          <option key={iso(x)} value={iso(x)}>
            {format(x, 'EEE d')}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function WeeklyPlanner() {
  const { user } = useAuth()
  const [anchor, setAnchor] = useState(new Date())
  const [view, setView] = useState('board')
  const [pick, setPick] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const { items: tasks } = useCollection('tasks')
  const { items: blocks } = useCollection('schedules')

  const days = useMemo(() => weekDays(anchor), [anchor])
  const wid = weekId(anchor)

  const tasksByDay = useMemo(() => {
    const map = {}
    tasks
      .filter((t) => t.status !== 'cancelled')
      .forEach((t) => {
        if (!t.scheduledDate) return
        ;(map[t.scheduledDate] ??= []).push(t)
      })
    return map
  }, [tasks])

  const blocksByCell = useMemo(() => {
    const map = {}
    blocks.forEach((b) => {
      const d = iso(new Date(b.startAt))
      const h = new Date(b.startAt).getHours()
      ;(map[`${d}|${h}`] ??= []).push(b)
    })
    return map
  }, [blocks])

  const schedulableTasks = useMemo(
    () => tasks.filter((t) => t.weekId === wid && t.status !== 'completed'),
    [tasks, wid]
  )

  const addBlock = (d, h) => {
    if (!pick) return
    const s = new Date(d)
    s.setHours(h, 0, 0, 0)
    const e = new Date(s)
    e.setHours(h + 1)
    create(user.uid, 'schedules', {
      title: tasks.find((t) => t.id === pick)?.title ?? '',
      taskId: pick,
      startAt: s.toISOString(),
      endAt: e.toISOString(),
      type: 'work',
      status: 'planned',
    })
  }

  const onDrop = (ev, d) => {
    ev.preventDefault()
    setDragOver(null)
    const id = ev.dataTransfer.getData('id')
    if (id) reschedule(user.uid, id, iso(d), weekId(d))
  }

  const todayIso = iso(new Date())

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-16 pt-4 sm:px-5 sm:pt-8">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/15 text-volt">
          <Icon.Calendar className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            {format(days[0], 'd MMM')} – {format(days[6], 'd MMM yyyy')}
          </h1>
          <p className="text-xs text-dim">
            {format(days[0], 'yyyy')} · Week {wid.split('-')[1] || ''}
          </p>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            onClick={() => setAnchor(addWeeks(anchor, -1))}
            aria-label="Previous week"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-dim transition hover:bg-white/5 hover:text-white"
          >
            <Icon.ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-dim transition hover:text-white"
          >
            Today
          </button>
          <button
            onClick={() => setAnchor(addWeeks(anchor, 1))}
            aria-label="Next week"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-dim transition hover:bg-white/5 hover:text-white"
          >
            <Icon.ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {[
            { k: 'board', label: 'Board', icon: Icon.Board },
            { k: 'grid', label: 'Grid', icon: Icon.Grid },
          ].map(({ k, label, icon: I }) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                view === k ? 'bg-volt text-black shadow' : 'text-dim hover:text-white'
              }`}
            >
              <I className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </header>

      <TaskForm date={days[0]} />

      {/* Board view */}
      {view === 'board' ? (
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => {
            const key = iso(d)
            const dayTasks = tasksByDay[key] || []
            const isCurrent = key === todayIso
            const isHover = dragOver === key
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(key)
                }}
                onDragLeave={() => setDragOver((v) => (v === key ? null : v))}
                onDrop={(e) => onDrop(e, d)}
                className={`flex min-h-[10rem] flex-col rounded-2xl border p-2.5 transition ${
                  isHover
                    ? 'border-volt/60 bg-volt/[0.06]'
                    : isCurrent
                    ? 'border-volt/30 bg-white/[0.05]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-dim">
                      {format(d, 'EEE')}
                    </p>
                    <p className={`text-base font-bold leading-tight ${isCurrent ? 'text-volt' : ''}`}>
                      {format(d, 'd')}
                    </p>
                  </div>
                  {dayTasks.length > 0 && (
                    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-dim">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  {dayTasks.map((t) => (
                    <TaskChip key={t.id} t={t} days={days} user={user} />
                  ))}

                  {dayTasks.length === 0 && (
                    <div className="flex h-full min-h-[6rem] items-center justify-center rounded-lg border border-dashed border-white/[0.08] text-[11px] text-dim/70">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Time grid view */
        <div className="space-y-3">
          {/* Task picker */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <Icon.Inbox className="ml-1 h-4 w-4 shrink-0 text-dim" />
            <select
              className="field flex-1 border-0 bg-transparent focus:ring-0"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="">Choose a task to schedule…</option>
              {schedulableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {pick && (
              <button
                onClick={() => setPick('')}
                aria-label="Clear selected task"
                className="flex h-7 w-7 items-center justify-center rounded-md text-dim transition hover:bg-white/5 hover:text-white"
              >
                <Icon.X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {!pick && (
            <p className="px-1 text-xs text-dim">
              Tip: select a task above, then click a slot below to schedule it.
            </p>
          )}

          {/* Grid */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="grid min-w-[820px] grid-cols-[3.5rem_repeat(7,1fr)]">
              {/* Header row */}
              <div className="sticky left-0 z-10 border-b border-white/10 bg-[#0b1424]/95 backdrop-blur" />
              {days.map((d) => {
                const isCurrent = iso(d) === todayIso
                return (
                  <div
                    key={iso(d)}
                    className={`border-b border-l border-white/10 p-2 text-center ${
                      isCurrent ? 'bg-volt/[0.06]' : ''
                    }`}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-dim">
                      {format(d, 'EEE')}
                    </p>
                    <p className={`text-sm font-bold ${isCurrent ? 'text-volt' : ''}`}>
                      {format(d, 'd')}
                    </p>
                  </div>
                )
              })}

              {/* Hour rows */}
              {HOURS.map((h) => (
                <div key={`row-${h}`} className="contents">
                  <div className="sticky left-0 z-10 flex items-start justify-end border-b border-white/5 bg-[#0b1424]/95 pr-1.5 pt-0.5 text-[10px] font-medium text-dim backdrop-blur">
                    {String(h).padStart(2, '0')}:00
                  </div>
                  {days.map((d) => {
                    const cellKey = `${iso(d)}|${h}`
                    const cellBlocks = blocksByCell[cellKey] || []
                    return (
                      <div
                        key={cellKey}
                        onClick={() => addBlock(d, h)}
                        className={`group relative min-h-[2.5rem] border-b border-l border-white/5 p-0.5 transition ${
                          pick ? 'cursor-copy hover:bg-volt/10' : 'cursor-default hover:bg-white/[0.03]'
                        }`}
                      >
                        {cellBlocks.map((b) => (
                          <div
                            key={b.id}
                            className="mb-0.5 flex items-center gap-1 rounded bg-volt/90 px-1.5 py-0.5 text-[11px] font-medium text-black"
                            onClick={(e) => {
                              e.stopPropagation()
                              remove(user.uid, 'schedules', b.id)
                            }}
                            title="Click to remove"
                          >
                            <span className="min-w-0 flex-1 truncate">{b.title}</span>
                            <Icon.X className="h-2.5 w-2.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
                          </div>
                        ))}
                        {pick && cellBlocks.length === 0 && (
                          <div className="absolute inset-0 hidden items-center justify-center text-[10px] font-medium text-volt/70 group-hover:flex">
                            <Icon.Plus className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}