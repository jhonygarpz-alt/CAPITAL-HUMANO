import type { DB } from '../types'

const DB_NAME = 'capital-humano'
const STORE = 'kv'
const KEY = 'db'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function cargar(): Promise<DB | undefined> {
  try {
    const db = await open()
    return await new Promise((resolve, reject) => {
      const r = db.transaction(STORE).objectStore(STORE).get(KEY)
      r.onsuccess = () => resolve(r.result as DB | undefined)
      r.onerror = () => reject(r.error)
    })
  } catch {
    return undefined
  }
}

export async function guardar(data: DB) {
  try {
    const db = await open()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(data, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.error('No se pudo guardar la información', e)
  }
}
