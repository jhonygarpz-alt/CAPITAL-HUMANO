import { Fragment, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Calculator, ChevronDown, ChevronRight, Download, HandCoins, Layers, Lock, Pencil, Plus, Printer, RefreshCw, Trash2, UserMinus, UserPlus, Users, Wallet, X } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Field, Input, Modal, PageHeader, Seccion, Select, StatCard, Table, Tabs, confirmar, cx } from '../components/ui'
import { CATALOGO, CLAVES_MANUALES, calcularRecibo, conceptoManual, conceptosDe, prestamosAplicables, saldoPrestamo } from '../lib/nomina'
import { configDe } from '../lib/aguinaldo'
import { addDays, descargarCSV, fmtFecha, fmtFechaLarga, fmtMoney, hoy, nombreCompleto, round2, uid } from '../lib/utils'
import type { ClaveConcepto, Colaborador, ConceptoNomina, DB, PeriodoNomina, Recibo } from '../types'
import PrestamosPanel from './Prestamos'

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

const sumar = (rs: Recibo[], k: keyof Recibo) => round2(rs.reduce((s, r) => s + ((r[k] as number) || 0), 0))
const sumaClave = (r: Recibo, claves: ClaveConcepto[]) => round2(conceptosDe(r).filter((x) => claves.includes(x.clave)).reduce((s, x) => s + x.importe, 0))
const OTRAS_DED: ClaveConcepto[] = ['infonavit', 'fonacot', 'pension_alimenticia', 'caja_ahorro', 'anticipo', 'descuento', 'otra_deduccion']

/** Calcula recibos usando los datos actuales de la empresa. */
function useCalculadora() {
  const { db, empresa } = useStore()
  const incidencias = db.incidencias.filter((i) => i.empresaId === empresa.id)
  const prestamos = db.prestamos.filter((p) => p.empresaId === empresa.id)
  const uma = configDe(empresa.configAguinaldo).valorUMA
  return (c: Colaborador, n: Pick<PeriodoNomina, 'fechaInicio' | 'fechaFin' | 'id'>, previo?: Recibo) =>
    calcularRecibo(c, incidencias, n.fechaInicio, n.fechaFin, { prestamos, manuales: previo?.manuales, prestamosOmitidos: previo?.prestamosOmitidos, uma, nominaId: n.id })
}

export default function Nomina() {
  const { deEmpresa, empresa } = useStore()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') === 'prestamos' ? 'prestamos' : 'periodos'
  const [nueva, setNueva] = useState(false)
  const nominas = deEmpresa('nominas').sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))
  const prestamosActivos = deEmpresa('prestamos').filter((p) => p.estatus === 'Activo')
  const ultima = nominas[0]
  return (
    <>
      <PageHeader title="Nómina" subtitle={`Periodicidad ${empresa.periodicidadNomina.toLowerCase()} · percepciones, deducciones, horas extra, bonos y préstamos`}
        actions={tab === 'periodos' ? <button className="btn-accent" onClick={() => setNueva(true)}><Calculator size={16} /> Calcular nómina</button> : undefined} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Wallet size={22} />} value={ultima ? fmtMoney(sumar(ultima.recibos, 'totalPercepciones')) : '—'} label={ultima ? `Percepciones · ${ultima.nombre.replace('Nómina ', '')}` : 'Percepciones'} tono="green" />
        <StatCard icon={<Calculator size={22} />} value={ultima ? fmtMoney(sumar(ultima.recibos, 'totalDeducciones')) : '—'} label="Deducciones" tono="red" />
        <StatCard icon={<Wallet size={22} />} value={ultima ? fmtMoney(sumar(ultima.recibos, 'neto')) : '—'} label="Neto a pagar" />
        <StatCard icon={<HandCoins size={22} />} value={prestamosActivos.length} label={`Préstamos activos · saldo ${fmtMoney(prestamosActivos.reduce((s, p) => s + saldoPrestamo(p), 0))}`} tono="amber" onClick={() => setSp({ tab: 'prestamos' })} />
      </div>
      <Tabs value={tab} onChange={(t) => setSp(t === 'periodos' ? {} : { tab: t }, { replace: true })} tabs={[
        { id: 'periodos', label: 'Periodos de nómina', icon: Calculator, count: nominas.length },
        { id: 'prestamos', label: 'Préstamos', icon: HandCoins, count: prestamosActivos.length },
      ]} />
      <div className="mt-6">
        {tab === 'prestamos' ? <PrestamosPanel /> : (
          <Seccion titulo="Periodos de nómina" icon={Calculator}>
            {nominas.length === 0 ? (
              <Empty title="Aún no hay nóminas" text="Calcula la nómina de todos tus colaboradores o solo de algunos. Después podrás agregar horas extra, bonos y deducciones a cada recibo." action={<button className="btn-accent" onClick={() => setNueva(true)}><Calculator size={16} /> Calcular nómina</button>} />
            ) : (
              <Table head={<><th className="th">Periodo</th><th className="th">Tipo</th><th className="th">Recibos</th><th className="th">Percepciones</th><th className="th">Deducciones</th><th className="th">Neto</th><th className="th">Estatus</th><th className="th" /></>}>
                {nominas.map((n) => (
                  <tr key={n.id} className="hover:bg-accent-50">
                    <td className="td"><Link to={`/nomina/${n.id}`} className="font-semibold text-primary-700 hover:underline">{n.nombre}</Link><div className="text-xs text-slate-500">{fmtFecha(n.fechaInicio)} – {fmtFecha(n.fechaFin)}</div></td>
                    <td className="td">{n.tipo}</td><td className="td">{n.recibos.length}</td>
                    <td className="td text-accent-700">{fmtMoney(sumar(n.recibos, 'totalPercepciones'))}</td>
                    <td className="td text-rose-600">{fmtMoney(sumar(n.recibos, 'totalDeducciones'))}</td>
                    <td className="td font-bold text-primary-900">{fmtMoney(sumar(n.recibos, 'neto'))}</td>
                    <td className="td"><Badge>{n.estatus}</Badge></td>
                    <td className="td text-right"><Link to={`/nomina/${n.id}`} className="btn-secondary py-1.5">Abrir</Link></td>
                  </tr>
                ))}
              </Table>
            )}
          </Seccion>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-500">ℹ ISR con la tarifa del art. 96 LISR prorrateada (sin subsidio al empleo), IMSS obrero estimado y exención de horas extra dobles (50% hasta 5 UMA semanales). Valida los importes con tu contador antes de timbrar.</p>
      {nueva && <NuevaNomina onClose={() => setNueva(false)} />}
    </>
  )
}

function SelectorColaboradores({ lista, sel, setSel }: { lista: Colaborador[]; sel: Set<string>; setSel: (s: Set<string>) => void }) {
  const [q, setQ] = useState('')
  const vis = lista.filter((c) => !q || nombreCompleto(c).toLowerCase().includes(q.toLowerCase()))
  const todos = vis.length > 0 && vis.every((c) => sel.has(c.id))
  return (
    <div className="rounded-lg border border-slate-300">
      <div className="flex items-center gap-2 border-b border-slate-200 p-2">
        <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={todos} onChange={() => { const s = new Set(sel); vis.forEach((c) => { if (todos) s.delete(c.id); else s.add(c.id) }); setSel(s) }} aria-label="Seleccionar todos" />
        <Input className="py-1.5" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="whitespace-nowrap text-xs text-slate-500">{sel.size} sel.</span>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {vis.length === 0 && <p className="p-3 text-sm text-slate-500">Sin colaboradores.</p>}
        {vis.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent-50">
            <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={sel.has(c.id)} onChange={() => { const s = new Set(sel); if (s.has(c.id)) s.delete(c.id); else s.add(c.id); setSel(s) }} />
            <Avatar c={c} size={26} /><span className="flex-1 text-sm font-medium">{nombreCompleto(c)}</span><span className="text-xs text-slate-500">{c.departamento} · {fmtMoney(c.salarioDiario)}/día</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function NuevaNomina({ onClose }: { onClose: () => void }) {
  const { empresa, deEmpresa, guardarItem } = useStore()
  const calcular = useCalculadora()
  const nav = useNavigate()
  const [tipo, setTipo] = useState(empresa.periodicidadNomina)
  const sug = periodoSugerido(tipo)
  const [ini, setIni] = useState(sug.ini)
  const [fin, setFin] = useState(sug.fin)
  const [alcance, setAlcance] = useState<'todos' | 'departamento' | 'seleccion'>('todos')
  const [depto, setDepto] = useState(empresa.departamentos[0] ?? '')
  const activos = deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja' && c.fechaIngreso <= fin).sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
  const [sel, setSel] = useState<Set<string>>(new Set())
  const cambiarTipo = (t: PeriodoNomina['tipo']) => { setTipo(t); const s = periodoSugerido(t); setIni(s.ini); setFin(s.fin) }
  const incluidos = alcance === 'todos' ? activos : alcance === 'departamento' ? activos.filter((c) => c.departamento === depto) : activos.filter((c) => sel.has(c.id))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!incluidos.length) return
    const base = { id: uid(), fechaInicio: ini, fechaFin: fin }
    const n: PeriodoNomina = {
      ...base, empresaId: empresa.id, tipo, estatus: 'Borrador', fechaCreacion: hoy(),
      nombre: `Nómina ${tipo.toLowerCase()} ${fmtFecha(ini)} al ${fmtFecha(fin)}${alcance === 'departamento' ? ` · ${depto}` : alcance === 'seleccion' ? ' · individual' : ''}`,
      recibos: incluidos.map((c) => calcular(c, base)),
    }
    guardarItem('nominas', n, { accion: `Nómina calculada: ${n.nombre} (${n.recibos.length} recibos)` })
    nav(`/nomina/${n.id}`)
  }
  return (
    <Modal open onClose={onClose} title="Calcular nómina" wide footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-nom" className="btn-accent" disabled={!incluidos.length}><Calculator size={16} /> Calcular {incluidos.length} recibo{incluidos.length === 1 ? '' : 's'}</button></>}>
      <form id="form-nom" onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Periodicidad"><Select value={tipo} onChange={(e) => cambiarTipo(e.target.value as PeriodoNomina['tipo'])}><option>Semanal</option><option>Quincenal</option><option>Mensual</option></Select></Field>
          <Field label="Del"><Input type="date" required value={ini} onChange={(e) => setIni(e.target.value)} /></Field>
          <Field label="Al"><Input type="date" required min={ini} value={fin} onChange={(e) => setFin(e.target.value)} /></Field>
        </div>
        <div>
          <span className="label">¿A quién se le calcula?</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {([['todos', 'Cálculo masivo', `Todos los activos (${activos.length})`, Users], ['departamento', 'Por departamento', 'Un área de la empresa', Layers], ['seleccion', 'Por colaborador', 'Elegir uno o varios', UserPlus]] as const).map(([id, t, d, Icon]) => (
              <button type="button" key={id} onClick={() => setAlcance(id)} className={cx('flex items-start gap-3 rounded-lg border-2 p-3 text-left transition', alcance === id ? 'border-accent-500 bg-accent-50' : 'border-slate-200 hover:border-primary-300')}>
                <Icon size={20} className={alcance === id ? 'text-accent-700' : 'text-primary-500'} /><span><b className="block text-sm text-primary-800">{t}</b><span className="text-xs text-slate-500">{d}</span></span>
              </button>
            ))}
          </div>
        </div>
        {alcance === 'departamento' && <Field label="Departamento"><Select value={depto} onChange={(e) => setDepto(e.target.value)}>{empresa.departamentos.map((d) => <option key={d}>{d} ({activos.filter((c) => c.departamento === d).length})</option>)}</Select></Field>}
        {alcance === 'seleccion' && <SelectorColaboradores lista={activos} sel={sel} setSel={setSel} />}
        <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800">Se toman el salario diario, las incidencias del periodo (faltas, horas extra, bonos, descuentos) y los <b>préstamos activos</b>. Después podrás editar cada recibo para agregar más percepciones o deducciones.</p>
      </form>
    </Modal>
  )
}

/** Lista de conceptos de un tipo (percepciones o deducciones). */
function ListaConceptos({ titulo, conceptos, total, tono, onQuitar }: { titulo: string; conceptos: ConceptoNomina[]; total: number; tono: 'per' | 'ded'; onQuitar?: (c: ConceptoNomina) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={cx('flex justify-between px-3 py-2 text-sm font-bold text-white', tono === 'per' ? 'bg-accent-600' : 'bg-rose-600')}><span>{titulo}</span><span>{fmtMoney(total)}</span></div>
      <ul className="divide-y divide-slate-100 text-sm">
        {conceptos.length === 0 && <li className="px-3 py-2 text-slate-400">Sin conceptos</li>}
        {conceptos.map((x) => (
          <li key={x.id} className="flex items-center gap-2 px-3 py-1.5">
            <span className="min-w-0 flex-1">
              {x.descripcion}
              {x.origen !== 'automatico' && <span className={cx('ml-1.5 rounded px-1 text-[10px] font-bold uppercase', x.origen === 'manual' ? 'bg-primary-50 text-primary-700' : x.origen === 'prestamo' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500')}>{x.origen === 'incidencia' ? 'incid.' : x.origen}</span>}
              {x.gravado !== undefined && x.gravado < x.importe && <span className="ml-1 text-[11px] text-slate-500">(exento {fmtMoney(x.importe - x.gravado)})</span>}
            </span>
            <span className="font-semibold tabular-nums">{fmtMoney(x.importe)}</span>
            {onQuitar && x.origen === 'manual' && <button type="button" className="text-rose-500 hover:text-rose-700" onClick={() => onQuitar(x)} aria-label="Quitar"><X size={14} /></button>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function NominaDetalle() {
  const { id } = useParams()
  const { db, deEmpresa, guardarItem, eliminarItem, empresa } = useStore()
  const calcular = useCalculadora()
  const nav = useNavigate()
  const [abierto, setAbierto] = useState<string | null>(null)
  const [editar, setEditar] = useState<Recibo | null>(null)
  const [modal, setModal] = useState<null | 'masivo' | 'agregar'>(null)
  const n = db.nominas.find((x) => x.id === id)
  const colMap = useMemo(() => new Map(db.colaboradores.map((c) => [c.id, c])), [db.colaboradores])
  if (!n) return <Empty title="Nómina no encontrada" action={<Link to="/nomina" className="btn-primary">Volver</Link>} />
  const borrador = n.estatus === 'Borrador'
  const t = (k: keyof Recibo) => sumar(n.recibos, k)
  const tc = (claves: ClaveConcepto[]) => round2(n.recibos.reduce((s, r) => s + sumaClave(r, claves), 0))

  const guardarRecibos = (recibos: Recibo[], accion?: string) => guardarItem('nominas', { ...n, recibos }, accion ? { accion } : undefined)
  const recalcularUno = (r: Recibo) => { const c = colMap.get(r.colaboradorId); return c ? calcular(c, n, r) : r }
  const recalcularTodo = () => guardarRecibos(n.recibos.map(recalcularUno))
  const quitar = (r: Recibo) => {
    const c = colMap.get(r.colaboradorId)
    if (confirmar(`¿Quitar a ${c ? nombreCompleto(c) : 'este colaborador'} de esta nómina?`)) guardarRecibos(n.recibos.filter((x) => x !== r))
  }
  const cerrar = () => {
    const pagos = n.recibos.flatMap((r) => conceptosDe(r).filter((x) => x.prestamoId).map((x) => ({ prestamoId: x.prestamoId!, importe: x.importe })))
    if (!confirmar(`Al cerrar la nómina ya no podrá modificarse; las incidencias del periodo se marcarán como aplicadas${pagos.length ? ` y se registrarán ${pagos.length} pago(s) de préstamos` : ''}. ¿Continuar?`)) return
    guardarItem('nominas', { ...n, estatus: 'Cerrada' }, { accion: `Nómina cerrada: ${n.nombre}` })
    deEmpresa('incidencias').filter((i) => i.estatus === 'Pendiente' && i.fecha >= n.fechaInicio && i.fecha <= n.fechaFin && n.recibos.some((r) => r.colaboradorId === i.colaboradorId)).forEach((i) => guardarItem('incidencias', { ...i, estatus: 'Aplicada' }))
    for (const p of deEmpresa('prestamos')) {
      const importe = round2(pagos.filter((x) => x.prestamoId === p.id).reduce((s, x) => s + x.importe, 0))
      if (!importe || p.pagos.some((x) => x.nominaId === n.id)) continue
      const act = { ...p, pagos: [...p.pagos, { id: uid(), fecha: n.fechaFin, importe, nominaId: n.id, nota: n.nombre }] }
      guardarItem('prestamos', saldoPrestamo(act) <= 0.009 ? { ...act, estatus: 'Liquidado' } : act, { colaboradorId: p.colaboradorId, accion: `Pago de ${fmtMoney(importe)} al préstamo ${p.folio} (${n.nombre})`, modulo: 'Nómina' })
    }
  }
  const exportar = () => descargarCSV(n.nombre, n.recibos.map((r) => {
    const c = colMap.get(r.colaboradorId)
    return {
      Número: c?.numero, Colaborador: c ? nombreCompleto(c) : '', Días: r.diasPeriodo, 'Días no pagados': r.diasFalta, 'Salario diario': r.salarioDiario,
      Sueldo: r.sueldo, 'Horas extra': r.importeHorasExtra, 'Otras percepciones': r.bonos, 'Total percepciones': r.totalPercepciones,
      Faltas: r.descuentoFaltas, ISR: r.isr, IMSS: r.imss, Préstamos: sumaClave(r, ['prestamo']), 'Otras deducciones': sumaClave(r, OTRAS_DED), 'Total deducciones': r.totalDeducciones,
      Neto: r.neto, Banco: c?.banco, Cuenta: c?.cuenta,
    }
  }))
  const thP = 'th border-l border-white/20 bg-accent-700 text-right'
  const thD = 'th border-l border-white/20 bg-rose-700 text-right'

  return (
    <>
      <PageHeader title={n.nombre} subtitle={`${empresa.nombre} · ${fmtFecha(n.fechaInicio)} al ${fmtFecha(n.fechaFin)} · ${n.recibos.length} recibos`}
        actions={<>
          <Badge>{n.estatus}</Badge>
          <button className="btn-secondary" onClick={exportar}><Download size={16} /> Exportar</button>
          <button className="btn-primary" onClick={() => imprimirRecibos(n, n.recibos, db)}><Printer size={16} /> Imprimir recibos</button>
          {borrador && <>
            <button className="btn-secondary" onClick={() => setModal('agregar')}><UserPlus size={16} /> Agregar colaborador</button>
            <button className="btn-secondary" onClick={() => setModal('masivo')}><Layers size={16} /> Movimiento masivo</button>
            <button className="btn-secondary" onClick={recalcularTodo} title="Vuelve a calcular con los datos actuales; conserva los conceptos capturados"><RefreshCw size={16} /> Recalcular</button>
            <button className="btn-accent" onClick={cerrar}><Lock size={16} /> Cerrar nómina</button>
            <button className="btn-ghost text-rose-600" title="Eliminar" onClick={() => { if (confirmar('¿Eliminar esta nómina?')) { eliminarItem('nominas', n.id); nav('/nomina') } }}><Trash2 size={16} /></button>
          </>}
        </>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Wallet size={22} />} value={fmtMoney(t('totalPercepciones'))} label="Total percepciones" tono="green" />
        <StatCard icon={<Calculator size={22} />} value={fmtMoney(t('totalDeducciones'))} label="Total deducciones" tono="red" />
        <StatCard icon={<Wallet size={22} />} value={fmtMoney(t('neto'))} label="Neto a pagar" />
        <StatCard icon={<HandCoins size={22} />} value={fmtMoney(tc(['prestamo']))} label="Descuento de préstamos" tono="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px] [&_td]:px-2.5 [&_th]:px-2.5">
            <thead>
              <tr>
                <th className="th sticky left-0 z-10" colSpan={2} />
                <th className="th border-l border-white/20 bg-accent-700 text-center" colSpan={4}>PERCEPCIONES</th>
                <th className="th border-l border-white/20 bg-rose-700 text-center" colSpan={6}>DEDUCCIONES</th>
                <th className="th border-l border-white/20" colSpan={2} />
              </tr>
              <tr>
                <th className="th sticky left-0 z-10 min-w-[200px]">Colaborador</th><th className="th text-center">Días</th>
                <th className={thP}>Sueldo</th><th className={thP}>H. extra</th><th className={thP}>Bonos y otras</th><th className={thP}>Total</th>
                <th className={thD}>Faltas</th><th className={thD}>ISR</th><th className={thD}>IMSS</th><th className={thD}>Préstamos</th><th className={thD}>Otras</th><th className={thD}>Total</th>
                <th className="th border-l border-white/20 text-right">Neto</th><th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {n.recibos.map((r) => {
                const c = colMap.get(r.colaboradorId)
                const ab = abierto === r.colaboradorId
                const cs = conceptosDe(r)
                return (
                  <Fragment key={r.colaboradorId}>
                    <tr className={cx('cursor-pointer hover:bg-accent-50', ab && 'bg-accent-50')} onClick={() => setAbierto(ab ? null : r.colaboradorId)}>
                      <td className={cx('td sticky left-0 z-[1]', ab ? 'bg-accent-50' : 'bg-white')}>
                        <div className="flex items-center gap-2">
                          {ab ? <ChevronDown size={16} className="text-primary-500" /> : <ChevronRight size={16} className="text-slate-400" />}
                          {c && <Avatar c={c} size={30} />}
                          <div><div className="font-semibold text-primary-900">{c ? nombreCompleto(c) : 'Colaborador eliminado'}</div><div className="text-xs text-slate-500">{fmtMoney(r.salarioDiario)}/día</div></div>
                        </div>
                      </td>
                      <td className="td text-center">{r.diasPeriodo - r.diasFalta}{r.diasFalta > 0 && <span className="text-xs text-rose-600"> (−{r.diasFalta})</span>}</td>
                      <td className="td text-right tabular-nums">{fmtMoney(r.sueldo)}</td>
                      <td className="td text-right tabular-nums">{r.importeHorasExtra ? <>{fmtMoney(r.importeHorasExtra)}<div className="text-[11px] text-slate-500">{r.horasExtra} h</div></> : '—'}</td>
                      <td className="td text-right tabular-nums">{r.bonos ? fmtMoney(r.bonos) : '—'}</td>
                      <td className="td bg-accent-50/60 text-right font-semibold tabular-nums text-accent-800">{fmtMoney(r.totalPercepciones)}</td>
                      <td className="td text-right tabular-nums">{r.descuentoFaltas ? fmtMoney(r.descuentoFaltas) : '—'}</td>
                      <td className="td text-right tabular-nums">{fmtMoney(r.isr)}</td>
                      <td className="td text-right tabular-nums">{fmtMoney(r.imss)}</td>
                      <td className="td text-right tabular-nums">{sumaClave(r, ['prestamo']) ? fmtMoney(sumaClave(r, ['prestamo'])) : '—'}</td>
                      <td className="td text-right tabular-nums">{sumaClave(r, OTRAS_DED) ? fmtMoney(sumaClave(r, OTRAS_DED)) : '—'}</td>
                      <td className="td bg-rose-50/60 text-right font-semibold tabular-nums text-rose-700">{fmtMoney(r.totalDeducciones)}</td>
                      <td className={cx('td text-right font-bold tabular-nums', r.neto < 0 ? 'text-rose-600' : 'text-primary-900')}>{fmtMoney(r.neto)}</td>
                      <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          {borrador && <button className="btn-ghost px-1.5" title="Editar percepciones y deducciones" onClick={() => setEditar(r)}><Pencil size={16} /></button>}
                          <button className="btn-ghost px-1.5" title="Imprimir recibo" onClick={() => imprimirRecibos(n, [r], db)}><Printer size={16} /></button>
                          {borrador && <button className="btn-ghost px-1.5 text-rose-600" title="Quitar de la nómina" onClick={() => quitar(r)}><UserMinus size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                    {ab && (
                      <tr className="bg-slate-50">
                        <td colSpan={14} className="py-4">
                          <div className="sticky left-2.5 w-[calc(100vw-4.5rem)] max-w-[1320px] lg:w-[calc(100vw-10rem)]">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <ListaConceptos titulo="Percepciones" tono="per" conceptos={cs.filter((x) => x.tipo === 'percepcion')} total={r.totalPercepciones} />
                            <ListaConceptos titulo="Deducciones" tono="ded" conceptos={cs.filter((x) => x.tipo === 'deduccion')} total={r.totalDeducciones} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-slate-600">Base gravable ISR: <b>{fmtMoney(r.baseGravable ?? r.totalPercepciones - r.descuentoFaltas)}</b></span>
                            <span className="ml-auto text-lg font-extrabold text-primary-800">Neto: {fmtMoney(r.neto)}</span>
                            {borrador && <button className="btn-secondary py-1.5" title="Vuelve a calcular este recibo con los datos actuales" onClick={() => guardarRecibos(n.recibos.map((x) => (x === r ? recalcularUno(r) : x)))}><RefreshCw size={15} /> Recalcular</button>}
                            {borrador && <button className="btn-accent py-1.5" onClick={() => setEditar(r)}><Pencil size={15} /> Editar conceptos</button>}
                          </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              <tr className="bg-primary-50 font-bold text-primary-900">
                <td className="td sticky left-0 z-[1] bg-primary-50">Totales ({n.recibos.length})</td><td className="td" />
                <td className="td text-right">{fmtMoney(t('sueldo'))}</td><td className="td text-right">{fmtMoney(t('importeHorasExtra'))}</td><td className="td text-right">{fmtMoney(t('bonos'))}</td><td className="td text-right text-accent-800">{fmtMoney(t('totalPercepciones'))}</td>
                <td className="td text-right">{fmtMoney(t('descuentoFaltas'))}</td><td className="td text-right">{fmtMoney(t('isr'))}</td><td className="td text-right">{fmtMoney(t('imss'))}</td><td className="td text-right">{fmtMoney(tc(['prestamo']))}</td><td className="td text-right">{fmtMoney(tc(OTRAS_DED))}</td><td className="td text-right text-rose-700">{fmtMoney(t('totalDeducciones'))}</td>
                <td className="td text-right">{fmtMoney(t('neto'))}</td><td className="td" />
              </tr>
            </tbody>
          </table>
        </div>
        {n.recibos.length === 0 && <Empty title="Esta nómina no tiene recibos" action={borrador ? <button className="btn-accent" onClick={() => setModal('agregar')}><UserPlus size={16} /> Agregar colaboradores</button> : undefined} />}
        <p className="border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">Haz clic en un renglón para ver el desglose completo de percepciones y deducciones.{borrador && ' Usa el lápiz para agregar horas extra, bonos, comisiones o deducciones a un colaborador.'}</p>
      </div>

      {editar && <EditorRecibo n={n} r={editar} onClose={() => setEditar(null)} onGuardar={(nuevo) => { guardarRecibos(n.recibos.map((x) => (x.colaboradorId === nuevo.colaboradorId ? nuevo : x))); setEditar(null) }} />}
      {modal === 'agregar' && <AgregarColaboradores n={n} onClose={() => setModal(null)} onAgregar={(rs) => { guardarRecibos([...n.recibos, ...rs], `${rs.length} colaborador(es) agregado(s) a ${n.nombre}`); setModal(null) }} />}
      {modal === 'masivo' && <MovimientoMasivo n={n} onClose={() => setModal(null)} onAplicar={(rs, texto) => { guardarRecibos(rs, texto); setModal(null) }} />}
    </>
  )
}

function CapturaConcepto({ salarioDiario, onAgregar }: { salarioDiario: number; onAgregar: (c: ConceptoNomina) => void }) {
  const [clave, setClave] = useState<ClaveConcepto>('horas_dobles')
  const [valor, setValor] = useState('')
  const [desc, setDesc] = useState('')
  const info = CATALOGO[clave]
  const v = Number(valor) || 0
  const vista = info.horas ? (salarioDiario / 8) * info.horas * v : v
  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-primary-300 bg-primary-50/40 p-3 sm:grid-cols-[1.3fr_0.7fr_1.2fr_auto]">
      <Field label="Concepto">
        <Select value={clave} onChange={(e) => setClave(e.target.value as ClaveConcepto)}>
          <optgroup label="Percepciones">{CLAVES_MANUALES.filter((k) => CATALOGO[k].tipo === 'percepcion').map((k) => <option key={k} value={k}>{CATALOGO[k].nombre}</option>)}</optgroup>
          <optgroup label="Deducciones">{CLAVES_MANUALES.filter((k) => CATALOGO[k].tipo === 'deduccion').map((k) => <option key={k} value={k}>{CATALOGO[k].nombre}</option>)}</optgroup>
        </Select>
      </Field>
      <Field label={info.horas ? 'Horas' : 'Importe $'} hint={info.horas && v && salarioDiario ? `= ${fmtMoney(vista)}` : info.horas && !salarioDiario ? "Según el salario de cada uno" : undefined}><Input type="number" min={0} step={info.horas ? '0.5' : '0.01'} value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
      <Field label="Descripción (opcional)"><Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={info.nombre} /></Field>
      <div className="flex items-end"><button type="button" className="btn-accent w-full" disabled={!v} onClick={() => { onAgregar(conceptoManual(clave, v, salarioDiario, desc)); setValor(''); setDesc('') }}><Plus size={16} /> Agregar</button></div>
    </div>
  )
}

function EditorRecibo({ n, r, onClose, onGuardar }: { n: PeriodoNomina; r: Recibo; onClose: () => void; onGuardar: (r: Recibo) => void }) {
  const { db } = useStore()
  const calcular = useCalculadora()
  const c = db.colaboradores.find((x) => x.id === r.colaboradorId)
  const [manuales, setManuales] = useState<ConceptoNomina[]>(r.manuales ?? [])
  const [omitidos, setOmitidos] = useState<string[]>(r.prestamosOmitidos ?? [])
  if (!c) return null
  const vista = calcular(c, n, { ...r, manuales, prestamosOmitidos: omitidos })
  const cs = vista.conceptos ?? []
  const prestamos = prestamosAplicables(db.prestamos, c.id, n.fechaFin)
  return (
    <Modal open onClose={onClose} title={`Recibo de ${nombreCompleto(c)}`} wide
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-accent" onClick={() => onGuardar(vista)}>Guardar recibo</button></>}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{fmtFecha(n.fechaInicio)} al {fmtFecha(n.fechaFin)} · salario diario {fmtMoney(c.salarioDiario)} · {vista.diasPeriodo} días{vista.diasFalta ? ` (${vista.diasFalta} no pagados)` : ''}</p>
        <CapturaConcepto salarioDiario={c.salarioDiario} onAgregar={(x) => setManuales([...manuales, x])} />
        {prestamos.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <b className="text-amber-800">Préstamos activos</b>
            {prestamos.map((p) => (
              <label key={p.id} className="mt-1 flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={!omitidos.includes(p.id)} onChange={(e) => setOmitidos(e.target.checked ? omitidos.filter((x) => x !== p.id) : [...omitidos, p.id])} />
                Descontar {p.folio}: {fmtMoney(Math.min(p.descuento, saldoPrestamo(p)))} (saldo {fmtMoney(saldoPrestamo(p))})
              </label>
            ))}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <ListaConceptos titulo="Percepciones" tono="per" conceptos={cs.filter((x) => x.tipo === 'percepcion')} total={vista.totalPercepciones} onQuitar={(x) => setManuales(manuales.filter((m) => m.id !== x.id))} />
          <ListaConceptos titulo="Deducciones" tono="ded" conceptos={cs.filter((x) => x.tipo === 'deduccion')} total={vista.totalDeducciones} onQuitar={(x) => setManuales(manuales.filter((m) => m.id !== x.id))} />
        </div>
        <div className={cx('flex items-center justify-between rounded-lg px-4 py-3 text-lg font-extrabold', vista.neto < 0 ? 'bg-rose-50 text-rose-700' : 'bg-primary-600 text-white')}>
          <span>Neto a pagar</span><span>{fmtMoney(vista.neto)}</span>
        </div>
        {vista.neto < 0 && <p className="text-sm text-rose-600">Las deducciones superan a las percepciones. Revisa los descuentos o pausa el préstamo en este periodo.</p>}
      </div>
    </Modal>
  )
}

function AgregarColaboradores({ n, onClose, onAgregar }: { n: PeriodoNomina; onClose: () => void; onAgregar: (rs: Recibo[]) => void }) {
  const { deEmpresa } = useStore()
  const calcular = useCalculadora()
  const ya = new Set(n.recibos.map((r) => r.colaboradorId))
  const disponibles = deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja' && !ya.has(c.id) && c.fechaIngreso <= n.fechaFin).sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
  const [sel, setSel] = useState<Set<string>>(new Set())
  return (
    <Modal open onClose={onClose} title="Agregar colaboradores a la nómina" footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-accent" disabled={!sel.size} onClick={() => onAgregar(disponibles.filter((c) => sel.has(c.id)).map((c) => calcular(c, n)))}><UserPlus size={16} /> Agregar {sel.size || ''}</button></>}>
      {disponibles.length === 0 ? <p className="text-sm text-slate-500">Todos los colaboradores activos ya están en esta nómina.</p> : <SelectorColaboradores lista={disponibles} sel={sel} setSel={setSel} />}
    </Modal>
  )
}

function MovimientoMasivo({ n, onClose, onAplicar }: { n: PeriodoNomina; onClose: () => void; onAplicar: (rs: Recibo[], texto: string) => void }) {
  const { db } = useStore()
  const calcular = useCalculadora()
  const cols = n.recibos.map((r) => db.colaboradores.find((c) => c.id === r.colaboradorId)).filter(Boolean) as Colaborador[]
  const [sel, setSel] = useState<Set<string>>(new Set(cols.map((c) => c.id)))
  const [conceptos, setConceptos] = useState<{ clave: ClaveConcepto; valor: number; desc: string }[]>([])
  const aplicar = () => {
    const rs = n.recibos.map((r) => {
      const c = db.colaboradores.find((x) => x.id === r.colaboradorId)
      if (!c || !sel.has(c.id)) return r
      const extra = conceptos.map((x) => conceptoManual(x.clave, x.valor, c.salarioDiario, x.desc))
      return calcular(c, n, { ...r, manuales: [...(r.manuales ?? []), ...extra] })
    })
    onAplicar(rs, `Movimiento masivo en ${n.nombre}: ${conceptos.map((x) => CATALOGO[x.clave].nombre).join(', ')} a ${sel.size} colaborador(es)`)
  }
  return (
    <Modal open onClose={onClose} title="Movimiento masivo" wide footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-accent" disabled={!conceptos.length || !sel.size} onClick={aplicar}><Layers size={16} /> Aplicar a {sel.size}</button></>}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Agrega el mismo concepto (bono, horas extra, descuento, etc.) a varios colaboradores a la vez. Las horas extra se calculan con el salario de cada persona.</p>
        <CapturaConcepto salarioDiario={0} onAgregar={(x) => setConceptos([...conceptos, { clave: x.clave, valor: x.cantidad ?? x.importe, desc: x.descripcion === CATALOGO[x.clave].nombre ? '' : x.descripcion }])} />
        {conceptos.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {conceptos.map((x, i) => (
              <li key={i} className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold', CATALOGO[x.clave].tipo === 'percepcion' ? 'bg-accent-100 text-accent-800' : 'bg-rose-50 text-rose-700')}>
                {x.desc || CATALOGO[x.clave].nombre}: {CATALOGO[x.clave].horas ? `${x.valor} h` : fmtMoney(x.valor)}
                <button onClick={() => setConceptos(conceptos.filter((_, j) => j !== i))} aria-label="Quitar"><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        <SelectorColaboradores lista={cols} sel={sel} setSel={setSel} />
      </div>
    </Modal>
  )
}

export function imprimirRecibos(n: PeriodoNomina, recibos: Recibo[], db: DB) {
  const e = db.empresas.find((x) => x.id === n.empresaId)!
  const filas = (cs: ConceptoNomina[]) => cs.map((x) => `<tr><td>${x.descripcion}${x.gravado !== undefined && x.gravado < x.importe ? ` <span class="s">(exento ${fmtMoney(x.importe - x.gravado)})</span>` : ''}</td><td class="r">${fmtMoney(x.importe)}</td></tr>`).join('') || '<tr><td class="s">Sin conceptos</td><td></td></tr>'
  const paginas = recibos.map((r) => {
    const c = db.colaboradores.find((x) => x.id === r.colaboradorId)
    if (!c) return ''
    const cs = conceptosDe(r)
    return `<section><header><div><b class="rs">${e.razonSocial || e.nombre}</b><br>RFC ${e.rfc || '—'} · Reg. Pat. ${e.registroPatronal || '—'}<br>${e.direccion || ''}</div><div class="r"><b class="tit">RECIBO DE NÓMINA</b><br>${n.tipo} · ${fmtFecha(n.fechaInicio)} al ${fmtFecha(n.fechaFin)}<br>Fecha de pago: ${fmtFecha(n.fechaFin)}</div></header>
<div class="emp"><div><b>${nombreCompleto(c)}</b><br>No. ${c.numero} · ${c.puesto}<br>${c.departamento}</div><div>RFC: ${c.rfc || '—'}<br>CURP: ${c.curp || '—'}<br>NSS: ${c.nss || '—'}</div><div>Salario diario: ${fmtMoney(r.salarioDiario)}<br>Días pagados: ${r.diasPeriodo - r.diasFalta} de ${r.diasPeriodo}<br>${c.banco ? `${c.banco} · ${c.cuenta}` : ''}</div></div>
<div class="cols"><table><tr><th>Percepciones</th><th class="r">Importe</th></tr>${filas(cs.filter((x) => x.tipo === 'percepcion'))}<tr class="t"><td>Total percepciones</td><td class="r">${fmtMoney(r.totalPercepciones)}</td></tr></table>
<table class="d"><tr><th>Deducciones</th><th class="r">Importe</th></tr>${filas(cs.filter((x) => x.tipo === 'deduccion'))}<tr class="t"><td>Total deducciones</td><td class="r">${fmtMoney(r.totalDeducciones)}</td></tr></table></div>
<div class="neto"><span>NETO A PAGAR</span><b>${fmtMoney(r.neto)}</b></div>
<p class="firma">Recibí de ${e.razonSocial || e.nombre} la cantidad neta indicada por concepto de mis salarios y prestaciones del periodo señalado, sin que se me adeude cantidad alguna a la fecha.<br><br><br>_______________________________<br>${nombreCompleto(c)}</p></section>`
  }).join('')
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para imprimir.')
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${n.nombre}</title><style>
@page{size:letter;margin:12mm}body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:20px;background:#eef3f7}
section{background:#fff;border:1px solid #cbd5e1;border-top:6px solid #064467;border-radius:6px;padding:18px;margin:0 auto 20px;max-width:800px;page-break-inside:avoid}
header,.emp{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.rs{font-size:14px;color:#064467}.tit{font-size:15px;color:#064467}
.emp{background:#eef5fa;padding:10px;border-radius:6px;line-height:1.5}.cols{display:flex;gap:14px;align-items:flex-start}table{flex:1;border-collapse:collapse}
th{text-align:left;background:#4d8024;color:#fff;padding:6px}.d th{background:#be123c}td{padding:5px 6px;border-bottom:1px solid #e5e7eb}.r{text-align:right}.s{color:#64748b;font-size:10.5px}
.t td{font-weight:bold;background:#f8fafc}.neto{display:flex;justify-content:space-between;align-items:center;margin-top:12px;background:#064467;color:#fff;padding:10px 14px;border-radius:6px;font-size:15px}.neto b{font-size:18px}
.firma{text-align:center;margin-top:18px;font-size:11px}.barra{position:sticky;top:0;text-align:center;margin:-20px -20px 16px;background:#064467;padding:10px}
.barra button{background:#7CC142;color:#03253a;border:0;border-radius:6px;padding:9px 18px;font-weight:700;cursor:pointer}
@media print{body{background:#fff;padding:0}.barra{display:none}section{border-radius:0;page-break-after:always;max-width:none}}</style></head><body>
<div class="barra"><button onclick="print()">Imprimir / Guardar PDF (${recibos.length} recibo${recibos.length === 1 ? '' : 's'})</button></div>${paginas}<p style="font-size:10px;color:#666;text-align:center">Generado el ${fmtFechaLarga(hoy())}. Documento informativo, no sustituye al CFDI de nómina.</p></body></html>`)
  w.document.close()
}
