import { createClient } from '@supabase/supabase-js'

// Llaves públicas (publishable): seguras para el navegador; la protección real está en las políticas RLS.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://nhebxyolqkcjzzwxeakp.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_a4OBaAWFAjVAL0tRqJVUTw_V3sx4TjT'

const RECORDAR = 'rh.recordarSesion'
const seguro = <T,>(fn: () => T, def: T) => { try { return fn() } catch { return def } }

/** "Recordar mi sesión": si está activo la sesión sobrevive al cerrar el navegador; si no, solo dura la pestaña. */
export const recordarSesion = () => seguro(() => localStorage.getItem(RECORDAR) !== '0', true)
export const setRecordarSesion = (v: boolean) => seguro(() => localStorage.setItem(RECORDAR, v ? '1' : '0'), undefined)

const almacenamiento = {
  getItem: (k: string) => seguro(() => localStorage.getItem(k) ?? sessionStorage.getItem(k), null),
  setItem: (k: string, v: string) => seguro(() => {
    if (recordarSesion()) { localStorage.setItem(k, v); sessionStorage.removeItem(k) } else { sessionStorage.setItem(k, v); localStorage.removeItem(k) }
  }, undefined),
  removeItem: (k: string) => seguro(() => { localStorage.removeItem(k); sessionStorage.removeItem(k) }, undefined),
}

export const supabase = createClient(URL, KEY, { auth: { storage: almacenamiento, persistSession: true } })
export const BUCKET = 'rh-archivos'

/** Lista de empresas guardada en este equipo para mostrarla en la pantalla de acceso (antes de iniciar sesión no se puede leer la base). */
const EMPRESAS = 'rh.empresasConocidas'
export const empresasConocidas = (): { id: string; nombre: string }[] => seguro(() => JSON.parse(localStorage.getItem(EMPRESAS) ?? '[]'), [])
export const guardarEmpresasConocidas = (l: { id: string; nombre: string }[]) => seguro(() => localStorage.setItem(EMPRESAS, JSON.stringify(l)), undefined)
