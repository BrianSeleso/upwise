import { useEffect, useState } from 'react'
import { subscribe } from '../services/db'
import { useAuth } from '../context/AuthContext'
export default function useCollection(name) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [pending, setPending] = useState(false)
  useEffect(() => (user ? subscribe(user.uid, name, (i, p) => { setItems(i); setPending(p) }) : undefined), [user, name])
  return { items, pending }
}
