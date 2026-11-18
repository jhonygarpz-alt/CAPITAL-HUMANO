import type { Colaborador, Incidencia, Recibo } from '../types'
import { calcularIMSS, calcularISR, diffDays, round2 } from './utils'

export function diasDelPeriodo(inicio: string, fin: string) {
  return diffDays(inicio, fin) + 1
}

/** Calcula el recibo de un colaborador con base en sus incidencias del periodo. */
export function calcularRecibo(c: Colaborador, incidencias: Incidencia[], inicio: string, fin: string): Recibo {
  const diasPeriodo = diasDelPeriodo(inicio, fin)
  const delPeriodo = incidencias.filter((i) => i.colaboradorId === c.id && i.fecha >= inicio && i.fecha <= fin)
  const suma = (tipos: string[]) => delPeriodo.filter((i) => tipos.includes(i.tipo)).reduce((s, i) => s + (Number(i.cantidad) || 0), 0)

  const diasFalta = Math.min(diasPeriodo, suma(['Falta injustificada', 'Permiso sin goce', 'Incapacidad']))
  const horasExtra = suma(['Horas extra'])
  const bonos = suma(['Bono'])
  const descuentos = suma(['Descuento'])

  const sd = c.salarioDiario
  const sueldo = round2(sd * diasPeriodo)
  const descuentoFaltas = round2(sd * diasFalta)
  const importeHorasExtra = round2((sd / 8) * 2 * horasExtra)
  const totalPercepciones = round2(sueldo + importeHorasExtra + bonos)
  const isr = calcularISR(totalPercepciones - descuentoFaltas, diasPeriodo)
  const imss = calcularIMSS(sd, diasPeriodo - diasFalta)
  const totalDeducciones = round2(isr + imss + descuentos + descuentoFaltas)
  return {
    colaboradorId: c.id,
    diasPeriodo,
    diasFalta,
    salarioDiario: sd,
    sueldo,
    horasExtra,
    importeHorasExtra,
    bonos,
    totalPercepciones,
    isr,
    imss,
    descuentos,
    descuentoFaltas,
    totalDeducciones,
    neto: round2(totalPercepciones - totalDeducciones),
  }
}
