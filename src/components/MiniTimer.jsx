import { useEffect, useMemo, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import useCollection from '../hooks/useCollection'
import {
  elapsedSeconds,
  pauseTimer,
  resumeTimer,
  finishTimer,
} from '../services/timeService'

const fmt = (s) =>
  [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')

const STORAGE_KEY = 'upwise.timer.pos'
const NAV_SAFE = 96 // px reserved at bottom for mobile nav

// --- Inline icons ---
const Icon = {
  Pause: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ),
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Stop: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  ),
  ChevronUp: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  ),
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Grip: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" />
      <circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" />
      <circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" />
    </svg>
  ),
}

// Clamp a position so the widget stays on screen
function clamp(x, y, w, h) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxX = vw - w - 8
  const maxY = vh - h - (vw < 768 ? NAV_SAFE : 8) // reserve space for mobile nav
  return {
    x: Math.max(8, Math.min(x, maxX)),
    y: Math.max(8, Math.min(y, maxY)),
  }
}

// Snap to nearest horizontal edge (nice UX)
function snapX(x, w) {
  const vw = window.innerWidth
  const left = 8
  const right = vw - w - 8
  return x + w / 2 < vw / 2 ? left : right
}

export default function MiniTimer() {
  const { user } = useAuth()
  const { items: tasks } = useCollection('tasks')
  const [t, setT] = useState(null)
  const [, tick] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)

  const wrapRef = useRef(null)
  const dragRef = useRef(null) // { startX, startY, origX, origY, w, h, moved }
  const [pos, setPos] = useState(null) // { x, y } once known

  // Subscribe to timer doc
  useEffect(
    () =>
      onSnapshot(doc(db, 'users', user.uid, 'state', 'timer'), (s) =>
        setT(s.exists() ? s.data() : null)
      ),
    [user]
  )

  // Tick every second
  useEffect(() => {
    const i = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(i)
  }, [])

  // Restore saved position or default to bottom-right
  useEffect(() => {
    const el = wrapRef.current
    if (!el || pos) return
    const w = el.offsetWidth
    const h = el.offsetHeight
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    } catch {}
    const defaults = {
      x: window.innerWidth - w - 16,
      y: window.innerHeight - h - (window.innerWidth < 768 ? NAV_SAFE : 16),
    }
    setPos(clamp(saved?.x ?? defaults.x, saved?.y ?? defaults.y, w, h))
  }, [pos])

  // Keep inside viewport on resize / orientation change
  useEffect(() => {
    const onResize = () => {
      const el = wrapRef.current
      if (!el || !pos) return
      setPos(clamp(pos.x, pos.y, el.offsetWidth, el.offsetHeight))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pos])

  const task = useMemo(
    () => tasks.find((x) => x.id === t?.taskId),
    [tasks, t?.taskId]
  )

  if (!t) return null

  const running = t.status === 'running'
  const secs = elapsedSeconds(t)
  const title = task?.title ?? 'Work session'
  const estSecs = (task?.estimatedMinutes || 0) * 60
  const progress = estSecs > 0 ? Math.min(100, Math.round((secs / estSecs) * 100)) : null
  const overTime = estSecs > 0 && secs > estSecs

  // ---------- Drag handlers (pointer events = mouse + touch) ----------
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      w: el.offsetWidth,
      h: el.offsetHeight,
      moved: false,
    }
    el.setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
    if (!d.moved) return
    setPos(clamp(d.origX + dx, d.origY + dy, d.w, d.h))
  }

  const onPointerUp = (e) => {
    const d = dragRef.current
    dragRef.current = null
    const el = wrapRef.current
    el?.releasePointerCapture?.(e.pointerId)
    if (!d) return

    // If dragged → snap to nearest side and save
    if (d.moved && pos) {
      const snapped = clamp(snapX(pos.x, d.w), pos.y, d.w, d.h)
      setPos(snapped)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped))
      } catch {}
    }
  }

  const act = async (key, fn) => {
    setBusy(key)
    try {
      await fn()
    } finally {
      setBusy(null)
    }
  }

  // Don't render until we have a position (avoids jump)
  if (!pos) {
    return <div ref={wrapRef} className="invisible fixed z-30" aria-hidden="true" />
  }

  return (
    <div
      ref={wrapRef}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-30 max-w-[calc(100vw-1rem)] select-none"
    >
      <div
        className={`overflow-hidden rounded-2xl border bg-[#0b1424]/90 shadow-2xl backdrop-blur-xl transition-shadow ${
          running ? 'border-lime/40 shadow-lime/10' : 'border-white/10'
        }`}
      >
        {/* Progress strip */}
        {progress !== null && (
          <div className="h-0.5 w-full bg-white/5">
            <div
              className={`h-full transition-all duration-1000 ${
                overTime ? 'bg-red-400' : 'bg-lime'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Header: drag handle + time + toggle */}
        <div className="flex items-center gap-2 px-2.5 py-2">
          {/* Drag grip */}
          <button
            type="button"
            aria-label="Drag timer"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="flex h-7 w-5 cursor-grab touch-none items-center justify-center rounded text-dim/70 transition hover:bg-white/5 hover:text-white active:cursor-grabbing"
          >
            <Icon.Grip className="h-3.5 w-3.5" />
          </button>

          {/* Live status dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {running && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime/60" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                running ? 'bg-lime' : 'bg-amber-400'
              }`}
            />
          </span>

          {/* Time — click to expand */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left transition hover:bg-white/[0.04]"
          >
            <span className="shrink-0 font-mono text-base font-bold tabular-nums tracking-tight">
              {fmt(secs)}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-dim">{title}</span>
            <span className="shrink-0 text-dim">
              {open ? (
                <Icon.ChevronDown className="h-4 w-4" />
              ) : (
                <Icon.ChevronUp className="h-4 w-4" />
              )}
            </span>
          </button>
        </div>

        {/* Expanded controls */}
        {open && (
          <div className="border-t border-white/[0.06] px-3 py-2.5">
            <div className="flex items-center gap-2">
              {running ? (
                <button
                  onClick={() => act('pause', () => pauseTimer(user.uid, t))}
                  disabled={!!busy}
                  className="btn inline-flex flex-1 items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Icon.Pause className="h-3.5 w-3.5" />
                  {busy === 'pause' ? 'Pausing…' : 'Pause'}
                </button>
              ) : (
                <button
                  onClick={() => act('resume', () => resumeTimer(user.uid, t))}
                  disabled={!!busy}
                  className="btn inline-flex flex-1 items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Icon.Play className="h-3.5 w-3.5" />
                  {busy === 'resume' ? 'Resuming…' : 'Resume'}
                </button>
              )}

              <button
                onClick={() => act('finish', () => finishTimer(user.uid, t))}
                disabled={!!busy}
                className="btn-ghost inline-flex flex-1 items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Icon.Stop className="h-3 w-3" />
                {busy === 'finish' ? 'Finishing…' : 'Finish'}
              </button>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-dim">
              <Icon.Clock className="h-3 w-3" />
              {estSecs > 0 ? (
                overTime ? (
                  <span className="text-red-400">Over by {fmt(secs - estSecs)}</span>
                ) : (
                  <span>
                    {fmt(Math.max(0, estSecs - secs))} remaining of {task.estimatedMinutes}m
                  </span>
                )
              ) : (
                <span>No estimate set</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}