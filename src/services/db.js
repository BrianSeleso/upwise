import { db } from '../firebase/config'
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'

const col = (uid, name) => collection(db, 'users', uid, name)
export const subscribe = (uid, name, cb) =>
  onSnapshot(col(uid, name), { includeMetadataChanges: true }, (s) =>
    cb(s.docs.map((d) => ({ id: d.id, ...d.data() })), s.metadata.hasPendingWrites))
// Not awaited: offline, the promise only resolves once the server confirms.
export const create = (uid, name, data, id) => {
  const ref = id ? doc(col(uid, name), id) : doc(col(uid, name))
  setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}
export const patch = (uid, name, id, data) =>
  updateDoc(doc(db, 'users', uid, name, id), { ...data, updatedAt: serverTimestamp() })
export const remove = (uid, name, id) => deleteDoc(doc(db, 'users', uid, name, id))
export const setState = (uid, id, data) => setDoc(doc(db, 'users', uid, 'state', id), data)
