import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import useCollection from './hooks/useCollection'
import MiniTimer from './components/MiniTimer'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WeeklyPlanner from './pages/WeeklyPlanner'
import Goals from './pages/Goals'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import logo from './assets/images/logo.png'

function IconHome(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z" />
    </svg>
  )
}
function IconWeek(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  )
}
function IconGoal(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  )
}
function IconChart(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />
    </svg>
  )
}
function IconCog(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  )
}
function IconLogout(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Today', icon: IconHome, end: true },
  { to: '/plan', label: 'Plan', icon: IconWeek },
  { to: '/goals', label: 'Goals', icon: IconGoal },
  { to: '/insights', label: 'Insights', icon: IconChart },
  { to: '/settings', label: 'Settings', icon: IconCog },
]

function SyncBadge({ compact = false }) {
  const [online, setOnline] = useState(navigator.onLine)
  const { pending } = useCollection('tasks')

  useEffect(() => {
    const f = () => setOnline(navigator.onLine)
    addEventListener('online', f)
    addEventListener('offline', f)
    return () => {
      removeEventListener('online', f)
      removeEventListener('offline', f)
    }
  }, [])

  const state = !online ? 'offline' : pending ? 'syncing' : 'saved'
  const label = !online ? 'Offline' : pending ? 'Syncing' : 'Saved'

  const styles = {
    offline: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
    syncing: 'bg-volt/15 text-volt ring-volt/30',
    saved: 'bg-lime/10 text-lime ring-lime/30',
  }[state]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${styles}`}>
      <span className="relative flex h-1.5 w-1.5">
        {state === 'syncing' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt/70" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            state === 'offline' ? 'bg-amber-400' : state === 'syncing' ? 'bg-volt' : 'bg-lime'
          }`}
        />
      </span>
      {!compact && label}
    </span>
  )
}

export default function App() {
  const { user, logout } = useAuth()

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-dim">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-lime/30 border-t-lime" />
          Loading…
        </div>
      </div>
    )
  }
  if (!user) return <Login />

  return (
    <div className="min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-volt/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-lime/10 blur-[100px]" />
      </div>

      {/* ---------- Desktop sidebar ---------- */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:w-60 md:flex-col md:border-r md:border-line/60 md:bg-ink/70 md:backdrop-blur-xl">
        <NavLink to="/" className="flex items-center gap-3 px-5 py-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-40" style={{ backgroundImage: 'linear-gradient(135deg,#B6FF3C 0%,#6EE7B7 100%)' }} />
            <img src={logo} alt="UpWise" className="relative h-10 w-10 rounded-xl object-contain ring-1 ring-white/10" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">
              Up<span className="text-lime">Wise</span>
            </p>
            <p className="text-[10px] uppercase tracking-widest text-dim">Focus studio</p>
          </div>
        </NavLink>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: I, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-lg shadow-volt/30'
                    : 'text-dim hover:bg-white/[0.04] hover:text-white'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundImage: 'linear-gradient(135deg,#2E6BFF 0%,#7A5CFF 100%)' } : undefined
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-lime" />
                  )}
                  <I className="h-[18px] w-[18px] shrink-0" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-line/60 p-3">
          <SyncBadge />
          <button onClick={logout} className="btn-ghost w-full justify-start text-sm">
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/60 bg-ink/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <img src={logo} alt="UpWise" className="h-8 w-8 rounded-lg ring-1 ring-white/10" />
          <p className="text-base font-extrabold tracking-tight">
            Up<span className="text-lime">Wise</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            <SyncBadge compact />
            <button
              onClick={logout}
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-dim transition hover:bg-white/5 hover:text-white"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-3 pb-28 pt-4 sm:px-5 sm:pt-6 md:pb-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<WeeklyPlanner />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/insights" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden">
        <div
          className="mx-3 mb-3 rounded-2xl border border-line/60 bg-ink/85 p-1.5 shadow-2xl backdrop-blur-xl"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        >
          <ul className="grid grid-cols-5">
            {NAV.map(({ to, label, icon: I, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition ${
                      isActive ? 'text-lime' : 'text-dim hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition ${
                          isActive ? 'bg-lime/15' : ''
                        }`}
                      >
                        <I className="h-[18px] w-[18px]" />
                        {isActive && <span className="absolute inset-0 rounded-lg ring-1 ring-lime/40" />}
                      </span>
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <MiniTimer />
    </div>
  )
}