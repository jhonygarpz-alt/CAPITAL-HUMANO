import type { Colaborador, ConfigAguinaldo, Incidencia, ReciboAguinaldo } from '../types'
import { calcularISR, diffDays, round2 } from './utils'

/** Configuración de ley (LFT art. 87 y LISR art. 93 fr. XIV). */
export const CONFIG_AGUINALDO_LEY: ConfigAguinaldo = {
  dias: 15,
  base: 'Salario diario',
  factorIntegracion: 1.0493,
  inicioPeriodo: '01-01',
  finPeriodo: '12-31',
  fechaPago: '12-20',
  descontarFaltas: true,
  descontarPermisosSinGoce: true,
  descontarIncapacidades: false,
  incluirBajas: true,
  valorUMA: 117.31,
  diasExentos: 30,
  metodoISR: 'Art. 174 RLISR',
  noRetenerISR: false,
}

export const configDe = (c?: Partial<ConfigAguinaldo>): ConfigAguinaldo => ({ ...CONFIG_AGUINALDO_LEY, ...c })

const isrMensual = (base: number) => calcularISR(base, 30.4)

/** ISR del aguinaldo gravado según el método elegido (sin subsidio al empleo). */
export function isrAguinaldo(gravado: number, salarioDiario: number, metodo: ConfigAguinaldo['metodoISR']) {
  if (gravado <= 0) return 0
  const ordinario = salarioDiario * 30.4
  if (metodo === 'Art. 96 LISR') return round2(Math.max(0, isrMensual(ordinario + gravado) - isrMensual(ordinario)))
  // Art. 174 RLISR: se calcula una tasa con la parte proporcional mensual y se aplica al total gravado
  const proporcional = (gravado / 365) * 30.4
  const diferencia = Math.max(0, isrMensual(ordinario + proporcional) - isrMensual(ordinario))
  return round2(gravado * (diferencia / proporcional))
}

/** Aguinaldo de un colaborador para un periodo de cómputo. */
export function calcularAguinaldo(c: Colaborador, incidencias: Incidencia[], cfg: ConfigAguinaldo, inicio: string, fin: string): ReciboAguinaldo {
  const desde = c.fechaIngreso > inicio ? c.fechaIngreso : inicio
  const finReal = c.estatus === 'Baja' && c.fechaBaja && c.fechaBaja < fin ? c.fechaBaja : fin
  const diasTrabajados = finReal >= desde ? diffDays(desde, finReal) + 1 : 0
  const tipos = [cfg.descontarFaltas && 'Falta injustificada', cfg.descontarPermisosSinGoce && 'Permiso sin goce', cfg.descontarIncapacidades && 'Incapacidad'].filter(Boolean) as string[]
  const diasDescontados = Math.min(diasTrabajados, incidencias
    .filter((i) => i.colaboradorId === c.id && tipos.includes(i.tipo) && i.fecha >= desde && i.fecha <= finReal)
    .reduce((s, i) => s + (Number(i.cantidad) || 0), 0))
  const diasComputables = diasTrabajados - diasDescontados
  const diasPeriodo = diffDays(inicio, fin) + 1
  const diasAguinaldo = round2((cfg.dias * diasComputables) / diasPeriodo)
  const salarioBase = round2(cfg.base === 'Salario diario integrado' ? c.salarioDiario * cfg.factorIntegracion : c.salarioDiario)
  const importe = round2(diasAguinaldo * salarioBase)
  const exento = round2(Math.min(importe, cfg.valorUMA * cfg.diasExentos))
  const gravado = round2(importe - exento)
  const isr = cfg.noRetenerISR ? 0 : isrAguinaldo(gravado, c.salarioDiario, cfg.metodoISR)
  return {
    colaboradorId: c.id, desde, hasta: finReal, diasTrabajados, diasDescontados, diasComputables, diasAguinaldo, salarioBase,
    importe, exento, gravado, isr, neto: round2(importe - isr), completo: diasComputables >= diasPeriodo,
  }
}

/** Colaboradores que entran al cálculo del periodo. */
export function colaboradoresConDerecho(cols: Colaborador[], cfg: ConfigAguinaldo, inicio: string, fin: string) {
  return cols.filter((c) => c.fechaIngreso <= fin && (c.estatus !== 'Baja' || (cfg.incluirBajas && !!c.fechaBaja && c.fechaBaja >= inicio)))
}
