import { useMemo } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import useCollection from '../hooks/useCollection'
import TaskForm from '../components/TaskForm'
import { setStatus, reschedule } from '../services/taskService'
import { startTimer } from '../services/timeService'
import { iso, weekId } from '../utils/week'

// --- Small inline icons (no extra deps) ---
const Icon = {
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>
  ),
  Arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 9v4M12 17h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3.1l-8-14a2 2 0 00-3.4 0z" />
    </svg>
  ),
  Sun: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  ),
}

// --- Reusable Task Row ---
function TaskRow({ t, user, today, late }) {
  const done = t.status === 'completed'
  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04] sm:px-3">
      {/* Custom checkbox */}
      <button
        onClick={() => setStatus(user.uid, t.id, done ? 'todo' : 'completed')}
        aria-label={done ? `Mark ${t.title} incomplete` : `Complete ${t.title}`}
        aria-pressed={done}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          done
            ? 'border-volt bg-volt text-black'
            : 'border-white/25 hover:border-volt/70'
        }`}
      >
        {done && <Icon.Check className="h-3.5 w-3.5" />}
      </button>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${done ? 'text-dim line-through' : 'text-white'}`}>
          {t.title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-dim">
          <Icon.Clock className="h-3 w-3" />
          <span>{t.estimatedMinutes} min</span>
          {late && (
            <>
              <span className="opacity-40">•</span>
              <span className="text-amber-300/90">
                from {format(new Date(t.scheduledDate), 'd MMM')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {late && (
          <button
            onClick={() => reschedule(user.uid, t.id, today, weekId(new Date()))}
            className="hidden rounded-lg px-2.5 py-1.5 text-xs font-medium text-dim transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            Move to today
          </button>
        )}
        <button
          onClick={() => startTimer(user.uid, t.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-volt px-3 py-1.5 text-xs font-semibold text-black transition hover:brightness-110 active:scale-[.98]"
        >
          <Icon.Play className="h-3 w-3" />
          <span className="hidden xs:inline sm:inline">Start</span>
        </button>
      </div>
    </li>
  )
}

// --- Section card ---
function Section({ title, count, icon: IconCmp, accent, children, empty }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur-sm">
      <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        {IconCmp && (
          <span className={`flex h-6 w-6 items-center justify-center rounded-md ${accent}`}>
            <IconCmp className="h-3.5 w-3.5" />
          </span>
        )}
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-dim">
          {count}
        </span>
      </header>
      <div className="px-2 py-1 sm:px-3">
        {count > 0 ? <ul className="divide-y divide-white/[0.04]">{children}</ul> : empty}
      </div>
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { items: tasks } = useCollection('tasks')

  const { today, overdue, todays, completedToday } = useMemo(() => {
    const today = iso(new Date())
    const open = tasks.filter((t) => ['todo', 'in_progress'].includes(t.status))
    return {
      today,
      overdue: open.filter((t) => t.scheduledDate && t.scheduledDate < today),
      todays: tasks.filter((t) => t.scheduledDate === today && t.status !== 'cancelled'),
      completedToday: tasks.filter(
        (t) => t.scheduledDate === today && t.status === 'completed'
      ).length,
    }
  }, [tasks])

  const totalToday = todays.length
  const progress = totalToday ? Math.round((completedToday / totalToday) * 100) : 0
  const now = new Date()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-3 pb-16 pt-4 sm:px-5 sm:pt-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-dim">
            {format(now, 'EEEE')}
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {format(now, 'd MMMM')}
          </h1>
        </div>

        {/* Progress pill */}
        {totalToday > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="relative h-8 w-8">
              <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 94.2} 94.2`}
                  className="text-volt transition-all duration-500"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-xs text-dim">Today</p>
              <p className="text-sm font-semibold">
                {completedToday}/{totalToday} done
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Add task */}
      <TaskForm />

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section
          title="Overdue"
          count={overdue.length}
          icon={Icon.Alert}
          accent="bg-amber-400/15 text-amber-300"
        >
          {overdue.map((t) => (
            <TaskRow key={t.id} t={t} user={user} today={today} late />
          ))}
        </Section>
      )}

      {/* Today */}
      <Section
        title="Today"
        count={todays.length}
        icon={Icon.Sun}
        accent="bg-volt/15 text-volt"
        empty={
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-dim">
              <Icon.Sparkle className="h-5 w-5" />
            </span>
            <p className="text-sm text-dim">
              Nothing planned for today.
            </p>
            <p className="text-xs text-dim/70">
              Add a task above, or pull one in from your weekly plan.
            </p>
          </div>
        }
      >
        {todays.map((t) => (
          <TaskRow key={t.id} t={t} user={user} today={today} />
        ))}
      </Section>
    </div>
  )
}