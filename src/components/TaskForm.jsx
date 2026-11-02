import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import useCollection from '../hooks/useCollection'
import { addTask } from '../services/taskService'
import { weekId, iso } from '../utils/week'

// --- Inline icons ---
const Icon = {
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  Target: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Tag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20.6 13.4L12 22l-9-9V4a1 1 0 011-1h9l7.6 7.6a2 2 0 010 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Sliders: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
}

// Quick duration presets
const DURATIONS = [15, 30, 45, 60, 90]

export default function TaskForm({ date = new Date() }) {
  const { user } = useAuth()
  const { items: goals } = useCollection('goals')
  const { items: cats } = useCollection('categories')

  const [title, setTitle] = useState('')
  const [mins, setMins] = useState(30)
  const [goalId, setGoal] = useState('')
  const [category, setCat] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [flash, setFlash] = useState(false)

  const inputRef = useRef(null)

  // Keyboard shortcut: "/" focuses the input from anywhere
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (ev) => {
    ev?.preventDefault()
    const t = title.trim()
    if (!t) {
      inputRef.current?.focus()
      return
    }
    addTask(user.uid, {
      title: t,
      estimatedMinutes: +mins || 30,
      goalId: goalId || null,
      category: category || null,
      scheduledDate: iso(date),
      weekId: weekId(date),
    })
    setTitle('')
    setFlash(true)
    setTimeout(() => setFlash(false), 900)
    inputRef.current?.focus()
  }

  // Enter submits; Shift+Enter still submits (kept for muscle memory)
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const goalName = goals.find((g) => g.id === goalId)?.title
  const activeExtras = [goalId && 'goal', category && 'category'].filter(Boolean).length

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl border bg-white/[0.03] p-2 shadow-lg backdrop-blur-sm transition-colors ${
        flash ? 'border-volt/60' : 'border-white/10'
      }`}
    >
      {/* Primary row: title + submit */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon.Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
          <input
            ref={inputRef}
            className="field w-full border-0 bg-transparent pl-9 pr-10 focus:ring-0"
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Task title"
          />
          {!title && (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-dim sm:block">
              /
            </kbd>
          )}
        </div>

        <button
          type="submit"
          disabled={!title.trim()}
          className="btn inline-flex shrink-0 items-center gap-1.5 disabled:opacity-40"
        >
          {flash ? (
            <>
              <Icon.Check className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Added</span>
            </>
          ) : (
            <>
              <Icon.Plus className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Add</span>
            </>
          )}
        </button>
      </div>

      {/* Meta row: duration + advanced toggle */}
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setMins(d)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                +mins === d
                  ? 'bg-volt text-black'
                  : 'text-dim hover:text-white'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] px-1.5 py-1">
          <Icon.Clock className="h-3 w-3 text-dim" />
          <input
            type="number"
            min="5"
            step="5"
            value={mins}
            onChange={(e) => setMins(e.target.value)}
            aria-label="Estimated minutes"
            className="w-12 border-0 bg-transparent text-[11px] font-semibold text-white focus:outline-none focus:ring-0"
          />
          <span className="text-[10px] text-dim">min</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-dim transition hover:bg-white/5 hover:text-white"
          aria-expanded={expanded}
        >
          <Icon.Sliders className="h-3.5 w-3.5" />
          {expanded ? 'Hide' : 'More'}
          {activeExtras > 0 && !expanded && (
            <span className="rounded-full bg-volt/20 px-1.5 text-[10px] font-semibold text-volt">
              {activeExtras}
            </span>
          )}
        </button>
      </div>

      {/* Advanced: goal + category */}
      {expanded && (
        <div className="mt-2 grid gap-2 border-t border-white/[0.06] pt-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 transition focus-within:border-volt/40">
            <Icon.Target className="h-3.5 w-3.5 shrink-0 text-dim" />
            <select
              className="min-w-0 flex-1 border-0 bg-transparent text-xs text-white focus:outline-none focus:ring-0"
              value={goalId}
              onChange={(e) => setGoal(e.target.value)}
            >
              <option value="">No goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 transition focus-within:border-volt/40">
            <Icon.Tag className="h-3.5 w-3.5 shrink-0 text-dim" />
            <select
              className="min-w-0 flex-1 border-0 bg-transparent text-xs text-white focus:outline-none focus:ring-0"
              value={category}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="">No category</option>
              {cats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Summary line when advanced fields are set but collapsed */}
      {!expanded && (goalName || category) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1 text-[11px] text-dim">
          {goalName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
              <Icon.Target className="h-2.5 w-2.5" />
              {goalName}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
              <Icon.Tag className="h-2.5 w-2.5" />
              {category}
            </span>
          )}
        </div>
      )}
    </form>
  )
}