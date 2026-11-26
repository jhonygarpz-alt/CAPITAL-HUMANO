import type { Colaborador, ConfigPrima, Vacacion } from '../types'
import { addDays, aniosEntre, diasVacacionesLFT, diffDays, hoy, parseISO, round2, toISO } from './utils'
import { isrAguinaldo } from './aguinaldo'

/** Configuración de ley: LFT art. 80 (25%) y LISR art. 93 fr. XIV (15 UMA exentas). */
export const CONFIG_PRIMA_LEY: ConfigPrima = {
  porcentaje: 25,
  base: 'Salario diario',
  factorIntegracion: 1.0493,
  momentoPago: 'Al disfrutar las vacaciones',
  tablaVacaciones: 'Ley (reforma 2023)',
  diasAdicionales: 0,
  valorUMA: 117.31,
  umasExentas: 15,
  metodoISR: 'Art. 174 RLISR',
  noRetenerISR: false,
}
export const configPrimaDe = (c?: Partial<ConfigPrima>): ConfigPrima => ({ ...CONFIG_PRIMA_LEY, ...c })

/** Días de vacaciones que corresponden por años cumplidos según la configuración. */
export const diasVacacionesConfig = (anios: number, cfg: ConfigPrima) =>
  anios < 1 ? 0 : diasVacacionesLFT(anios) + (cfg.tablaVacaciones === 'Días adicionales' ? cfg.diasAdicionales : 0)

/** Próximo aniversario laboral (hoy cuenta si es hoy). */
export function proximoAniversario(fechaIngreso: string, desde = hoy()) {
  const ing = parseISO(fechaIngreso)
  const ref = parseISO(desde)
  let anio = ref.getFullYear()
  let f = new Date(anio, ing.getMonth(), ing.getDate())
  if (toISO(f) < desde) f = new Date(++anio, ing.getMonth(), ing.getDate())
  const fecha = toISO(f)
  return { fecha, anios: anio - ing.getFullYear(), enDias: diffDays(desde, fecha) }
}

export interface CalculoPrima {
  dias: number
  salarioBase: number
  importe: number
  exento: number
  gravado: number
  isr: number
  neto: number
}

/** Prima vacacional sobre cierto número de días de vacaciones. */
export function calcularPrima(c: Colaborador, dias: number, cfg: ConfigPrima): CalculoPrima {
  const salarioBase = round2(cfg.base === 'Salario diario integrado' ? c.salarioDiario * cfg.factorIntegracion : c.salarioDiario)
  const importe = round2(dias * salarioBase * (cfg.porcentaje / 100))
  const exento = round2(Math.min(importe, cfg.valorUMA * cfg.umasExentas))
  const gravado = round2(importe - exento)
  const isr = cfg.noRetenerISR ? 0 : isrAguinaldo(gravado, c.salarioDiario, cfg.metodoISR)
  return { dias, salarioBase, importe, exento, gravado, isr, neto: round2(importe - isr) }
}

/** Prima del periodo vacacional que se genera en el próximo aniversario. */
export function primaAniversario(c: Colaborador, cfg: ConfigPrima) {
  const ani = proximoAniversario(c.fechaIngreso)
  const dias = diasVacacionesConfig(ani.anios, cfg)
  return { ...ani, ...calcularPrima(c, dias, cfg) }
}

/** Prima de una solicitud de vacaciones (cuando se paga al disfrutarlas). */
export const primaDeVacacion = (c: Colaborador, v: Vacacion, cfg: ConfigPrima) => calcularPrima(c, v.dias, cfg)

export const aniosCumplidos = (c: Colaborador) => aniosEntre(c.fechaIngreso)
export const enRango = (fecha: string, dias: number) => fecha >= hoy() && fecha <= addDays(hoy(), dias)
