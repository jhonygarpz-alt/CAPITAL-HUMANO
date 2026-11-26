import type { ConfigNotificaciones, DB, Empresa } from '../types'
import { addDays, diffDays, fmtFecha, fmtMoney, hoy, nombreCompleto, parseISO, toISO } from './utils'
import { configPrimaDe, primaAniversario, primaDeVacacion, proximoAniversario } from './prima'

export const NOTIFICACIONES_DEFECTO: ConfigNotificaciones = {
  primaVacacional: { activo: true, dias: 15 },
  cumpleanos: { activo: true, dias: 7 },
  documentos: { activo: true, dias: 30 },
  contratos: { activo: true, dias: 30 },
  aniversarios: { activo: false, dias: 7 },
  vacacionesPendientes: { activo: true, dias: 0 },
  incidenciasPendientes: { activo: true, dias: 0 },
}

export const configNotificaciones = (db: DB): ConfigNotificaciones => {
  const g = db.ajustes.find((a) => a.id === 'general')?.notificaciones
  const r = { ...NOTIFICACIONES_DEFECTO }
  if (g) for (const k of Object.keys(r) as (keyof ConfigNotificaciones)[]) r[k] = { ...r[k], ...g[k] }
  return r
}

export type TipoAviso = keyof ConfigNotificaciones
export interface Aviso { id: string; tipo: TipoAviso; titulo: string; detalle: string; to: string; urgente: boolean; enDias?: number }

export const ETIQUETA_AVISO: Record<TipoAviso, string> = {
  primaVacacional: 'Prima vacacional',
  cumpleanos: 'Cumpleaños',
  documentos: 'Vencimiento de documentos',
  contratos: 'Vencimiento de contratos',
  aniversarios: 'Aniversarios laborales',
  vacacionesPendientes: 'Vacaciones por aprobar',
  incidenciasPendientes: 'Incidencias pendientes',
}

const cuando = (n: number) => (n < 0 ? `venció hace ${-n} día${n === -1 ? '' : 's'}` : n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`)

/** Próximo cumpleaños a partir de hoy. */
function proximoCumple(fechaNac: string) {
  const n = parseISO(fechaNac), t = hoy()
  let f = new Date(parseISO(t).getFullYear(), n.getMonth(), n.getDate())
  if (toISO(f) < t) f = new Date(f.getFullYear() + 1, n.getMonth(), n.getDate())
  return { fecha: toISO(f), enDias: diffDays(t, toISO(f)), edad: f.getFullYear() - n.getFullYear() }
}

/** Avisos de la empresa actual según la configuración de notificaciones. */
export function calcularAvisos(db: DB, empresa: Empresa): Aviso[] {
  const cfg = configNotificaciones(db)
  const t = hoy()
  const cols = db.colaboradores.filter((c) => c.empresaId === empresa.id && c.estatus !== 'Baja')
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const avisos: Aviso[] = []

  if (cfg.cumpleanos.activo) for (const c of cols) {
    if (!c.fechaNacimiento) continue
    const p = proximoCumple(c.fechaNacimiento)
    if (p.enDias <= cfg.cumpleanos.dias) avisos.push({ id: `cum-${c.id}`, tipo: 'cumpleanos', titulo: `Cumpleaños de ${nombreCompleto(c)}`, detalle: `${fmtFecha(p.fecha)} (${cuando(p.enDias)}) · cumple ${p.edad} años`, to: `/colaboradores/${c.id}`, urgente: p.enDias === 0, enDias: p.enDias })
  }

  if (cfg.aniversarios.activo) for (const c of cols) {
    const a = proximoAniversario(c.fechaIngreso)
    if (a.anios >= 1 && a.enDias <= cfg.aniversarios.dias) avisos.push({ id: `ani-${c.id}`, tipo: 'aniversarios', titulo: `${a.anios} año${a.anios === 1 ? '' : 's'} en la empresa: ${nombreCompleto(c)}`, detalle: `${fmtFecha(a.fecha)} (${cuando(a.enDias)})`, to: `/colaboradores/${c.id}`, urgente: false, enDias: a.enDias })
  }

  if (cfg.primaVacacional.activo) {
    const pc = configPrimaDe(empresa.configPrima)
    if (pc.momentoPago === 'En el aniversario') {
      for (const c of cols) {
        const p = primaAniversario(c, pc)
        if (p.anios >= 1 && p.enDias <= cfg.primaVacacional.dias) avisos.push({ id: `pri-${c.id}`, tipo: 'primaVacacional', titulo: `Pagar prima vacacional a ${nombreCompleto(c)}`, detalle: `${fmtMoney(p.importe)} por ${p.dias} días · aniversario ${fmtFecha(p.fecha)} (${cuando(p.enDias)})`, to: '/vacaciones?tab=prima', urgente: p.enDias <= 3, enDias: p.enDias })
      }
    } else {
      const lim = addDays(t, cfg.primaVacacional.dias)
      for (const v of db.vacaciones.filter((v) => v.empresaId === empresa.id && v.estatus === 'Aprobada' && v.fechaInicio >= t && v.fechaInicio <= lim)) {
        const c = colMap.get(v.colaboradorId); if (!c) continue
        const p = primaDeVacacion(c, v, pc)
        const n = diffDays(t, v.fechaInicio)
        avisos.push({ id: `pri-${v.id}`, tipo: 'primaVacacional', titulo: `Prima vacacional de ${nombreCompleto(c)}`, detalle: `${fmtMoney(p.importe)} por ${v.dias} días · vacaciones ${cuando(n)} (${fmtFecha(v.fechaInicio)})`, to: '/vacaciones?tab=prima', urgente: n <= 3, enDias: n })
      }
    }
  }

  if (cfg.documentos.activo) {
    const lim = addDays(t, cfg.documentos.dias)
    for (const d of db.documentos.filter((d) => d.empresaId === empresa.id && d.vencimiento && d.vencimiento <= lim)) {
      const c = colMap.get(d.colaboradorId); if (!c || c.estatus === 'Baja') continue
      const n = diffDays(t, d.vencimiento!)
      avisos.push({ id: `doc-${d.id}`, tipo: 'documentos', titulo: `${d.tipo} de ${nombreCompleto(c)}`, detalle: `${n < 0 ? 'Vencido' : 'Vence'} ${fmtFecha(d.vencimiento)} (${cuando(n)})`, to: `/colaboradores/${c.id}?tab=documentos`, urgente: n <= 7, enDias: n })
    }
  }

  if (cfg.contratos.activo) {
    const lim = addDays(t, cfg.contratos.dias)
    for (const k of db.contratos.filter((k) => k.empresaId === empresa.id && !k.cancelado && k.fechaFin && k.fechaFin <= lim)) {
      const c = colMap.get(k.colaboradorId); if (!c || c.estatus === 'Baja') continue
      const n = diffDays(t, k.fechaFin!)
      avisos.push({ id: `con-${k.id}`, tipo: 'contratos', titulo: `Contrato de ${nombreCompleto(c)}`, detalle: `${k.tipo} · ${n < 0 ? 'venció' : 'vence'} ${fmtFecha(k.fechaFin)} (${cuando(n)})`, to: `/colaboradores/${c.id}?tab=contratos`, urgente: n <= 7, enDias: n })
    }
  }

  if (cfg.vacacionesPendientes.activo) {
    const n = db.vacaciones.filter((v) => v.empresaId === empresa.id && v.estatus === 'Pendiente').length
    if (n) avisos.push({ id: 'vac-pend', tipo: 'vacacionesPendientes', titulo: `${n} solicitud${n === 1 ? '' : 'es'} de vacaciones por aprobar`, detalle: 'Revisa y aprueba o rechaza', to: '/vacaciones', urgente: false })
  }
  if (cfg.incidenciasPendientes.activo) {
    const n = db.incidencias.filter((i) => i.empresaId === empresa.id && i.estatus === 'Pendiente').length
    if (n) avisos.push({ id: 'inc-pend', tipo: 'incidenciasPendientes', titulo: `${n} incidencia${n === 1 ? '' : 's'} pendiente${n === 1 ? '' : 's'} de aplicar`, detalle: 'Se aplican al cerrar la nómina', to: '/incidencias', urgente: false })
  }

  return avisos.sort((a, b) => Number(b.urgente) - Number(a.urgente) || (a.enDias ?? 999) - (b.enDias ?? 999))
}
