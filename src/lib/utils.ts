import type { Colaborador, Contrato } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const hoy = () => toISO(new Date())
export function toISO(d: Date) {
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}
export function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
export function addDays(s: string, n: number) {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export function diffDays(a: string, b: string) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000)
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export function fmtFecha(s?: string) {
  if (!s) return '—'
  const d = parseISO(s)
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
export function fmtFechaLarga(s?: string) {
  if (!s) return '—'
  const d = parseISO(s)
  return `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`
}

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
export const fmtMoney = (n: number) => money.format(n || 0)
export const round2 = (n: number) => Math.round(n * 100) / 100

export const nombreCompleto = (c: Pick<Colaborador, 'nombre' | 'apellidoPaterno' | 'apellidoMaterno'>) =>
  [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ')

export const iniciales = (c: Pick<Colaborador, 'nombre' | 'apellidoPaterno'>) =>
  ((c.nombre?.[0] || '') + (c.apellidoPaterno?.[0] || '')).toUpperCase()

/** Años completos entre dos fechas. */
export function aniosEntre(desde: string, hasta = hoy()) {
  const a = parseISO(desde), b = parseISO(hasta)
  let n = b.getFullYear() - a.getFullYear()
  if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) n--
  return Math.max(0, n)
}

export function antiguedadTexto(desde: string) {
  const a = parseISO(desde), b = new Date()
  let meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (b.getDate() < a.getDate()) meses--
  meses = Math.max(0, meses)
  const anios = Math.floor(meses / 12), m = meses % 12
  if (anios === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`
  return `${anios} ${anios === 1 ? 'año' : 'años'}${m ? ` ${m} ${m === 1 ? 'mes' : 'meses'}` : ''}`
}

/** Días de vacaciones por año de servicio cumplido (LFT, reforma 2023). */
export function diasVacacionesLFT(aniosCumplidos: number) {
  if (aniosCumplidos < 1) return 0
  if (aniosCumplidos <= 5) return 10 + aniosCumplidos * 2
  return 20 + Math.ceil((aniosCumplidos - 5) / 5) * 2
}

/** Periodo vacacional vigente: días que corresponden al aniversario más reciente. */
export function periodoVacacional(fechaIngreso: string) {
  const anios = aniosEntre(fechaIngreso)
  const ingreso = parseISO(fechaIngreso)
  const inicio = new Date(ingreso)
  inicio.setFullYear(ingreso.getFullYear() + anios)
  const fin = new Date(inicio)
  fin.setFullYear(inicio.getFullYear() + 1)
  fin.setDate(fin.getDate() - 1)
  return { anios, dias: diasVacacionesLFT(anios), inicio: toISO(inicio), fin: toISO(fin) }
}

/** Cuenta días hábiles (lunes a sábado, excluye domingo). */
export function diasHabiles(inicio: string, fin: string, incluirSabado = false) {
  let n = 0
  for (let d = parseISO(inicio); d <= parseISO(fin); d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    if (w === 0) continue
    if (w === 6 && !incluirSabado) continue
    n++
  }
  return n
}

export type EstadoContrato = 'Vigente' | 'Por vencer' | 'Vencido' | 'Cancelado'
export function estadoContrato(c: Contrato): EstadoContrato {
  if (c.cancelado) return 'Cancelado'
  if (!c.fechaFin) return 'Vigente'
  const d = diffDays(hoy(), c.fechaFin)
  if (d < 0) return 'Vencido'
  if (d <= 30) return 'Por vencer'
  return 'Vigente'
}

/** Tarifa ISR mensual (Art. 96 LISR). Se prorratea por días del periodo. */
const TARIFA_ISR_MENSUAL: [number, number, number][] = [
  [0.01, 0, 1.92],
  [746.05, 14.32, 6.4],
  [6332.06, 371.83, 10.88],
  [11128.02, 893.63, 16.0],
  [12935.83, 1182.88, 17.92],
  [15487.72, 1640.18, 21.36],
  [31236.5, 5004.12, 23.52],
  [49233.01, 9236.89, 30.0],
  [93993.91, 22665.17, 32.0],
  [125325.21, 32691.18, 34.0],
  [375975.62, 117912.32, 35.0],
]
export function calcularISR(baseGravable: number, diasPeriodo: number) {
  if (baseGravable <= 0) return 0
  const factor = 30.4 / diasPeriodo
  const mensual = baseGravable * factor
  let fila = TARIFA_ISR_MENSUAL[0]
  for (const f of TARIFA_ISR_MENSUAL) if (mensual >= f[0]) fila = f
  const isrMensual = fila[1] + (mensual - fila[0]) * (fila[2] / 100)
  return round2(isrMensual / factor)
}

/** Cuota obrera IMSS estimada (aprox. 2.775% del SBC). */
export function calcularIMSS(salarioDiario: number, dias: number) {
  const sbc = salarioDiario * 1.0493
  return round2(sbc * dias * 0.02775)
}

export function descargarCSV(nombre: string, filas: Record<string, string | number | undefined>[]) {
  if (!filas.length) return
  const cols = Object.keys(filas[0])
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [cols.map(esc).join(','), ...filas.map((f) => cols.map((c) => esc(f[c])).join(','))].join('\r\n')
  descargarArchivo(`${nombre}.csv`, '﻿' + csv, 'text/csv;charset=utf-8')
}

export function descargarArchivo(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Reduce una imagen a un cuadrado de `size` px y devuelve un dataURL JPEG. */
export function redimensionarImagen(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')!
      const s = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

export function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function fmtTamano(b?: number) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
