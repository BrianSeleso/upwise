import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/images/logo.png'

const GoogleIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </svg>
)

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

export default function Login() {
  const { login, register, loginGoogle } = useAuth()
  const [e, setE] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(null)

  const run = (key, fn) => {
    setErr('')
    setLoading(key)
    fn()
      .catch((x) => setErr(x.message || 'Something went wrong'))
      .finally(() => setLoading(null))
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-volt/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-fadeIn rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-40" style={{ backgroundImage: 'linear-gradient(135deg,#B6FF3C 0%,#6EE7B7 100%)' }} />
            <img src={logo} alt="UpWise logo" className="relative h-14 w-14 rounded-xl object-contain shadow-lg ring-1 ring-white/10" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Up<span className="text-lime">Wise</span>
          </h1>
          <p className="mt-1 text-sm text-dim">Plan with purpose. Progress with intention.</p>
        </div>

        <div className="space-y-3">
          <input
            className="field w-full transition focus:ring-2 focus:ring-lime/40"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={e}
            onChange={(x) => setE(x.target.value)}
          />
          <input
            className="field w-full transition focus:ring-2 focus:ring-lime/40"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={p}
            onChange={(x) => setP(x.target.value)}
            onKeyDown={(ev) => ev.key === 'Enter' && run('login', () => login(e, p))}
          />
        </div>

        {err && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</p>}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            className="btn flex-1 justify-center transition active:scale-[.98] disabled:opacity-60"
            disabled={!!loading}
            onClick={() => run('login', () => login(e, p))}
          >
            {loading === 'login' ? <Spinner /> : 'Sign in'}
          </button>
          <button
            className="btn-ghost flex-1 justify-center transition active:scale-[.98] disabled:opacity-60"
            disabled={!!loading}
            onClick={() => run('register', () => register(e, p))}
          >
            {loading === 'register' ? <Spinner /> : 'Create account'}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-dim">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          className="btn-ghost flex w-full items-center justify-center gap-2 transition active:scale-[.98] disabled:opacity-60"
          disabled={!!loading}
          onClick={() => run('google', loginGoogle)}
        >
          {loading === 'google' ? <Spinner /> : <GoogleIcon />}
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  )
}