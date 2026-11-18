import { useState, type FormEvent } from 'react'
import { useStore } from '../store/Store'
import { TIPOS_INCIDENCIA, type Incidencia, type TipoIncidencia } from '../types'
import { hoy, nombreCompleto, uid } from '../lib/utils'
import { Field, Input, Modal, Select, Textarea } from './ui'
import { ColaboradorSelect } from './ColaboradorSelect'

export function unidadIncidencia(t: TipoIncidencia) {
  if (t === 'Horas extra') return 'horas'
  if (t === 'Bono' || t === 'Descuento') return 'importe $'
  if (t === 'Retardo' || t === 'Amonestación') return 'veces'
  return 'días'
}
export function cantidadTexto(i: Incidencia) {
  const u = unidadIncidencia(i.tipo)
  return u === 'importe $' ? `$${i.cantidad.toLocaleString('es-MX')}` : `${i.cantidad} ${u}`
}

export function IncidenciaForm({ open, onClose, colaboradorId, inicial }: { open: boolean; onClose: () => void; colaboradorId?: string; inicial?: Incidencia }) {
  const { empresa, db, guardarItem } = useStore()
  const [i, setI] = useState<Incidencia>(inicial ?? { id: uid(), empresaId: empresa.id, colaboradorId: colaboradorId ?? '', fecha: hoy(), tipo: 'Falta injustificada', cantidad: 1, descripcion: '', estatus: 'Pendiente' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const c = db.colaboradores.find((x) => x.id === i.colaboradorId)
    guardarItem('incidencias', i, { colaboradorId: i.colaboradorId, accion: `Incidencia "${i.tipo}" registrada para ${c ? nombreCompleto(c) : ''}` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={inicial ? 'Editar incidencia' : 'Registrar incidencia'}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-inc" className="btn-primary">Guardar</button></>}>
      <form id="form-inc" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        {!colaboradorId && <Field label="Colaborador *" className="sm:col-span-2"><ColaboradorSelect value={i.colaboradorId} onChange={(v) => setI({ ...i, colaboradorId: v })} required /></Field>}
        <Field label="Tipo"><Select value={i.tipo} onChange={(e) => setI({ ...i, tipo: e.target.value as TipoIncidencia })}>{TIPOS_INCIDENCIA.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Fecha"><Input type="date" required value={i.fecha} onChange={(e) => setI({ ...i, fecha: e.target.value })} /></Field>
        <Field label={`Cantidad (${unidadIncidencia(i.tipo)})`}><Input type="number" min={0} step="0.5" required value={i.cantidad} onChange={(e) => setI({ ...i, cantidad: Number(e.target.value) })} /></Field>
        <Field label="Estatus"><Select value={i.estatus} onChange={(e) => setI({ ...i, estatus: e.target.value as Incidencia['estatus'] })}><option>Pendiente</option><option>Aplicada</option></Select></Field>
        <Field label="Descripción" className="sm:col-span-2"><Textarea value={i.descripcion} onChange={(e) => setI({ ...i, descripcion: e.target.value })} /></Field>
        <p className="text-xs text-slate-500 sm:col-span-2">Las faltas, permisos sin goce e incapacidades descuentan días en nómina; las horas extra se pagan dobles; bonos y descuentos se suman o restan al recibo.</p>
      </form>
    </Modal>
  )
}
