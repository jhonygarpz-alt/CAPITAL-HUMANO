import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calculator, Download, Lock, Plus, Printer, RefreshCw, Trash2, Wallet } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Field, Input, Modal, PageHeader, Select, StatCard, Table, confirmar } from '../components/ui'
import { calcularRecibo } from '../lib/nomina'
import { addDays, descargarCSV, fmtFecha, fmtFechaLarga, fmtMoney, hoy, nombreCompleto, round2, uid } from '../lib/utils'
import type { DB, PeriodoNomina, Recibo } from '../types'

function periodoSugerido(tipo: PeriodoNomina['tipo']) {
  const t = hoy()
  const [y, m, d] = t.split('-').map(Number)
  const z = (n: number) => String(n).padStart(2, '0')
  if (tipo === 'Semanal') {
    const w = new Date(y, m - 1, d).getDay()
    const ini = addDays(t, -((w + 6) % 7))
    return { ini, fin: addDays(ini, 6) }
  }
  const ultimo = new Date(y, m, 0).getDate()
  if (tipo === 'Mensual') return { ini: `${y}-${z(m)}-01`, fin: `${y}-${z(m)}-${ultimo}` }
  return d <= 15 ? { ini: `${y}-${z(m)}-01`, fin: `${y}-${z(m)}-15` } : { ini: `${y}-${z(m)}-16`, fin: `${y}-${z(m)}-${ultimo}` }
}

export default function Nomina() {
  const { deEmpresa, empresa } = useStore()
  const [nueva, setNueva] = useState(false)
  const nominas = deEmpresa('nominas').sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))
  const ultima = nominas[0]
  const total = (n: PeriodoNomina, k: keyof Recibo) => round2(n.recibos.reduce((s, r) => s + (r[k] as number), 0))
  return (
    <>
      <PageHeader title="Nómina" subtitle={`Periodicidad ${empresa.periodicidadNomina.toLowerCase()} · cálculo con base en salario diario e incidencias`}
        actions={<button className="btn-primary" onClick={() => setNueva(true)}><Plus size={16} /> Calcular nueva nómina</button>} />
      {ultima && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Wallet size={20} />} value={fmtMoney(total(ultima, 'totalPercepciones'))} label={`Percepciones · ${ultima.nombre}`} />
          <StatCard icon={<Calculator size={20} />} value={fmtMoney(total(ultima, 'totalDeducciones'))} label="Deducciones" tono="red" />
          <StatCard icon={<Wallet size={20} />} value={fmtMoney(total(ultima, 'neto'))} label="Neto a pagar" tono="green" />
        </div>
      )}
      <div className="card overflow-hidden">
        {nominas.length === 0 ? (
          <Empty title="Aún no hay nóminas" text="Calcula tu primera nómina: el sistema toma el salario de cada colaborador activo y las incidencias del periodo." action={<button className="btn-primary" onClick={() => setNueva(true)}><Calculator size={16} /> Calcular nómina</button>} />
        ) : (
          <Table head={<><th className="th">Periodo</th><th className="th">Tipo</th><th className="th">Colaboradores</th><th className="th">Neto</th><th className="th">Estatus</th><th className="th" /></>}>
            {nominas.map((n) => (
              <tr key={n.id} className="hover:bg-slate-50">
                <td className="td"><Link to={`/nomina/${n.id}`} className="font-medium text-primary-700 hover:underline">{n.nombre}</Link><div className="text-xs text-slate-500">{fmtFecha(n.fechaInicio)} – {fmtFecha(n.fechaFin)}</div></td>
                <td className="td">{n.tipo}</td><td className="td">{n.recibos.length}</td>
                <td className="td font-semibold">{fmtMoney(total(n, 'neto'))}</td>
                <td className="td"><Badge>{n.estatus}</Badge></td>
                <td className="td text-right"><Link to={`/nomina/${n.id}`} className="btn-secondary py-1.5">Abrir</Link></td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">ℹ El ISR se calcula con la tarifa del Art. 96 LISR prorrateada y la cuota IMSS obrera es una estimación. Valida los importes con tu contador antes de timbrar.</p>
      {nueva && <NuevaNomina onClose={() => setNueva(false)} />}
    </>
  )
}

function NuevaNomina({ onClose }: { onClose: () => void }) {
  const { empresa, deEmpresa, guardarItem } = useStore()
  const nav = useNavigate()
  const [tipo, setTipo] = useState(empresa.periodicidadNomina)
  const sug = periodoSugerido(tipo)
  const [ini, setIni] = useState(sug.ini)
  const [fin, setFin] = useState(sug.fin)
  const cambiarTipo = (t: PeriodoNomina['tipo']) => { setTipo(t); const s = periodoSugerido(t); setIni(s.ini); setFin(s.fin) }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const incs = deEmpresa('incidencias')
    const activos = deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja' && c.fechaIngreso <= fin)
    const n: PeriodoNomina = {
      id: uid(), empresaId: empresa.id, tipo, fechaInicio: ini, fechaFin: fin, estatus: 'Borrador', fechaCreacion: hoy(),
      nombre: `Nómina ${tipo.toLowerCase()} ${fmtFecha(ini)} al ${fmtFecha(fin)}`,
      recibos: activos.map((c) => calcularRecibo(c, incs, ini, fin)),
    }
    guardarItem('nominas', n, { accion: `Nómina calculada: ${n.nombre} (${n.recibos.length} recibos)` })
    nav(`/nomina/${n.id}`)
  }
  return (
    <Modal open onClose={onClose} title="Calcular nueva nómina" footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-nom" className="btn-primary"><Calculator size={16} /> Calcular</button></>}>
      <form id="form-nom" onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <Field label="Periodicidad"><Select value={tipo} onChange={(e) => cambiarTipo(e.target.value as PeriodoNomina['tipo'])}><option>Semanal</option><option>Quincenal</option><option>Mensual</option></Select></Field>
        <Field label="Del"><Input type="date" required value={ini} onChange={(e) => setIni(e.target.value)} /></Field>
        <Field label="Al"><Input type="date" required min={ini} value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
        <p className="text-sm text-slate-500 sm:col-span-3">Se incluirán todos los colaboradores activos de <b>{empresa.nombre}</b> y las incidencias registradas dentro de estas fechas.</p>
      </form>
    </Modal>
  )
}

export function NominaDetalle() {
  const { id } = useParams()
  const { db, deEmpresa, guardarItem, eliminarItem, empresa } = useStore()
  const nav = useNavigate()
  const n = db.nominas.find((x) => x.id === id)
  if (!n) return <Empty title="Nómina no encontrada" action={<Link to="/nomina" className="btn-primary">Volver</Link>} />
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const tot = (k: keyof Recibo) => round2(n.recibos.reduce((s, r) => s + (r[k] as number), 0))

  const recalcular = () => {
    const incs = deEmpresa('incidencias')
    const activos = deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja' && c.fechaIngreso <= n.fechaFin)
    guardarItem('nominas', { ...n, recibos: activos.map((c) => calcularRecibo(c, incs, n.fechaInicio, n.fechaFin)) })
  }
  const cerrar = () => {
    if (!confirmar('Al cerrar la nómina ya no podrá recalcularse y las incidencias del periodo se marcarán como aplicadas. ¿Continuar?')) return
    guardarItem('nominas', { ...n, estatus: 'Cerrada' }, { accion: `Nómina cerrada: ${n.nombre}` })
    deEmpresa('incidencias').filter((i) => i.estatus === 'Pendiente' && i.fecha >= n.fechaInicio && i.fecha <= n.fechaFin).forEach((i) => guardarItem('incidencias', { ...i, estatus: 'Aplicada' }))
  }
  const exportar = () => descargarCSV(n.nombre, n.recibos.map((r) => {
    const c = colMap.get(r.colaboradorId)
    return { Número: c?.numero, Colaborador: c ? nombreCompleto(c) : '', 'Días': r.diasPeriodo, Faltas: r.diasFalta, 'Salario diario': r.salarioDiario, Sueldo: r.sueldo, 'Horas extra': r.importeHorasExtra, Bonos: r.bonos, Percepciones: r.totalPercepciones, ISR: r.isr, IMSS: r.imss, 'Desc. faltas': r.descuentoFaltas, 'Otros desc.': r.descuentos, Deducciones: r.totalDeducciones, Neto: r.neto, Banco: c?.banco, Cuenta: c?.cuenta }
  }))

  return (
    <>
      <Link to="/nomina" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600"><ArrowLeft size={16} /> Nómina</Link>
      <PageHeader title={n.nombre} subtitle={`${empresa.nombre} · ${n.recibos.length} recibos`}
        actions={<>
          <Badge>{n.estatus}</Badge>
          <button className="btn-secondary" onClick={exportar}><Download size={16} /> Exportar</button>
          <button className="btn-secondary" onClick={() => imprimirRecibos(n, n.recibos, db)}><Printer size={16} /> Imprimir recibos</button>
          {n.estatus === 'Borrador' && <>
            <button className="btn-secondary" onClick={recalcular}><RefreshCw size={16} /> Recalcular</button>
            <button className="btn-primary" onClick={cerrar}><Lock size={16} /> Cerrar nómina</button>
            <button className="btn-ghost text-rose-600" title="Eliminar" onClick={() => { if (confirmar('¿Eliminar esta nómina?')) { eliminarItem('nominas', n.id); nav('/nomina') } }}><Trash2 size={16} /></button>
          </>}
        </>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Wallet size={20} />} value={fmtMoney(tot('totalPercepciones'))} label="Total percepciones" />
        <StatCard icon={<Calculator size={20} />} value={fmtMoney(tot('totalDeducciones'))} label="Total deducciones" tono="red" />
        <StatCard icon={<Wallet size={20} />} value={fmtMoney(tot('neto'))} label="Neto a pagar" tono="green" />
      </div>
      <div className="card overflow-hidden">
        <Table head={<><th className="th">Colaborador</th><th className="th">Días</th><th className="th">Sueldo</th><th className="th">Extras / bonos</th><th className="th">ISR</th><th className="th">IMSS</th><th className="th">Otras ded.</th><th className="th">Neto</th><th className="th" /></>}>
          {n.recibos.map((r) => { const c = colMap.get(r.colaboradorId); return (
            <tr key={r.colaboradorId} className="hover:bg-slate-50">
              <td className="td">{c && <div className="flex items-center gap-3"><Avatar c={c} size={30} /><div><div className="font-medium">{nombreCompleto(c)}</div><div className="text-xs text-slate-500">{fmtMoney(r.salarioDiario)}/día</div></div></div>}</td>
              <td className="td">{r.diasPeriodo - r.diasFalta}{r.diasFalta > 0 && <span className="text-xs text-rose-600"> (−{r.diasFalta})</span>}</td>
              <td className="td">{fmtMoney(r.sueldo)}</td>
              <td className="td">{fmtMoney(r.importeHorasExtra + r.bonos)}</td>
              <td className="td">{fmtMoney(r.isr)}</td><td className="td">{fmtMoney(r.imss)}</td>
              <td className="td">{fmtMoney(r.descuentos + r.descuentoFaltas)}</td>
              <td className="td font-semibold text-slate-900">{fmtMoney(r.neto)}</td>
              <td className="td text-right"><button className="btn-ghost" title="Imprimir recibo" onClick={() => imprimirRecibos(n, [r], db)}><Printer size={16} /></button></td>
            </tr>) })}
          <tr className="bg-slate-50 font-semibold">
            <td className="td">Totales</td><td className="td" /><td className="td">{fmtMoney(tot('sueldo'))}</td><td className="td">{fmtMoney(tot('importeHorasExtra') + tot('bonos'))}</td>
            <td className="td">{fmtMoney(tot('isr'))}</td><td className="td">{fmtMoney(tot('imss'))}</td><td className="td">{fmtMoney(tot('descuentos') + tot('descuentoFaltas'))}</td><td className="td">{fmtMoney(tot('neto'))}</td><td className="td" />
          </tr>
        </Table>
      </div>
    </>
  )
}

function imprimirRecibos(n: PeriodoNomina, recibos: Recibo[], db: DB) {
  const e = db.empresas.find((x) => x.id === n.empresaId)!
  const fila = (l: string, v: number) => (v ? `<tr><td>${l}</td><td class="r">${fmtMoney(v)}</td></tr>` : '')
  const paginas = recibos.map((r) => {
    const c = db.colaboradores.find((x) => x.id === r.colaboradorId)
    if (!c) return ''
    return `<section><header><div><b>${e.razonSocial || e.nombre}</b><br>RFC ${e.rfc} · Reg. Pat. ${e.registroPatronal}</div><div class="r"><b>RECIBO DE NÓMINA</b><br>${fmtFecha(n.fechaInicio)} al ${fmtFecha(n.fechaFin)}</div></header>
<div class="emp"><div><b>${nombreCompleto(c)}</b><br>${c.numero} · ${c.puesto}</div><div>RFC ${c.rfc}<br>NSS ${c.nss} · CURP ${c.curp}</div><div>Salario diario ${fmtMoney(r.salarioDiario)}<br>Días pagados ${r.diasPeriodo - r.diasFalta}</div></div>
<div class="cols"><table><tr><th colspan="2">Percepciones</th></tr>${fila('Sueldo', r.sueldo)}${fila(`Horas extra (${r.horasExtra} h)`, r.importeHorasExtra)}${fila('Bonos', r.bonos)}<tr class="t"><td>Total</td><td class="r">${fmtMoney(r.totalPercepciones)}</td></tr></table>
<table><tr><th colspan="2">Deducciones</th></tr>${fila('ISR', r.isr)}${fila('IMSS', r.imss)}${fila(`Faltas (${r.diasFalta} días)`, r.descuentoFaltas)}${fila('Otros descuentos', r.descuentos)}<tr class="t"><td>Total</td><td class="r">${fmtMoney(r.totalDeducciones)}</td></tr></table></div>
<div class="neto">NETO A PAGAR: ${fmtMoney(r.neto)}</div>
<p class="firma">Recibí de conformidad la cantidad indicada, sin que se me adeude cantidad alguna por concepto de salarios y prestaciones a la fecha.<br><br><br>_______________________________<br>${nombreCompleto(c)}</p></section>`
  }).join('')
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para imprimir.')
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${n.nombre}</title><style>
body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:20px}section{border:1px solid #ccc;border-radius:8px;padding:16px;margin-bottom:20px;page-break-inside:avoid}
header,.emp{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.emp{background:#f5f5f7;padding:8px;border-radius:6px}.cols{display:flex;gap:16px}table{flex:1;border-collapse:collapse}
th{text-align:left;border-bottom:2px solid #7CC142;padding:4px}td{padding:3px 4px;border-bottom:1px solid #eee}.r{text-align:right}.t td{font-weight:bold}.neto{text-align:right;font-size:15px;font-weight:bold;margin-top:12px}
.firma{text-align:center;margin-top:16px;font-size:11px}@media print{button{display:none}section{page-break-after:always}}</style></head><body>
<button onclick="print()" style="padding:8px 14px;margin-bottom:12px">Imprimir / Guardar PDF</button>${paginas}<p style="font-size:10px;color:#666">Generado el ${fmtFechaLarga(hoy())}. Documento informativo, no sustituye al CFDI de nómina.</p></body></html>`)
  w.document.close()
}
