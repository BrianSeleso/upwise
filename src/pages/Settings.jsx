import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import useCollection from '../hooks/useCollection'
import { create, remove } from '../services/db'

// --- Inline icons ---
const Icon = {
  Cog: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  ),
  Tag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20.6 13.4L12 22l-9-9V4a1 1 0 011-1h9l7.6 7.6a2 2 0 010 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  ),
  Sun: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Moon: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
}

// --- Reusable section wrapper ---
function Section({ title, desc, icon: IconCmp, accent = 'bg-volt/15 text-volt', children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg backdrop-blur-sm">
      <header className="flex items-start gap-3 border-b border-white/[0.06] p-4">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <IconCmp className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-dim">{desc}</p>}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

// --- Preset palette for quick color picks ---
const PRESET_COLORS = [
  '#2E6BFF', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#14B8A6', '#8E9CC4',
]

export default function Settings() {
  const { user } = useAuth()
  const { items: cats } = useCollection('categories')
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2E6BFF')
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
  )

  const sortedCats = useMemo(
    () =>
      [...cats].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      ),
    [cats]
  )

  const onAdd = (e) => {
    e.preventDefault()
    const v = name.trim()
    if (!v) return
    create(user.uid, 'categories', { name: v, color })
    setName('')
  }

  const onDelete = (c) => {
    if (window.confirm(`Delete category "${c.name}"?`)) {
      remove(user.uid, 'categories', c.id)
    }
  }

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const toggleTheme = () => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    setIsDark(next)
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-3 pb-16 pt-4 sm:px-5 sm:pt-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-volt/15 text-volt">
          <Icon.Cog className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Settings</h1>
          <p className="text-xs text-dim">Customize your workspace</p>
        </div>
      </header>

      {/* Categories */}
      <Section
        title="Categories"
        desc="Tag tasks by area of focus"
        icon={Icon.Tag}
      >
        <form onSubmit={onAdd} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              className="field min-w-0 flex-1"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="btn inline-flex items-center gap-1.5 px-3"
              disabled={!name.trim()}
            >
              <Icon.Plus className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Add</span>
            </button>
          </div>

          {/* Color picker */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-white/15">
              <span className="absolute inset-0 rounded-lg" style={{ background: color }} />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Category colour"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <span className="text-xs text-dim">{color.toUpperCase()}</span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Use ${c}`}
                  className={`h-6 w-6 rounded-md border transition ${
                    color.toLowerCase() === c.toLowerCase()
                      ? 'border-white ring-2 ring-white/40'
                      : 'border-white/15 hover:border-white/40'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </form>

        {/* Category list */}
        <div className="mt-4">
          {sortedCats.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-dim">
              No categories yet — add one above.
            </p>
          ) : (
            <ul className="space-y-1">
              {sortedCats.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/10"
                    style={{ background: c.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                  <button
                    onClick={() => onDelete(c)}
                    aria-label={`Delete ${c.name}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-dim transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Icon.Trash className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* Notifications */}
      <Section
        title="Notifications"
        desc="Get gentle reminders for scheduled tasks"
        icon={Icon.Bell}
        accent="bg-sky-400/15 text-sky-400"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Browser notifications</p>
            <p className="mt-0.5 text-xs text-dim">
              {permission === 'granted' && 'Enabled — you’ll receive reminders.'}
              {permission === 'default' && 'Not enabled yet.'}
              {permission === 'denied' && 'Blocked in browser settings.'}
            </p>
          </div>

          {permission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <Icon.Check className="h-3.5 w-3.5" />
              Enabled
            </span>
          ) : (
            <button
              className="btn inline-flex items-center gap-1.5"
              onClick={requestNotifications}
              disabled={permission === 'denied'}
            >
              <Icon.Bell className="h-4 w-4" />
              Allow
            </button>
          )}
        </div>
      </Section>

      {/* Theme */}
      <Section
        title="Theme"
        desc="Switch between light and dark appearance"
        icon={isDark ? Icon.Moon : Icon.Sun}
        accent="bg-violet-400/15 text-violet-300"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{isDark ? 'Dark mode' : 'Light mode'}</p>
            <p className="mt-0.5 text-xs text-dim">Your choice is remembered per device.</p>
          </div>
          <button
            onClick={toggleTheme}
            aria-pressed={isDark}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              isDark ? 'bg-volt' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            >
              {isDark ? (
                <Icon.Moon className="h-3 w-3 text-black" />
              ) : (
                <Icon.Sun className="h-3 w-3 text-black" />
              )}
            </span>
          </button>
        </div>
      </Section>
    </div>
  )
}