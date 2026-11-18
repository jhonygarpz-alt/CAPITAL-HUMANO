import { useState, type FormEvent } from 'react'
import { useStore } from '../store/Store'
import type { Colaborador, Vacacion } from '../types'
import { diasHabiles, hoy, nombreCompleto, periodoVacacional, uid } from '../lib/utils'
import { Field, Input, Modal, Textarea } from './ui'
import { ColaboradorSelect } from './ColaboradorSelect'

/** Saldo de vacaciones del periodo vigente. */
export function saldoVacaciones(c: Colaborador, vacaciones: Vacacion[]) {
  const p = periodoVacacional(c.fechaIngreso)
  const usados = vacaciones
    .filter((v) => v.colaboradorId === c.id && v.estatus === 'Aprobada' && v.fechaInicio >= p.inicio && v.fechaInicio <= p.fin)
    .reduce((s, v) => s + v.dias, 0)
  const pendientes = vacaciones.filter((v) => v.colaboradorId === c.id && v.estatus === 'Pendiente').reduce((s, v) => s + v.dias, 0)
  return { ...p, usados, pendientes, disponibles: Math.max(0, p.dias - usados) }
}

export function VacacionForm({ open, onClose, colaboradorId }: { open: boolean; onClose: () => void; colaboradorId?: string }) {
  const { empresa, db, guardarItem } = useStore()
  const [v, setV] = useState<Vacacion>({ id: uid(), empresaId: empresa.id, colaboradorId: colaboradorId ?? '', fechaInicio: hoy(), fechaFin: hoy(), dias: 1, estatus: 'Pendiente', fechaSolicitud: hoy() })
  const c = db.colaboradores.find((x) => x.id === v.colaboradorId)
  const saldo = c ? saldoVacaciones(c, db.vacaciones) : null
  const fechas = (ini: string, fin: string) => {
    if (fin < ini) fin = ini
    setV({ ...v, fechaInicio: ini, fechaFin: fin, dias: diasHabiles(ini, fin) })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    guardarItem('vacaciones', v, { colaboradorId: v.colaboradorId, accion: `Solicitud de ${v.dias} día(s) de vacaciones de ${c ? nombreCompleto(c) : ''}` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Solicitud de vacaciones"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-vac" className="btn-primary" disabled={!v.colaboradorId || v.dias < 1}>Registrar solicitud</button></>}>
      <form id="form-vac" onSubmit={submit} className="space-y-3">
        {!colaboradorId && <Field label="Colaborador *"><ColaboradorSelect value={v.colaboradorId} onChange={(id) => setV({ ...v, colaboradorId: id })} required /></Field>}
        {saldo && (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-primary-50 p-3 text-center text-sm">
            <div><div className="text-lg font-bold text-primary-700">{saldo.dias}</div><div className="text-xs text-slate-600">Le corresponden</div></div>
            <div><div className="text-lg font-bold text-primary-700">{saldo.usados}</div><div className="text-xs text-slate-600">Tomados</div></div>
            <div><div className="text-lg font-bold text-primary-700">{saldo.disponibles}</div><div className="text-xs text-slate-600">Disponibles</div></div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Desde"><Input type="date" required value={v.fechaInicio} onChange={(e) => fechas(e.target.value, v.fechaFin)} /></Field>
          <Field label="Hasta"><Input type="date" required value={v.fechaFin} min={v.fechaInicio} onChange={(e) => fechas(v.fechaInicio, e.target.value)} /></Field>
          <Field label="Días hábiles" hint="Lun–vie; puedes ajustar"><Input type="number" min={1} value={v.dias} onChange={(e) => setV({ ...v, dias: Number(e.target.value) })} /></Field>
        </div>
        {saldo && v.dias > saldo.disponibles && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">⚠ La solicitud excede los días disponibles ({saldo.disponibles}).</p>}
        <Field label="Comentario"><Textarea value={v.comentario ?? ''} onChange={(e) => setV({ ...v, comentario: e.target.value })} /></Field>
      </form>
    </Modal>
  )
}
