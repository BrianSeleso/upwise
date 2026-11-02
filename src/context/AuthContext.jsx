import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, google, db } from '../firebase/config'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u)
    if (u) setDoc(doc(db, 'users', u.uid), { displayName: u.displayName || '', email: u.email || '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weekStartsOn: 1, dailyStartTime: '08:00', dailyEndTime: '18:00', updatedAt: serverTimestamp() }, { merge: true }).catch(() => {})
  }), [])
  const value = { user, loginGoogle: () => signInWithPopup(auth, google),
    login: (e, p) => signInWithEmailAndPassword(auth, e, p), register: (e, p) => createUserWithEmailAndPassword(auth, e, p), logout: () => signOut(auth) }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
