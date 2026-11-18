import { useState, type FormEvent } from 'react'
import { useStore } from '../store/Store'
import type { Contrato, TipoContrato } from '../types'
import { addDays, fmtFechaLarga, fmtMoney, nombreCompleto, uid } from '../lib/utils'
import { Field, Input, Modal, Select, Textarea } from './ui'
import { ColaboradorSelect } from './ColaboradorSelect'

const TIPOS: TipoContrato[] = ['Tiempo indeterminado', 'Tiempo determinado', 'Periodo de prueba', 'Capacitación inicial', 'Honorarios']

export function ContratoForm({ open, onClose, inicial, colaboradorId }: { open: boolean; onClose: () => void; inicial?: Contrato; colaboradorId?: string }) {
  const { empresa, db, guardarItem } = useStore()
  const col = db.colaboradores.find((c) => c.id === colaboradorId)
  const [k, setK] = useState<Contrato>(inicial ?? {
    id: uid(), empresaId: empresa.id, colaboradorId: colaboradorId ?? '', tipo: 'Tiempo indeterminado',
    puesto: col?.puesto ?? '', salarioDiario: col?.salarioDiario ?? 0, fechaInicio: col?.fechaIngreso ?? '', jornada: 'Lunes a viernes, 9:00 a 18:00',
  })
  const elegir = (id: string) => {
    const c = db.colaboradores.find((x) => x.id === id)
    setK({ ...k, colaboradorId: id, puesto: c?.puesto ?? '', salarioDiario: c?.salarioDiario ?? 0, fechaInicio: k.fechaInicio || c?.fechaIngreso || '' })
  }
  const tipo = (t: TipoContrato) => {
    const fin = t === 'Periodo de prueba' ? addDays(k.fechaInicio, 30) : t === 'Capacitación inicial' ? addDays(k.fechaInicio, 90) : t === 'Tiempo indeterminado' ? undefined : k.fechaFin
    setK({ ...k, tipo: t, fechaFin: k.fechaInicio ? fin : undefined })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const c = db.colaboradores.find((x) => x.id === k.colaboradorId)
    guardarItem('contratos', k, { colaboradorId: k.colaboradorId, accion: `${inicial ? 'Actualización de' : 'Nuevo'} contrato ${k.tipo.toLowerCase()} de ${c ? nombreCompleto(c) : ''}` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={inicial ? 'Editar contrato' : 'Nuevo contrato'}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-contrato" className="btn-primary">Guardar</button></>}>
      <form id="form-contrato" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        {!colaboradorId && !inicial && <Field label="Colaborador *" className="sm:col-span-2"><ColaboradorSelect value={k.colaboradorId} onChange={elegir} required /></Field>}
        <Field label="Tipo de contrato" className="sm:col-span-2">
          <Select value={k.tipo} onChange={(e) => tipo(e.target.value as TipoContrato)}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <Field label="Puesto *"><Input required value={k.puesto} onChange={(e) => setK({ ...k, puesto: e.target.value })} /></Field>
        <Field label="Salario diario *"><Input type="number" step="0.01" min={0} required value={k.salarioDiario || ''} onChange={(e) => setK({ ...k, salarioDiario: Number(e.target.value) })} /></Field>
        <Field label="Fecha de inicio *"><Input type="date" required value={k.fechaInicio} onChange={(e) => setK({ ...k, fechaInicio: e.target.value })} /></Field>
        <Field label="Fecha de término" hint={k.tipo === 'Tiempo indeterminado' ? 'No aplica para tiempo indeterminado' : undefined}>
          <Input type="date" disabled={k.tipo === 'Tiempo indeterminado'} required={k.tipo !== 'Tiempo indeterminado'} value={k.fechaFin ?? ''} onChange={(e) => setK({ ...k, fechaFin: e.target.value || undefined })} />
        </Field>
        <Field label="Jornada / horario" className="sm:col-span-2"><Input value={k.jornada} onChange={(e) => setK({ ...k, jornada: e.target.value })} /></Field>
        <Field label="Cláusulas adicionales / notas" className="sm:col-span-2"><Textarea value={k.notas ?? ''} onChange={(e) => setK({ ...k, notas: e.target.value })} /></Field>
      </form>
    </Modal>
  )
}

/** Abre una ventana con el contrato listo para imprimir o guardar como PDF. */
export function imprimirContrato(k: Contrato, dbCtx: ReturnType<typeof useStore>['db']) {
  const c = dbCtx.colaboradores.find((x) => x.id === k.colaboradorId)
  const e = dbCtx.empresas.find((x) => x.id === k.empresaId)
  if (!c || !e) return
  const vigencia = k.fechaFin ? `del ${fmtFechaLarga(k.fechaInicio)} al ${fmtFechaLarga(k.fechaFin)}` : `por tiempo indeterminado a partir del ${fmtFechaLarga(k.fechaInicio)}`
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato ${nombreCompleto(c)}</title>
<style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.6;color:#111}h1{text-align:center;font-size:18px;text-transform:uppercase}h2{font-size:14px;margin-top:24px}p{text-align:justify;font-size:13px}.firmas{display:flex;justify-content:space-between;margin-top:80px;gap:40px}.firmas div{flex:1;border-top:1px solid #000;text-align:center;padding-top:6px;font-size:12px}@media print{button{display:none}}</style></head><body>
<button onclick="print()" style="float:right;padding:8px 14px">Imprimir / Guardar PDF</button>
<h1>Contrato individual de trabajo<br>${k.tipo}</h1>
<p>Contrato que celebran por una parte <b>${e.razonSocial || e.nombre}</b>, con RFC ${e.rfc || '—'} y domicilio en ${e.direccion || '—'}, a quien en lo sucesivo se le denominará "EL PATRÓN", y por la otra <b>${nombreCompleto(c)}</b>, con CURP ${c.curp || '—'}, RFC ${c.rfc || '—'} y domicilio en ${c.direccion || '—'}, a quien se le denominará "EL TRABAJADOR", al tenor de las siguientes:</p>
<h2>CLÁUSULAS</h2>
<p><b>PRIMERA. Puesto.</b> EL TRABAJADOR prestará sus servicios personales subordinados con el puesto de <b>${k.puesto}</b>, realizando las actividades inherentes al mismo.</p>
<p><b>SEGUNDA. Vigencia.</b> El presente contrato se celebra ${vigencia}.</p>
<p><b>TERCERA. Jornada.</b> La jornada de trabajo será: ${k.jornada}, respetando los límites establecidos en la Ley Federal del Trabajo.</p>
<p><b>CUARTA. Salario.</b> EL TRABAJADOR percibirá un salario diario de <b>${fmtMoney(k.salarioDiario)}</b>, pagadero de forma ${e.periodicidadNomina.toLowerCase()}, del cual se harán las retenciones de ley.</p>
<p><b>QUINTA. Prestaciones.</b> EL TRABAJADOR gozará de vacaciones, prima vacacional, aguinaldo y demás prestaciones conforme a la Ley Federal del Trabajo.</p>
${k.notas ? `<p><b>SEXTA. Cláusulas adicionales.</b> ${k.notas}</p>` : ''}
<p>Leído que fue el presente contrato y enteradas las partes de su contenido y alcance, lo firman por duplicado el ${fmtFechaLarga(k.fechaInicio)}.</p>
<div class="firmas"><div>EL PATRÓN<br>${e.razonSocial || e.nombre}</div><div>EL TRABAJADOR<br>${nombreCompleto(c)}</div></div>
</body></html>`
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para imprimir el contrato.')
  w.document.write(html)
  w.document.close()
}
