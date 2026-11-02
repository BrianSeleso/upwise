import { useMemo, useState } from 'react'
import {
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { jsPDF } from 'jspdf'
import useCollection from '../hooks/useCollection'
import { weekStart, iso } from '../utils/week'

// --- Inline icons ---
const Icon = {
  Download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  ),
  Target: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  Gauge: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 14l4-4M3 12a9 9 0 0118 0M12 21a9 9 0 009-9" />
    </svg>
  ),
  Trend: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
    </svg>
  ),
  Chart: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />
    </svg>
  ),
}

// --- Custom tooltip ---
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1424]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-dim">{p.dataKey}</span>
          <span className="ml-auto font-medium text-white">{p.value} min</span>
        </div>
      ))}
    </div>
  )
}

// --- Stat card ---
function Stat({ label, value, suffix, icon: IconCmp, accent, trend }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 shadow-lg backdrop-blur-sm transition hover:border-white/20 sm:p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-dim">{label}</p>
        {IconCmp && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
            <IconCmp className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
        {value}
        {suffix && <span className="ml-1 text-sm font-semibold text-dim">{suffix}</span>}
      </p>
      {trend && (
        <p className={`mt-0.5 flex items-center gap-1 text-xs ${trend.tone}`}>
          <Icon.Trend className="h-3 w-3" />
          {trend.text}
        </p>
      )}
    </div>
  )
}

export default function Analytics() {
  const [range, setRange] = useState('week')
  const { items: tasks } = useCollection('tasks')
  const { items: entries } = useCollection('timeEntries')

  const { from, to, data, planned, done, estMin, actualMin, rate, variance } = useMemo(() => {
    const from = range === 'week' ? weekStart() : startOfMonth(new Date())
    const to = range === 'week' ? addDays(weekStart(), 6) : endOfMonth(new Date())
    const fromIso = iso(from)
    const toIso = iso(to)
    const inRange = (s) => s && s >= fromIso && s <= toIso

    const planned = tasks.filter(
      (t) => t.scheduledDate && inRange(t.scheduledDate) && t.status !== 'cancelled'
    )
    const done = planned.filter((t) => t.status === 'completed')
    const valid = entries.filter(
      (e) => e.startedAt && inRange(e.startedAt.slice(0, 10))
    )

    const actualMin = Math.round(
      valid.reduce((s, e) => s + e.durationSeconds, 0) / 60
    )
    const estMin = planned.reduce((s, t) => s + (t.estimatedMinutes || 0), 0)
    const rate = planned.length ? Math.round((done.length / planned.length) * 100) : 0
    const variance = actualMin - estMin

    // Build a full day-by-day series (zero-filled) so the chart is honest
    const byDay = {}
    eachDayOfInterval({ start: from, end: to }).forEach((d) => {
      const k = iso(d)
      byDay[k] = { day: format(d, 'd MMM'), Estimated: 0, Actual: 0 }
    })
    planned.forEach((t) => {
      if (byDay[t.scheduledDate]) {
        byDay[t.scheduledDate].Estimated += t.estimatedMinutes || 0
      }
    })
    valid.forEach((e) => {
      const k = e.startedAt.slice(0, 10)
      if (byDay[k]) byDay[k].Actual += Math.round(e.durationSeconds / 60)
    })
    const data = Object.keys(byDay)
      .sort()
      .map((k) => byDay[k])

    return { from, to, data, planned, done, estMin, actualMin, rate, variance }
  }, [range, tasks, entries])

  const hasData = data.some((d) => d.Estimated || d.Actual)

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('UpWise report', 14, 20)
    doc.setFontSize(11)
    doc.setTextColor(120)
    doc.text(
      `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')} (${range})`,
      14,
      27
    )
    doc.setTextColor(0)
    const lines = [
      `Planned tasks: ${planned.length}`,
      `Completed: ${done.length} (${rate}%)`,
      `Estimated time: ${estMin} min`,
      `Actual time: ${actualMin} min`,
      `Time variance: ${variance > 0 ? '+' : ''}${variance} min`,
      `Carryover: ${planned.length - done.length} incomplete task(s)`,
    ]
    lines.forEach((l, i) => doc.text(l, 14, 42 + i * 8))
    doc.save(`upwise-${range}-${iso(new Date())}.pdf`)
  }

  const varianceTone =
    variance > 0 ? 'text-red-400' : variance < 0 ? 'text-emerald-400' : 'text-dim'

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-3 pb-16 pt-4 sm:px-5 sm:pt-8">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/15 text-volt">
            <Icon.Chart className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Insights</h1>
            <p className="text-xs text-dim">
              {format(from, 'd MMM')} – {format(to, 'd MMM yyyy')}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {['week', 'month'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                range === r
                  ? 'bg-volt text-black shadow'
                  : 'text-dim hover:text-white'
              }`}
            >
              {r === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>

        <button
          onClick={exportPdf}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.06] active:scale-[.98]"
        >
          <Icon.Download className="h-3.5 w-3.5" />
          <span className="hidden xs:inline sm:inline">Export PDF</span>
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Completion rate"
          value={rate}
          suffix="%"
          icon={Icon.Target}
          accent="bg-emerald-400/15 text-emerald-400"
        />
        <Stat
          label="Estimated"
          value={estMin}
          suffix="min"
          icon={Icon.Clock}
          accent="bg-sky-400/15 text-sky-400"
        />
        <Stat
          label="Actual"
          value={actualMin}
          suffix="min"
          icon={Icon.Gauge}
          accent="bg-volt/15 text-volt"
        />
        <Stat
          label="Variance"
          value={`${variance > 0 ? '+' : ''}${variance}`}
          suffix="min"
          icon={Icon.Trend}
          accent={
            variance > 0
              ? 'bg-red-400/15 text-red-400'
              : 'bg-emerald-400/15 text-emerald-400'
          }
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-lg backdrop-blur-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide">
            Estimated vs actual
          </h2>
          <span className="text-xs text-dim">minutes / day</span>
        </div>

        <div className="h-64 sm:h-80">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid stroke="#22325F" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#8E9CC4"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#8E9CC4"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Estimated"
                  fill="#8E9CC4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="Actual"
                  fill="#2E6BFF"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-dim">
                <Icon.Chart className="h-5 w-5" />
              </span>
              <p className="text-sm text-dim">No data in this period yet.</p>
              <p className="max-w-xs text-xs text-dim/70">
                Plan tasks and track time to see estimated versus actual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}