import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Coleccion, DB, Empresa, ID } from '../types'
import { cargar, guardar } from './persist'
import { crearDBDemo } from './seed'
import { uid } from '../lib/utils'

type Item<K extends Coleccion> = DB[K][number]

interface StoreValue {
  db: DB
  empresa: Empresa
  setEmpresa: (id: ID) => void
  guardarItem: <K extends Coleccion>(col: K, item: Item<K>, evento?: { accion: string; colaboradorId?: ID; modulo?: string }) => void
  eliminarItem: <K extends Coleccion>(col: K, id: ID, evento?: { accion: string; colaboradorId?: ID; modulo?: string }) => void
  reemplazarDB: (db: DB) => void
  /** Elementos de una colección filtrados a la empresa actual. */
  deEmpresa: <K extends Exclude<Coleccion, 'empresas'>>(col: K) => DB[K]
}

const Ctx = createContext<StoreValue | null>(null)

const MODULOS: Partial<Record<Coleccion, string>> = {
  colaboradores: 'Colaboradores', documentos: 'Expedientes', contratos: 'Contratos', vacaciones: 'Vacaciones',
  asistencias: 'Asistencias', incidencias: 'Incidencias', nominas: 'Nómina', empresas: 'Configuración',
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null)

  useEffect(() => {
    cargar().then((d) => setDb(d ?? crearDBDemo()))
  }, [])

  useEffect(() => {
    if (!db) return
    const t = setTimeout(() => guardar(db), 250)
    return () => clearTimeout(t)
  }, [db])

  const guardarItem = useCallback<StoreValue['guardarItem']>((col, item, evento) => {
    setDb((prev) => {
      if (!prev) return prev
      const lista = prev[col] as { id: ID }[]
      const existe = lista.some((x) => x.id === (item as { id: ID }).id)
      const nueva = existe ? lista.map((x) => (x.id === (item as { id: ID }).id ? item : x)) : [...lista, item]
      const next = { ...prev, [col]: nueva } as DB
      if (evento) {
        next.eventos = [...next.eventos, { id: uid(), empresaId: prev.empresaActualId, colaboradorId: evento.colaboradorId, fecha: new Date().toISOString().slice(0, 16), modulo: evento.modulo ?? MODULOS[col] ?? col, accion: evento.accion }]
      }
      return next
    })
  }, [])

  const eliminarItem = useCallback<StoreValue['eliminarItem']>((col, id, evento) => {
    setDb((prev) => {
      if (!prev) return prev
      const next = { ...prev, [col]: (prev[col] as { id: ID }[]).filter((x) => x.id !== id) } as DB
      // Eliminación en cascada de la información relacionada
      const relacionadas = ['documentos', 'contratos', 'vacaciones', 'asistencias', 'incidencias', 'eventos'] as const
      if (col === 'colaboradores') {
        for (const r of relacionadas) (next as unknown as Record<string, unknown>)[r] = (next[r] as { colaboradorId?: ID }[]).filter((x) => x.colaboradorId !== id)
      }
      if (col === 'empresas') {
        for (const r of [...relacionadas, 'colaboradores', 'nominas'] as const) (next as unknown as Record<string, unknown>)[r] = (next[r] as { empresaId: ID }[]).filter((x) => x.empresaId !== id)
      }
      if (evento) {
        next.eventos = [...next.eventos, { id: uid(), empresaId: prev.empresaActualId, colaboradorId: evento.colaboradorId, fecha: new Date().toISOString().slice(0, 16), modulo: evento.modulo ?? MODULOS[col] ?? col, accion: evento.accion }]
      }
      return next
    })
  }, [])

  const value = useMemo<StoreValue | null>(() => {
    if (!db) return null
    const empresa = db.empresas.find((e) => e.id === db.empresaActualId) ?? db.empresas[0]
    return {
      db,
      empresa,
      setEmpresa: (id) => setDb((p) => (p ? { ...p, empresaActualId: id } : p)),
      guardarItem,
      eliminarItem,
      reemplazarDB: (d) => setDb(d),
      deEmpresa: (col) => (db[col] as { empresaId: ID }[]).filter((x) => x.empresaId === empresa.id) as never,
    }
  }, [db, guardarItem, eliminarItem])

  if (!value) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore fuera de StoreProvider')
  return v
}
