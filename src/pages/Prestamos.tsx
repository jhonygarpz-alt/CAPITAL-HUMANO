import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CheckCircle2, Download, HandCoins, Pause, Play, Plus, Receipt, Trash2 } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Field, Input, Modal, Progress, Seccion, Select, Table, Textarea, confirmar, cx } from '../components/ui'
import { ColaboradorSelect } from '../components/ColaboradorSelect'
import { pagadoPrestamo, saldoPrestamo, totalPrestamo } from '../lib/nomina'
import { descargarCSV, fmtFecha, fmtMoney, hoy, nombreCompleto, normalizar, round2, uid } from '../lib/utils'
import type { Prestamo } from '../types'

export function siguienteFolioPrestamo(lista: Prestamo[], empresaId: string) {
  const pref = `PR-${hoy().slice(0, 4)}-`
  const max = lista.filter((p) => p.empresaId === empresaId && p.folio.startsWith(pref)).reduce((m, p) => Math.max(m, Number(p.folio.slice(pref.length)) || 0), 0)
  return pref + String(max + 1).padStart(4, '0')
}

export default function PrestamosPanel({ colaboradorId }: { colaboradorId?: string }) {
  const { deEmpresa, db } = useStore()
  const [estatus, setEstatus] = useState('vigentes')
  const [q, setQ] = useState('')
  const [form, setForm] = useState(false)
  const [detalle, setDetalle] = useState<string | null>(null)
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const lista = deEmpresa('prestamos').filter((p) => !colaboradorId || p.colaboradorId === colaboradorId)
  const filas = useMemo(() => lista
    .filter((p) => (estatus === 'vigentes' ? p.estatus === 'Activo' || p.estatus === 'Pausado' : !estatus || p.estatus === estatus))
    .filter((p) => { const c = colMap.get(p.colaboradorId); return !q || normalizar(`${p.folio} ${c ? nombreCompleto(c) : ''} ${p.motivo}`).includes(normalizar(q)) })
    .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [lista, estatus, q, db.colaboradores])
  const sel = lista.find((p) => p.id === detalle)
  const exportar = () => descargarCSV('prestamos', filas.map((p) => {
    const c = colMap.get(p.colaboradorId)
    return { Folio: p.folio, Colaborador: c ? nombreCompleto(c) : '', Solicitud: p.fechaSolicitud, 'Inicia descuento': p.fechaInicio, Monto: p.monto, 'Interés %': p.interes, Total: totalPrestamo(p), 'Descuento por nómina': p.descuento, Pagos: `${p.pagos.length}/${p.numeroPagos}`, Pagado: pagadoPrestamo(p), Saldo: saldoPrestamo(p), Estatus: p.estatus, Motivo: p.motivo }
  }))

  return (
    <Seccion titulo={colaboradorId ? 'Préstamos' : 'Préstamos a colaboradores'} icon={HandCoins} acciones={<div className="flex gap-2">
      {!colaboradorId && <button className="btn border border-white/60 py-1.5 text-sm text-white hover:bg-white/10" onClick={exportar} disabled={!filas.length}><Download size={15} /> Exportar</button>}
      <button className="btn border border-accent-600 bg-accent-500 py-1.5 text-sm text-primary-900 hover:bg-accent-400" onClick={() => setForm(true)}><Plus size={16} /> Nuevo préstamo</button>
    </div>}>
      {!colaboradorId && (
        <div className="grid gap-2 border-b border-slate-200 p-4 sm:grid-cols-[1fr_220px]">
          <Input placeholder="Buscar por folio, colaborador o motivo…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={estatus} onChange={(e) => setEstatus(e.target.value)}><option value="vigentes">Activos y pausados</option><option>Activo</option><option>Pausado</option><option>Liquidado</option><option>Cancelado</option><option value="">Todos</option></Select>
        </div>
      )}
      {filas.length === 0 ? <Empty title="Sin préstamos" text="Registra un préstamo cuando un colaborador lo solicite; se descontará automáticamente en cada nómina." /> : (
        <Table head={<><th className="th">Folio</th>{!colaboradorId && <th className="th">Colaborador</th>}<th className="th">Total</th><th className="th">Descuento</th><th className="th w-48">Avance</th><th className="th">Saldo</th><th className="th">Estatus</th><th className="th" /></>}>
          {filas.map((p) => {
            const c = colMap.get(p.colaboradorId)
            const total = totalPrestamo(p), pagado = pagadoPrestamo(p)
            return (
              <tr key={p.id} className="cursor-pointer hover:bg-accent-50" onClick={() => setDetalle(p.id)}>
                <td className="td"><span className="font-mono font-semibold text-primary-700">{p.folio}</span><div className="text-xs text-slate-500">{fmtFecha(p.fechaSolicitud)}</div></td>
                {!colaboradorId && <td className="td">{c ? <div className="flex items-center gap-2"><Avatar c={c} size={28} /><span className="font-semibold text-primary-900">{nombreCompleto(c)}</span></div> : '—'}</td>}
                <td className="td">{fmtMoney(total)}{p.interes > 0 && <div className="text-[11px] text-slate-500">{fmtMoney(p.monto)} + {p.interes}%</div>}</td>
                <td className="td">{fmtMoney(p.descuento)}<div className="text-[11px] text-slate-500">por nómina</div></td>
                <td className="td"><div className="flex items-center gap-2"><Progress value={total ? (pagado / total) * 100 : 0} /><span className="w-12 text-xs text-slate-500">{p.pagos.length}/{p.numeroPagos}</span></div></td>
                <td className="td font-bold text-primary-900">{fmtMoney(saldoPrestamo(p))}</td>
                <td className="td"><Badge>{p.estatus === 'Activo' ? 'Vigente' : p.estatus === 'Liquidado' ? 'Completo' : p.estatus === 'Pausado' ? 'Pendiente' : 'Cancelado'}</Badge></td>
                <td className="td text-right"><button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setDetalle(p.id) }}><Receipt size={16} /> Ver</button></td>
              </tr>
            )
          })}
        </Table>
      )}
      <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">El descuento aparece en la nómina como deducción «Préstamo» y se registra como pago al <b>cerrar</b> la nómina. Puedes omitirlo en un periodo desde el recibo, pausar el préstamo o registrar abonos extra.</p>
      {form && <PrestamoForm colaboradorId={colaboradorId} onClose={() => setForm(false)} />}
      {sel && <DetallePrestamo p={sel} onClose={() => setDetalle(null)} />}
    </Seccion>
  )
}

function PrestamoForm({ colaboradorId, onClose }: { colaboradorId?: string; onClose: () => void }) {
  const { db, empresa, guardarItem } = useStore()
  const [p, setP] = useState<Prestamo>({ id: uid(), empresaId: empresa.id, colaboradorId: colaboradorId ?? '', folio: '', fechaSolicitud: hoy(), fechaInicio: hoy(), monto: 0, interes: 0, numeroPagos: 6, descuento: 0, motivo: '', estatus: 'Activo', pagos: [] })
  const [modoCalculo, setModoCalculo] = useState<'pagos' | 'descuento'>('pagos')
  const total = totalPrestamo(p)
  const c = db.colaboradores.find((x) => x.id === p.colaboradorId)
  const sueldoPeriodo = c ? c.salarioDiario * (empresa.periodicidadNomina === 'Semanal' ? 7 : empresa.periodicidadNomina === 'Quincenal' ? 15 : 30.4) : 0
  const recalcular = (cambios: Partial<Prestamo>, modo = modoCalculo) => {
    const n = { ...p, ...cambios }
    const t = totalPrestamo(n)
    if (modo === 'pagos') n.descuento = n.numeroPagos > 0 ? round2(t / n.numeroPagos) : 0
    else n.numeroPagos = n.descuento > 0 ? Math.ceil(t / n.descuento - 1e-9) : 0
    setP(n)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!c || p.monto <= 0 || p.descuento <= 0) return
    const final = { ...p, folio: siguienteFolioPrestamo(db.prestamos, empresa.id) }
    guardarItem('prestamos', final, { colaboradorId: c.id, accion: `Préstamo ${final.folio} por ${fmtMoney(total)} a ${nombreCompleto(c)} (${final.numeroPagos} pagos de ${fmtMoney(final.descuento)})`, modulo: 'Nómina' })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Nuevo préstamo" footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-prest" className="btn-accent" disabled={!c || p.monto <= 0 || p.descuento <= 0}><HandCoins size={16} /> Registrar préstamo</button></>}>
      <form id="form-prest" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        {!colaboradorId && <Field label="Colaborador *" className="sm:col-span-2"><ColaboradorSelect value={p.colaboradorId} onChange={(v) => setP({ ...p, colaboradorId: v })} required /></Field>}
        <Field label="Fecha de solicitud"><Input type="date" value={p.fechaSolicitud} onChange={(e) => setP({ ...p, fechaSolicitud: e.target.value })} /></Field>
        <Field label="Empezar a descontar desde" hint="Se descuenta en las nóminas cuyo periodo termine a partir de esta fecha"><Input type="date" value={p.fechaInicio} onChange={(e) => setP({ ...p, fechaInicio: e.target.value })} /></Field>
        <Field label="Monto prestado *"><Input type="number" min={1} step="0.01" required value={p.monto || ''} onChange={(e) => recalcular({ monto: Number(e.target.value) })} /></Field>
        <Field label="Interés total (%)" hint="0 si no cobra interés"><Input type="number" min={0} step="0.1" value={p.interes} onChange={(e) => recalcular({ interes: Number(e.target.value) })} /></Field>
        <div className="sm:col-span-2">
          <span className="label">Forma de descuento</span>
          <div className="mb-2 flex gap-2">
            <button type="button" className={modoCalculo === 'pagos' ? 'btn-primary py-1.5' : 'btn-secondary py-1.5'} onClick={() => { setModoCalculo('pagos'); recalcular({}, 'pagos') }}>Por número de pagos</button>
            <button type="button" className={modoCalculo === 'descuento' ? 'btn-primary py-1.5' : 'btn-secondary py-1.5'} onClick={() => { setModoCalculo('descuento'); recalcular({}, 'descuento') }}>Por importe fijo</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Número de pagos"><Input type="number" min={1} disabled={modoCalculo === 'descuento'} value={p.numeroPagos || ''} onChange={(e) => recalcular({ numeroPagos: Number(e.target.value) })} /></Field>
            <Field label={`Descuento por nómina (${empresa.periodicidadNomina.toLowerCase()})`}><Input type="number" min={1} step="0.01" disabled={modoCalculo === 'pagos'} value={p.descuento || ''} onChange={(e) => recalcular({ descuento: Number(e.target.value) })} /></Field>
          </div>
        </div>
        <Field label="Motivo" className="sm:col-span-2"><Textarea rows={2} value={p.motivo} onChange={(e) => setP({ ...p, motivo: e.target.value })} placeholder="Ej. gastos médicos, anticipo, emergencia familiar" /></Field>
        {total > 0 && (
          <div className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800 sm:col-span-2">
            Total a pagar <b>{fmtMoney(total)}</b> en <b>{p.numeroPagos}</b> pago(s) de <b>{fmtMoney(p.descuento)}</b>.
            {c && sueldoPeriodo > 0 && p.descuento > sueldoPeriodo * 0.3 && <span className="mt-1 block font-semibold text-amber-700">⚠ El descuento es mayor al 30% del sueldo del periodo ({fmtMoney(sueldoPeriodo)}). La LFT (art. 110) limita los descuentos por deudas con el patrón.</span>}
          </div>
        )}
      </form>
    </Modal>
  )
}

function DetallePrestamo({ p, onClose }: { p: Prestamo; onClose: () => void }) {
  const { db, guardarItem, eliminarItem } = useStore()
  const c = db.colaboradores.find((x) => x.id === p.colaboradorId)
  const [abono, setAbono] = useState('')
  const [nota, setNota] = useState('')
  const total = totalPrestamo(p), pagado = pagadoPrestamo(p), saldo = saldoPrestamo(p)
  const ev = (accion: string) => ({ colaboradorId: p.colaboradorId, accion: `${accion} · préstamo ${p.folio}`, modulo: 'Nómina' })
  const registrarAbono = () => {
    const imp = round2(Math.min(Number(abono) || 0, saldo))
    if (!imp) return
    const act = { ...p, pagos: [...p.pagos, { id: uid(), fecha: hoy(), importe: imp, nota: nota || 'Abono extraordinario' }] }
    guardarItem('prestamos', saldoPrestamo(act) <= 0.009 ? { ...act, estatus: 'Liquidado' } : act, ev(`Abono de ${fmtMoney(imp)}`))
    setAbono(''); setNota('')
  }
  const cambiarEstatus = (estatus: Prestamo['estatus'], texto: string) => { if (confirmar(`¿${texto}?`)) guardarItem('prestamos', { ...p, estatus }, ev(texto)) }
  return (
    <Modal open onClose={onClose} title={`Préstamo ${p.folio}`} wide footer={<button className="btn-primary" onClick={onClose}>Cerrar</button>}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {c && <><Avatar c={c} size={40} /><div><Link to={`/colaboradores/${c.id}`} className="font-bold text-primary-800 hover:underline">{nombreCompleto(c)}</Link><div className="text-xs text-slate-500">{c.puesto} · {c.numero}</div></div></>}
          <span className="ml-auto"><Badge>{p.estatus === 'Activo' ? 'Vigente' : p.estatus === 'Liquidado' ? 'Completo' : p.estatus === 'Pausado' ? 'Pendiente' : 'Cancelado'}</Badge></span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Total', fmtMoney(total)], ['Pagado', fmtMoney(pagado)], ['Saldo', fmtMoney(saldo)], ['Descuento', `${fmtMoney(p.descuento)} × ${p.numeroPagos}`]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-slate-200 p-3"><div className="text-xs text-slate-500">{l}</div><div className="text-lg font-extrabold text-primary-800">{v}</div></div>
          ))}
        </div>
        <Progress value={total ? (pagado / total) * 100 : 0} />
        <p className="text-sm text-slate-600">Solicitado el {fmtFecha(p.fechaSolicitud)} · descuento desde {fmtFecha(p.fechaInicio)}{p.interes ? ` · monto ${fmtMoney(p.monto)} + ${p.interes}% de interés` : ''}{p.motivo ? ` · ${p.motivo}` : ''}</p>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="bg-primary-600 px-3 py-2 text-sm font-bold text-white">Pagos registrados ({p.pagos.length})</div>
          {p.pagos.length === 0 ? <p className="px-3 py-3 text-sm text-slate-500">Aún no hay pagos. Se registran al cerrar cada nómina.</p> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {p.pagos.map((x, i) => (
                <li key={x.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-6 text-xs font-bold text-slate-400">{i + 1}</span>
                  <span className="flex-1">{fmtFecha(x.fecha)} · <span className="text-slate-500">{x.nominaId ? x.nota ?? 'Nómina' : x.nota}</span></span>
                  <b className="tabular-nums">{fmtMoney(x.importe)}</b>
                  {!x.nominaId && p.estatus !== 'Cancelado' && <button className="text-rose-500 hover:text-rose-700" title="Eliminar abono" onClick={() => confirmar('¿Eliminar este abono?') && guardarItem('prestamos', { ...p, estatus: p.estatus === 'Liquidado' ? 'Activo' : p.estatus, pagos: p.pagos.filter((y) => y.id !== x.id) }, ev('Abono eliminado'))}><Trash2 size={14} /></button>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {(p.estatus === 'Activo' || p.estatus === 'Pausado') && (
          <>
            <div className="grid gap-2 rounded-lg border border-dashed border-primary-300 bg-primary-50/40 p-3 sm:grid-cols-[1fr_1.5fr_auto]">
              <Field label="Abono extraordinario"><Input type="number" min={0} max={saldo} step="0.01" value={abono} onChange={(e) => setAbono(e.target.value)} placeholder={fmtMoney(saldo)} /></Field>
              <Field label="Nota"><Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. pago en efectivo, finiquito" /></Field>
              <div className="flex items-end"><button className="btn-accent w-full" disabled={!Number(abono)} onClick={registrarAbono}><Plus size={16} /> Registrar</button></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.estatus === 'Activo'
                ? <button className="btn-secondary" onClick={() => cambiarEstatus('Pausado', 'Pausar descuentos')}><Pause size={16} /> Pausar descuentos</button>
                : <button className="btn-secondary" onClick={() => cambiarEstatus('Activo', 'Reanudar descuentos')}><Play size={16} /> Reanudar descuentos</button>}
              <button className="btn-secondary" onClick={() => { if (confirmar(`¿Marcar como liquidado registrando un abono de ${fmtMoney(saldo)}?`)) guardarItem('prestamos', { ...p, estatus: 'Liquidado', pagos: saldo > 0 ? [...p.pagos, { id: uid(), fecha: hoy(), importe: saldo, nota: 'Liquidación' }] : p.pagos }, ev('Préstamo liquidado')) }}><CheckCircle2 size={16} /> Liquidar</button>
              <button className="btn-ghost text-rose-600" onClick={() => cambiarEstatus('Cancelado', 'Cancelar el préstamo')}><Ban size={16} /> Cancelar préstamo</button>
              {p.pagos.length === 0 && <button className={cx('btn-ghost ml-auto text-rose-600')} onClick={() => { if (confirmar('¿Eliminar el préstamo? No tiene pagos registrados.')) { eliminarItem('prestamos', p.id, ev('Préstamo eliminado')); onClose() } }}><Trash2 size={16} /> Eliminar</button>}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
