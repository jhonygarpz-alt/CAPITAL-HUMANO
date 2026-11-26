import type { Coleccion } from '../types'

export type Nivel = 'ninguno' | 'ver' | 'editar'
export type Modulo = 'colaboradores' | 'expedientes' | 'contratos' | 'nomina' | 'aguinaldos' | 'asistencias' | 'vacaciones' | 'incidencias' | 'constancias' | 'vacantes' | 'reportes' | 'configuracion'
export type Permisos = Record<Modulo, Nivel>

export const MODULOS: { id: Modulo; label: string; ruta: string }[] = [
  { id: 'colaboradores', label: 'Colaboradores', ruta: '/colaboradores' },
  { id: 'expedientes', label: 'Expedientes', ruta: '/expedientes' },
  { id: 'contratos', label: 'Contratos', ruta: '/contratos' },
  { id: 'nomina', label: 'Nómina', ruta: '/nomina' },
  { id: 'aguinaldos', label: 'Aguinaldos', ruta: '/aguinaldos' },
  { id: 'asistencias', label: 'Asistencias', ruta: '/asistencias' },
  { id: 'vacaciones', label: 'Vacaciones', ruta: '/vacaciones' },
  { id: 'incidencias', label: 'Incidencias', ruta: '/incidencias' },
  { id: 'constancias', label: 'Constancias', ruta: '/constancias' },
  { id: 'vacantes', label: 'Vacantes', ruta: '/vacantes' },
  { id: 'reportes', label: 'Reportes', ruta: '/reportes' },
  { id: 'configuracion', label: 'Configuración', ruta: '/configuracion' },
]

export const TODO_EDITAR = Object.fromEntries(MODULOS.map((m) => [m.id, 'editar'])) as Permisos
export const NADA = Object.fromEntries(MODULOS.map((m) => [m.id, 'ninguno'])) as Permisos

export interface Rol { id: string; nombre: string; descripcion: string; permisos: Partial<Permisos>; sistema: boolean }

export const permisosDe = (rolId: string, rol?: Rol | null): Permisos =>
  rolId === 'admin' ? TODO_EDITAR : { ...NADA, ...(rol?.permisos ?? {}) }

/** Módulo dueño de cada colección (igual que privado.rh_modulo en la base de datos). */
export function moduloDe(col: Coleccion): Modulo | null {
  if (col === 'eventos') return null
  if (col === 'documentos') return 'expedientes'
  if (col === 'nominas') return 'nomina'
  if (col === 'empresas' || col === 'ajustes') return 'configuracion'
  return col as Modulo
}

/** Módulo de una ruta ("/nomina/abc" → "nomina"). */
export function moduloDeRuta(pathname: string): Modulo | null {
  const p = pathname.split('/')[1] ?? ''
  return MODULOS.find((m) => m.id === p)?.id ?? null
}

export const NIVEL_TEXTO: Record<Nivel, string> = { ninguno: 'Sin acceso', ver: 'Ver', editar: 'Editar' }
