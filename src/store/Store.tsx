import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Coleccion, DB, Empresa, ID } from '../types'
import { supabase, BUCKET, guardarEmpresasConocidas } from '../lib/supabase'
import { crearDBDemo, crearDBVacia } from './seed'
import { uid } from '../lib/utils'
import { Login, SinAcceso, Cargando, Bienvenida } from '../components/Acceso'
import { moduloDe, permisosDe, type Modulo, type Nivel, type Permisos, type Rol } from '../lib/permisos'

type Item<K extends Coleccion> = DB[K][number]
type Evento = { accion: string; colaboradorId?: ID; modulo?: string }
type EstadoSync = 'ok' | 'guardando' | 'error'

export interface Miembro { user_id: string; email: string; nombre: string | null; rol: string; activo?: boolean; rolNombre?: string; permisos: Permisos }

interface StoreValue {
  db: DB
  empresa: Empresa
  setEmpresa: (id: ID) => void
  guardarItem: <K extends Coleccion>(col: K, item: Item<K>, evento?: Evento) => void
  eliminarItem: <K extends Coleccion>(col: K, id: ID, evento?: Evento) => void
  reemplazarDB: (db: DB) => void
  /** Elementos de una colección filtrados a la empresa actual. */
  deEmpresa: <K extends Exclude<Coleccion, 'empresas'>>(col: K) => DB[K]
  usuario: Miembro
  sync: EstadoSync
  cerrarSesion: () => void
  /** ¿El usuario tiene al menos este nivel en el módulo? */
  puede: (modulo: Modulo, nivel?: Exclude<Nivel, 'ninguno'>) => boolean
  /** Vuelve a leer el rol y permisos del usuario */
  refrescarPermisos: () => void
}

const Ctx = createContext<StoreValue | null>(null)

export const COLECCIONES: Coleccion[] = ['empresas', 'colaboradores', 'documentos', 'contratos', 'vacaciones', 'vacantes', 'constancias', 'aguinaldos', 'ajustes', 'prestamos', 'asistencias', 'incidencias', 'nominas', 'eventos']

const MODULOS: Partial<Record<Coleccion, string>> = {
  colaboradores: 'Colaboradores', documentos: 'Expedientes', contratos: 'Contratos', vacaciones: 'Vacaciones', vacantes: 'Vacantes', constancias: 'Constancias', aguinaldos: 'Aguinaldos', ajustes: 'Configuración', prestamos: 'Préstamos',
  asistencias: 'Asistencias', incidencias: 'Incidencias', nominas: 'Nómina', empresas: 'Configuración',
}

const PREF_EMPRESA = 'rh.empresaActual'
const leerPref = () => { try { return localStorage.getItem(PREF_EMPRESA) ?? '' } catch { return '' } }
const guardarPref = (v: string) => { try { localStorage.setItem(PREF_EMPRESA, v) } catch { /* sin almacenamiento */ } }

type Registro = { coleccion: Coleccion; id: string; empresa_id: string | null; data: { id: string } }

function dbVacia(): DB {
  const d = crearDBVacia()
  return { ...d, empresas: [], empresaActualId: '' }
}

async function cargarTodo(): Promise<DB> {
  const db = dbVacia() as unknown as Record<Coleccion, unknown[]> & DB
  const PAG = 1000
  for (let desde = 0; ; desde += PAG) {
    const { data, error } = await supabase.from('rh_registros').select('coleccion,id,data').order('coleccion').order('id').range(desde, desde + PAG - 1)
    if (error) throw error
    for (const r of data as Registro[]) if (COLECCIONES.includes(r.coleccion)) db[r.coleccion].push(r.data)
    if (data.length < PAG) break
  }
  return db
}

const empresaDe = (col: Coleccion, item: { id: string; empresaId?: string }) => (col === 'empresas' ? item.id : item.empresaId ?? null)

/** Compara dos estados y devuelve lo que hay que guardar y borrar en Supabase. */
function diferencias(antes: DB, despues: DB) {
  const upserts: Registro[] = []
  const borrados: { coleccion: Coleccion; id: string; ruta?: string }[] = []
  for (const col of COLECCIONES) {
    const a = antes[col] as { id: string; ruta?: string }[]
    const b = despues[col] as { id: string; empresaId?: string }[]
    if (a === b) continue
    const mapaA = new Map(a.map((x) => [x.id, x]))
    const idsB = new Set<string>()
    for (const x of b) {
      idsB.add(x.id)
      if (mapaA.get(x.id) !== x) upserts.push({ coleccion: col, id: x.id, empresa_id: empresaDe(col, x), data: x })
    }
    for (const x of a) if (!idsB.has(x.id)) borrados.push({ coleccion: col, id: x.id, ruta: x.ruta })
  }
  return { upserts, borrados }
}

async function enviar(upserts: Registro[], borrados: { coleccion: Coleccion; id: string; ruta?: string }[]) {
  for (let i = 0; i < upserts.length; i += 500) {
    const { error } = await supabase.from('rh_registros').upsert(upserts.slice(i, i + 500).map((r) => ({ ...r, updated_at: new Date().toISOString() })))
    if (error) throw error
  }
  const porCol = new Map<Coleccion, string[]>()
  borrados.forEach((b) => porCol.set(b.coleccion, [...(porCol.get(b.coleccion) ?? []), b.id]))
  for (const [col, ids] of porCol) {
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase.from('rh_registros').delete().eq('coleccion', col).in('id', ids.slice(i, i + 200))
      if (error) throw error
    }
  }
  const rutas = borrados.map((b) => b.ruta).filter(Boolean) as string[]
  if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas)
}

function aplicarRemoto(db: DB, col: Coleccion, tipo: string, item: { id: string } | null, id: string): DB {
  const lista = db[col] as { id: string }[]
  if (tipo === 'DELETE') return lista.some((x) => x.id === id) ? ({ ...db, [col]: lista.filter((x) => x.id !== id) } as DB) : db
  if (!item) return db
  const existe = lista.some((x) => x.id === id)
  return { ...db, [col]: existe ? lista.map((x) => (x.id === id ? item : x)) : [...lista, item] } as DB
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [acceso, setAcceso] = useState<'pendiente' | 'ok' | 'sin_invitacion' | 'inactivo'>('pendiente')
  const [usuario, setUsuario] = useState<Miembro | null>(null)
  const [db, setDb] = useState<DB | null>(null)
  const [error, setError] = useState('')
  const [sync, setSync] = useState<EstadoSync>('ok')
  const sincronizado = useRef<DB | null>(null)
  const cola = useRef(Promise.resolve())

  // Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Acceso y carga de datos
  const uidSesion = session?.user.id
  const permisosRef = useRef<Permisos | null>(null)
  const cargarUsuario = useCallback(async () => {
    if (!uidSesion) return false
    const { data: m, error: e } = await supabase.from('rh_miembros').select('user_id,email,nombre,rol,activo').eq('user_id', uidSesion).single()
    if (e || !m) { setError(e?.message ?? 'No se encontró tu usuario'); return false }
    const { data: rol } = await supabase.from('rh_roles').select('id,nombre,descripcion,permisos,sistema').eq('id', m.rol).maybeSingle()
    const permisos = permisosDe(m.rol, rol as Rol | null)
    permisosRef.current = permisos
    setUsuario({ ...(m as Omit<Miembro, 'permisos'>), rolNombre: (rol as Rol | null)?.nombre ?? m.rol, permisos })
    return true
  }, [uidSesion])
  const verificar = useCallback(async () => {
    if (!uidSesion) return
    setError('')
    const { data: r, error: e1 } = await supabase.rpc('rh_reclamar_acceso')
    if (e1) return setError(e1.message)
    if (r === 'inactivo') return setAcceso('inactivo')
    if (r !== 'ok') return setAcceso('sin_invitacion')
    if (!(await cargarUsuario())) return
    setAcceso('ok')
    try {
      const d = await cargarTodo()
      d.empresaActualId = leerPref()
      sincronizado.current = d
      setDb(d)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [uidSesion, cargarUsuario])

  useEffect(() => {
    if (!uidSesion) { setDb(null); setUsuario(null); setAcceso('pendiente'); sincronizado.current = null; return }
    verificar()
  }, [uidSesion, verificar])

  // Envío de cambios locales a Supabase
  useEffect(() => {
    if (!db || !sincronizado.current || db === sincronizado.current) return
    const { upserts, borrados } = diferencias(sincronizado.current, db)
    sincronizado.current = db
    if (!upserts.length && !borrados.length) return
    setSync('guardando')
    cola.current = cola.current
      .then(() => enviar(upserts, borrados))
      .then(() => setSync('ok'))
      .catch((e) => { console.error(e); setSync('error') })
  }, [db])

  // Recuerda las empresas en este equipo para el selector de la pantalla de acceso
  const empresasDb = db?.empresas
  useEffect(() => {
    if (empresasDb?.length) guardarEmpresasConocidas(empresasDb.map((e) => ({ id: e.id, nombre: e.nombre })))
  }, [empresasDb])

  // Cambios hechos por otros usuarios (tiempo real)
  useEffect(() => {
    if (acceso !== 'ok') return
    const canal = supabase
      .channel('rh_registros')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rh_registros' }, (p) => {
        const fila = (p.eventType === 'DELETE' ? p.old : p.new) as Partial<Registro>
        const col = fila.coleccion as Coleccion
        if (!col || !COLECCIONES.includes(col) || !fila.id) return
        const item = p.eventType === 'DELETE' ? null : (fila.data as { id: string })
        setDb((cur) => {
          if (!cur || !sincronizado.current) return cur
          // El mismo objeto entra a ambos estados para que no se reenvíe
          sincronizado.current = aplicarRemoto(sincronizado.current, col, p.eventType, item, fila.id!)
          return aplicarRemoto(cur, col, p.eventType, item, fila.id!)
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [acceso])

  const registrar = (prev: DB, next: DB, evento?: Evento, col?: Coleccion) => {
    if (!evento) return next
    return { ...next, eventos: [...next.eventos, { id: uid(), empresaId: prev.empresaActualId || next.empresas[0]?.id || '', colaboradorId: evento.colaboradorId, fecha: new Date().toISOString().slice(0, 16), modulo: evento.modulo ?? (col && MODULOS[col]) ?? '', accion: evento.accion }] }
  }

  const sinPermiso = (col: Coleccion) => {
    const m = moduloDe(col)
    if (!m || !permisosRef.current || permisosRef.current[m] === 'editar') return false
    alert('Tu rol solo permite consultar esta información. Pide a un administrador el permiso de edición.')
    return true
  }

  const guardarItem = useCallback<StoreValue['guardarItem']>((col, item, evento) => {
    if (sinPermiso(col)) return
    setDb((prev) => {
      if (!prev) return prev
      const lista = prev[col] as { id: ID }[]
      const id = (item as { id: ID }).id
      const nueva = lista.some((x) => x.id === id) ? lista.map((x) => (x.id === id ? item : x)) : [...lista, item]
      return registrar(prev, { ...prev, [col]: nueva } as DB, evento, col)
    })
  }, [])

  const eliminarItem = useCallback<StoreValue['eliminarItem']>((col, id, evento) => {
    if (sinPermiso(col)) return
    setDb((prev) => {
      if (!prev) return prev
      const next = { ...prev, [col]: (prev[col] as { id: ID }[]).filter((x) => x.id !== id) } as DB
      // Eliminación en cascada de la información relacionada
      const relacionadas = ['documentos', 'contratos', 'vacaciones', 'asistencias', 'incidencias', 'constancias', 'prestamos', 'eventos'] as const
      const mut = next as unknown as Record<string, unknown>
      if (col === 'colaboradores') for (const r of relacionadas) mut[r] = (next[r] as { colaboradorId?: ID }[]).filter((x) => x.colaboradorId !== id)
      if (col === 'empresas') for (const r of [...relacionadas, 'colaboradores', 'nominas', 'vacantes', 'aguinaldos'] as const) mut[r] = (next[r] as { empresaId: ID }[]).filter((x) => x.empresaId !== id)
      return registrar(prev, next, evento, col)
    })
  }, [])

  const value = useMemo<StoreValue | null>(() => {
    if (!db || !usuario || !db.empresas.length) return null
    const empresa = db.empresas.find((e) => e.id === db.empresaActualId) ?? db.empresas[0]
    return {
      db,
      empresa,
      setEmpresa: (id) => { guardarPref(id); setDb((p) => (p ? { ...p, empresaActualId: id } : p)) },
      guardarItem,
      eliminarItem,
      reemplazarDB: (d) => setDb({ ...dbVacia(), ...d, vacantes: d.vacantes ?? [], constancias: d.constancias ?? [], aguinaldos: d.aguinaldos ?? [], ajustes: d.ajustes ?? [], prestamos: d.prestamos ?? [], empresaActualId: d.empresaActualId || d.empresas[0]?.id || '' }),
      deEmpresa: (col) => (db[col] as { empresaId: ID }[]).filter((x) => x.empresaId === empresa.id) as never,
      usuario,
      sync,
      cerrarSesion: () => { supabase.auth.signOut() },
      puede: (modulo, nivel = 'ver') => { const n = usuario.permisos[modulo]; return nivel === 'ver' ? n !== 'ninguno' : n === 'editar' },
      refrescarPermisos: () => { cargarUsuario() },
    }
  }, [db, usuario, sync, guardarItem, eliminarItem, cargarUsuario])

  if (session === undefined) return <Cargando />
  if (!session) return <Login />
  if (error) return <Cargando error={error} onReintentar={verificar} />
  if (acceso === 'sin_invitacion' || acceso === 'inactivo') return <SinAcceso email={session.user.email ?? ''} inactivo={acceso === 'inactivo'} onReintentar={verificar} />
  if (!db) return <Cargando texto="Cargando información…" />
  if (!value) {
    return <Bienvenida esAdmin={usuario?.rol === 'admin'} onDemo={() => setDb({ ...crearDBDemo(), empresaActualId: 'emp-a' })} onVacia={() => setDb({ ...crearDBVacia() })} />
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore fuera de StoreProvider')
  return v
}
