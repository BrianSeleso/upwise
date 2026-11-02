import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import useCollection from '../hooks/useCollection'
import { addGoal, progress } from '../services/goalService'
import { patch, remove } from '../services/db'

// --- Inline icons ---
const Icon = {
  Target: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  ),
  Flag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 21V4h13l-2 4 2 4H4" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  ),
}

// Circular progress ring
function Ring({ value, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          className="text-volt transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
        {value}%
      </span>
    </div>
  )
}

// --- Goal card ---
function GoalCard({ g, user, tasks }) {
  const [msTitle, setMsTitle] = useState('')
  const pct = progress(g, tasks)
  const milestones = g.milestones || []
  const doneCount = milestones.filter((m) => m.done).length

  const toggleMilestone = (i) =>
    patch(user.uid, 'goals', g.id, {
      milestones: milestones.map((m, j) => (j === i ? { ...m, done: !m.done } : m)),
    })

  const removeMilestone = (i) =>
    patch(user.uid, 'goals', g.id, {
      milestones: milestones.filter((_, j) => j !== i),
    })

  const addMilestone = (e) => {
    e.preventDefault()
    const v = msTitle.trim()
    if (!v) return
    patch(user.uid, 'goals', g.id, {
      milestones: [...milestones, { title: v, done: false }],
    })
    setMsTitle('')
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur-sm">
      {/* Header */}
      <header className="flex items-start gap-3 border-b border-white/[0.06] p-4 sm:items-center">
        <Ring value={pct} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight">{g.title}</h3>
          <p className="mt-0.5 text-xs text-dim">
            {milestones.length
              ? `${doneCount} of ${milestones.length} milestone${milestones.length > 1 ? 's' : ''} complete`
              : 'No milestones yet'}
          </p>
        </div>

        <button
          onClick={() => window.confirm(`Delete "${g.title}"?`) && remove(user.uid, 'goals', g.id)}
          aria-label={`Delete ${g.title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dim transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Icon.Trash className="h-4 w-4" />
        </button>
      </header>

      {/* Linear progress bar (mobile friendly sanity check) */}
      <div className="px-4 pt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-volt transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="p-2 sm:p-3">
        {milestones.length > 0 ? (
          <ul className="space-y-0.5">
            {milestones.map((m, i) => (
              <li
                key={i}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
              >
                <button
                  onClick={() => toggleMilestone(i)}
                  aria-pressed={m.done}
                  aria-label={m.done ? `Mark ${m.title} incomplete` : `Complete ${m.title}`}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    m.done ? 'border-volt bg-volt text-black' : 'border-white/25 hover:border-volt/70'
                  }`}
                >
                  {m.done && <Icon.Check className="h-3.5 w-3.5" />}
                </button>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    m.done ? 'text-dim line-through' : 'text-white'
                  }`}
                >
                  {m.title}
                </span>
                <button
                  onClick={() => removeMilestone(i)}
                  aria-label={`Remove ${m.title}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-dim opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
                >
                  <Icon.Trash className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-xs text-dim">
            Break this goal into milestones to track progress.
          </p>
        )}
      </div>

      {/* Add milestone */}
      <form
        onSubmit={addMilestone}
        className="flex gap-2 border-t border-white/[0.06] p-3"
      >
        <div className="relative flex-1">
          <Icon.Flag className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
          <input
            className="field w-full pl-8"
            placeholder="Add milestone…"
            value={msTitle}
            onChange={(e) => setMsTitle(e.target.value)}
          />
        </div>
        <button
          className="btn-ghost inline-flex items-center gap-1 px-3 text-xs font-semibold"
          disabled={!msTitle.trim()}
        >
          <Icon.Plus className="h-3.5 w-3.5" />
          <span className="hidden xs:inline sm:inline">Add</span>
        </button>
      </form>
    </article>
  )
}

export default function Goals() {
  const { user } = useAuth()
  const { items: goals } = useCollection('goals')
  const { items: tasks } = useCollection('tasks')
  const [title, setTitle] = useState('')

  // Sort newest-first by createdAt if present, otherwise keep as-is
  const sorted = useMemo(() => {
    return [...goals].sort((a, b) => {
      const av = a.createdAt?.seconds ?? 0
      const bv = b.createdAt?.seconds ?? 0
      return bv - av
    })
  }, [goals])

  const avgProgress = sorted.length
    ? Math.round(sorted.reduce((s, g) => s + progress(g, tasks), 0) / sorted.length)
    : 0

  const onAdd = (e) => {
    e.preventDefault()
    const v = title.trim()
    if (!v) return
    addGoal(user.uid, { title: v })
    setTitle('')
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-3 pb-16 pt-4 sm:px-5 sm:pt-8">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/15 text-volt">
          <Icon.Target className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Goals</h1>
          <p className="text-xs text-dim">
            {sorted.length
              ? `${sorted.length} goal${sorted.length > 1 ? 's' : ''} · ${avgProgress}% avg progress`
              : 'Track outcomes, not just tasks'}
          </p>
        </div>
      </header>

      {/* Add goal */}
      <form
        onSubmit={onAdd}
        className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-lg backdrop-blur-sm"
      >
        <input
          className="field flex-1 border-0 bg-transparent focus:ring-0"
          placeholder="What outcome do you want to achieve?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="btn inline-flex items-center gap-1.5"
          disabled={!title.trim()}
        >
          <Icon.Plus className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Add goal</span>
        </button>
      </form>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-dim">
            <Icon.Sparkle className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">No goals yet</p>
          <p className="max-w-xs text-xs text-dim">
            Add your first goal above, then break it into milestones to measure progress.
          </p>
        </div>
      )}

      {/* Goal list */}
      <div className="space-y-3">
        {sorted.map((g) => (
          <GoalCard key={g.id} g={g} user={user} tasks={tasks} />
        ))}
      </div>
    </div>
  )
}