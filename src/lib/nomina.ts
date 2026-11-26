import type { ClaveConcepto, Colaborador, ConceptoNomina, Incidencia, Prestamo, Recibo } from '../types'
import { calcularIMSS, calcularISR, diffDays, round2, uid } from './utils'

export function diasDelPeriodo(inicio: string, fin: string) {
  return diffDays(inicio, fin) + 1
}

type InfoConcepto = { tipo: 'percepcion' | 'deduccion'; nombre: string; /** Se captura en horas en vez de importe */ horas?: 2 | 3; /** Puede capturarse a mano */ manual: boolean; gravable?: boolean }

/** Catálogo de conceptos de nómina. */
export const CATALOGO: Record<ClaveConcepto, InfoConcepto> = {
  sueldo: { tipo: 'percepcion', nombre: 'Sueldo', manual: false, gravable: true },
  horas_dobles: { tipo: 'percepcion', nombre: 'Horas extra dobles', horas: 2, manual: true },
  horas_triples: { tipo: 'percepcion', nombre: 'Horas extra triples', horas: 3, manual: true, gravable: true },
  bono: { tipo: 'percepcion', nombre: 'Bono', manual: true, gravable: true },
  comision: { tipo: 'percepcion', nombre: 'Comisión', manual: true, gravable: true },
  premio_puntualidad: { tipo: 'percepcion', nombre: 'Premio de puntualidad', manual: true, gravable: true },
  premio_asistencia: { tipo: 'percepcion', nombre: 'Premio de asistencia', manual: true, gravable: true },
  prima_dominical: { tipo: 'percepcion', nombre: 'Prima dominical', manual: true, gravable: true },
  otra_percepcion: { tipo: 'percepcion', nombre: 'Otra percepción', manual: true, gravable: true },
  faltas: { tipo: 'deduccion', nombre: 'Faltas / días no pagados', manual: false },
  isr: { tipo: 'deduccion', nombre: 'ISR', manual: false },
  imss: { tipo: 'deduccion', nombre: 'IMSS (cuota obrera)', manual: false },
  prestamo: { tipo: 'deduccion', nombre: 'Préstamo', manual: false },
  infonavit: { tipo: 'deduccion', nombre: 'Crédito INFONAVIT', manual: true },
  fonacot: { tipo: 'deduccion', nombre: 'Crédito FONACOT', manual: true },
  pension_alimenticia: { tipo: 'deduccion', nombre: 'Pensión alimenticia', manual: true },
  caja_ahorro: { tipo: 'deduccion', nombre: 'Caja / fondo de ahorro', manual: true },
  anticipo: { tipo: 'deduccion', nombre: 'Anticipo de sueldo', manual: true },
  descuento: { tipo: 'deduccion', nombre: 'Descuento', manual: true },
  otra_deduccion: { tipo: 'deduccion', nombre: 'Otra deducción', manual: true },
}

export const CLAVES_MANUALES = (Object.keys(CATALOGO) as ClaveConcepto[]).filter((k) => CATALOGO[k].manual)

/** Importe de horas extra: (salario diario ÷ 8) × factor × horas. */
export const importeHoras = (salarioDiario: number, horas: number, factor: 2 | 3) => round2((salarioDiario / 8) * factor * horas)

/** Crea un concepto manual; si es de horas calcula el importe. */
export function conceptoManual(clave: ClaveConcepto, valor: number, salarioDiario: number, descripcion?: string): ConceptoNomina {
  const info = CATALOGO[clave]
  const importe = info.horas ? importeHoras(salarioDiario, valor, info.horas) : round2(valor)
  return { id: uid(), tipo: info.tipo, clave, descripcion: descripcion?.trim() || info.nombre, cantidad: info.horas ? valor : undefined, importe, origen: 'manual' }
}

// ---------- Préstamos ----------
export const totalPrestamo = (p: Prestamo) => round2(p.monto * (1 + (p.interes || 0) / 100))
export const pagadoPrestamo = (p: Prestamo) => round2(p.pagos.reduce((s, x) => s + x.importe, 0))
export const saldoPrestamo = (p: Prestamo) => Math.max(0, round2(totalPrestamo(p) - pagadoPrestamo(p)))

/** Préstamos que deben descontarse a un colaborador en el periodo. */
export const prestamosAplicables = (prestamos: Prestamo[], colaboradorId: string, fin: string) =>
  prestamos.filter((p) => p.colaboradorId === colaboradorId && p.estatus === 'Activo' && p.fechaInicio <= fin && saldoPrestamo(p) > 0.009)

export interface OpcionesRecibo {
  prestamos?: Prestamo[]
  manuales?: ConceptoNomina[]
  prestamosOmitidos?: string[]
  /** Valor diario de la UMA para la exención de horas extra */
  uma?: number
  /** Id de la nómina, para no volver a descontar un pago ya registrado */
  nominaId?: string
}

/** Calcula el recibo de un colaborador: sueldo, incidencias, conceptos manuales, préstamos, ISR e IMSS. */
export function calcularRecibo(c: Colaborador, incidencias: Incidencia[], inicio: string, fin: string, op: OpcionesRecibo = {}): Recibo {
  const diasPeriodo = diasDelPeriodo(inicio, fin)
  const semanas = Math.max(1, Math.ceil(diasPeriodo / 7))
  const uma = op.uma ?? 117.31
  const sd = c.salarioDiario
  const delPeriodo = incidencias.filter((i) => i.colaboradorId === c.id && i.fecha >= inicio && i.fecha <= fin)
  const suma = (tipos: string[]) => delPeriodo.filter((i) => tipos.includes(i.tipo)).reduce((s, i) => s + (Number(i.cantidad) || 0), 0)
  const conceptos: ConceptoNomina[] = []
  const add = (x: Omit<ConceptoNomina, 'id'>) => { if (x.importe) conceptos.push({ id: uid(), ...x }) }

  // Sueldo y días no pagados
  const diasFalta = Math.min(diasPeriodo, suma(['Falta injustificada', 'Permiso sin goce', 'Incapacidad']))
  const sueldo = round2(sd * diasPeriodo)
  const descuentoFaltas = round2(sd * diasFalta)
  add({ tipo: 'percepcion', clave: 'sueldo', descripcion: `Sueldo (${diasPeriodo} días)`, cantidad: diasPeriodo, importe: sueldo, gravado: sueldo, origen: 'automatico' })

  // Horas extra de incidencias: hasta 9 por semana son dobles, el excedente triples (LFT art. 67 y 68)
  const horasInc = suma(['Horas extra'])
  const limiteDobles = 9 * semanas
  const dobInc = Math.min(horasInc, limiteDobles), tripInc = Math.max(0, horasInc - limiteDobles)
  if (dobInc) add({ tipo: 'percepcion', clave: 'horas_dobles', descripcion: `Horas extra dobles (${dobInc} h)`, cantidad: dobInc, importe: importeHoras(sd, dobInc, 2), origen: 'incidencia' })
  if (tripInc) add({ tipo: 'percepcion', clave: 'horas_triples', descripcion: `Horas extra triples (${tripInc} h)`, cantidad: tripInc, importe: importeHoras(sd, tripInc, 3), origen: 'incidencia' })
  const bonosInc = suma(['Bono'])
  if (bonosInc) add({ tipo: 'percepcion', clave: 'bono', descripcion: 'Bono (incidencias)', importe: round2(bonosInc), origen: 'incidencia' })

  // Conceptos manuales (se recalculan las horas con el salario actual)
  for (const m of op.manuales ?? []) {
    const info = CATALOGO[m.clave]
    const importe = info.horas && m.cantidad !== undefined ? importeHoras(sd, m.cantidad, info.horas) : m.importe
    conceptos.push({ ...m, importe, tipo: info.tipo, origen: 'manual' })
  }

  // Exención de horas dobles: 50% hasta 5 UMA por semana (LISR art. 93 fr. I)
  const dobles = conceptos.filter((x) => x.clave === 'horas_dobles').reduce((s, x) => s + x.importe, 0)
  const exentoDobles = round2(Math.min(dobles * 0.5, 5 * uma * semanas))
  for (const x of conceptos) {
    if (x.tipo !== 'percepcion' || x.gravado !== undefined) continue
    x.gravado = x.clave === 'horas_dobles' ? round2(x.importe - (dobles ? exentoDobles * (x.importe / dobles) : 0)) : x.importe
  }

  const totalPercepciones = round2(conceptos.filter((x) => x.tipo === 'percepcion').reduce((s, x) => s + x.importe, 0))
  const baseGravable = round2(Math.max(0, conceptos.filter((x) => x.tipo === 'percepcion').reduce((s, x) => s + (x.gravado ?? 0), 0) - descuentoFaltas))

  // Deducciones de ley
  const isr = calcularISR(baseGravable, diasPeriodo)
  const imss = calcularIMSS(sd, diasPeriodo - diasFalta)
  add({ tipo: 'deduccion', clave: 'faltas', descripcion: `Faltas / días no pagados (${diasFalta})`, cantidad: diasFalta, importe: descuentoFaltas, origen: 'incidencia' })
  add({ tipo: 'deduccion', clave: 'isr', descripcion: 'ISR', importe: isr, origen: 'automatico' })
  add({ tipo: 'deduccion', clave: 'imss', descripcion: 'IMSS (cuota obrera)', importe: imss, origen: 'automatico' })
  const descInc = suma(['Descuento'])
  if (descInc) add({ tipo: 'deduccion', clave: 'descuento', descripcion: 'Descuento (incidencias)', importe: round2(descInc), origen: 'incidencia' })

  // Préstamos activos
  const omitidos = new Set(op.prestamosOmitidos ?? [])
  for (const p of prestamosAplicables(op.prestamos ?? [], c.id, fin)) {
    if (omitidos.has(p.id) || (op.nominaId && p.pagos.some((x) => x.nominaId === op.nominaId))) continue
    const importe = round2(Math.min(p.descuento, saldoPrestamo(p)))
    const n = p.pagos.length + 1
    add({ tipo: 'deduccion', clave: 'prestamo', descripcion: `Préstamo ${p.folio} · pago ${n} de ${p.numeroPagos}`, importe, origen: 'prestamo', prestamoId: p.id })
  }

  const totalDeducciones = round2(conceptos.filter((x) => x.tipo === 'deduccion').reduce((s, x) => s + x.importe, 0))
  const sumaClaves = (claves: ClaveConcepto[]) => round2(conceptos.filter((x) => claves.includes(x.clave)).reduce((s, x) => s + x.importe, 0))
  const horasExtra = conceptos.filter((x) => x.clave === 'horas_dobles' || x.clave === 'horas_triples').reduce((s, x) => s + (x.cantidad ?? 0), 0)
  const importeHorasExtra = sumaClaves(['horas_dobles', 'horas_triples'])
  return {
    colaboradorId: c.id,
    conceptos,
    manuales: op.manuales ?? [],
    prestamosOmitidos: op.prestamosOmitidos ?? [],
    baseGravable,
    diasPeriodo,
    diasFalta,
    salarioDiario: sd,
    sueldo,
    horasExtra,
    importeHorasExtra,
    bonos: round2(totalPercepciones - sueldo - importeHorasExtra),
    totalPercepciones,
    isr,
    imss,
    descuentos: round2(totalDeducciones - isr - imss - descuentoFaltas),
    descuentoFaltas,
    totalDeducciones,
    neto: round2(totalPercepciones - totalDeducciones),
  }
}

/** Conceptos de un recibo; los recibos antiguos (sin desglose) se reconstruyen a partir de sus totales. */
export function conceptosDe(r: Recibo): ConceptoNomina[] {
  if (r.conceptos?.length) return r.conceptos
  const l: ConceptoNomina[] = []
  const add = (tipo: 'percepcion' | 'deduccion', clave: ClaveConcepto, descripcion: string, importe: number) => { if (importe) l.push({ id: clave, tipo, clave, descripcion, importe, origen: 'automatico' }) }
  add('percepcion', 'sueldo', 'Sueldo', r.sueldo)
  add('percepcion', 'horas_dobles', `Horas extra (${r.horasExtra} h)`, r.importeHorasExtra)
  add('percepcion', 'bono', 'Bonos', r.bonos)
  add('deduccion', 'faltas', `Faltas (${r.diasFalta})`, r.descuentoFaltas)
  add('deduccion', 'isr', 'ISR', r.isr)
  add('deduccion', 'imss', 'IMSS', r.imss)
  add('deduccion', 'descuento', 'Otros descuentos', r.descuentos)
  return l
}
