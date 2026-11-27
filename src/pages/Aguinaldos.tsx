import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarClock, Calculator, Download, Gift, Lock, Printer, RefreshCw, RotateCcw, Save, Scale, Settings2, Trash2, Users, Wallet } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Field, Input, Modal, PageHeader, Seccion, Select, StatCard, Table, Tabs, confirmar } from '../components/ui'
import { logoHtml } from '../lib/plantillas'
import { CONFIG_AGUINALDO_LEY, calcularAguinaldo, colaboradoresConDerecho, configDe } from '../lib/aguinaldo'
import { descargarCSV, diffDays, fmtFecha, fmtFechaLarga, fmtMoney, hoy, nombreCompleto, round2, uid } from '../lib/utils'
import type { ConfigAguinaldo, DB, PeriodoAguinaldo, ReciboAguinaldo } from '../types'

const sumar = (rs: ReciboAguinaldo[], k: keyof ReciboAguinaldo) => round2(rs.reduce((s, r) => s + (r[k] as number), 0))
const fechas = (anio: number, cfg: ConfigAguinaldo) => {
  const inicio = `${anio}-${cfg.inicioPeriodo}`
  // Si el periodo cruza de año (ej. 01-dic a 30-nov) el inicio es del año anterior
  return { inicio: cfg.inicioPeriodo > cfg.finPeriodo ? `${anio - 1}-${cfg.inicioPeriodo}` : inicio, fin: `${anio}-${cfg.finPeriodo}`, pago: `${anio}-${cfg.fechaPago}` }
}

export default function Aguinaldos() {
  const { empresa, deEmpresa } = useStore()
  const [tab, setTab] = useState<'calculos' | 'configuracion'>('calculos')
  const [nuevo, setNuevo] = useState(false)
  const cfg = configDe(empresa.configAguinaldo)
  const anio = new Date().getFullYear()
  const f = fechas(anio, cfg)
  const periodos = deEmpresa('aguinaldos').sort((a, b) => b.anio - a.anio || b.fechaCreacion.localeCompare(a.fechaCreacion))
  const incs = deEmpresa('incidencias')
  const cols = deEmpresa('colaboradores')
  const estimado = useMemo(() => colaboradoresConDerecho(cols, cfg, f.inicio, f.fin).map((c) => calcularAguinaldo(c, incs, cfg, f.inicio, f.fin)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cols, incs, JSON.stringify(cfg), f.inicio, f.fin])
  const faltan = diffDays(hoy(), f.pago)

  return (
    <>
      <PageHeader title="Aguinaldos" subtitle={`Cálculo del aguinaldo ${anio} de ${empresa.nombre} conforme al art. 87 de la LFT`}
        actions={<button className="btn-accent" onClick={() => setNuevo(true)}><Calculator size={16} /> Calcular aguinaldo {anio}</button>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<CalendarClock size={22} />} value={faltan >= 0 ? `${faltan} días` : 'Vencido'} label={`Pago límite: ${fmtFecha(f.pago)}`} tono={faltan < 0 ? 'red' : faltan <= 15 ? 'amber' : 'navy'} />
        <StatCard icon={<Users size={22} />} value={estimado.length} label="Colaboradores con derecho" tono="green" />
        <StatCard icon={<Gift size={22} />} value={fmtMoney(sumar(estimado, 'importe'))} label="Aguinaldo bruto estimado" tono="blue" />
        <StatCard icon={<Wallet size={22} />} value={fmtMoney(sumar(estimado, 'neto'))} label={`Neto estimado · ISR ${fmtMoney(sumar(estimado, 'isr'))}`} tono="navy" />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'calculos', label: 'Cálculos', icon: Calculator, count: periodos.length }, { id: 'configuracion', label: 'Configuración', icon: Settings2 }]} />
      <div className="mt-6">
        {tab === 'calculos' ? (
          <Seccion titulo="Cálculos de aguinaldo" icon={Gift}>
            {periodos.length === 0 ? (
              <Empty title="Aún no hay cálculos" text="Revisa la configuración y pulsa «Calcular aguinaldo». Puedes recalcular cuantas veces necesites antes de cerrarlo."
                action={<button className="btn-accent" onClick={() => setNuevo(true)}><Calculator size={16} /> Calcular aguinaldo {anio}</button>} />
            ) : (
              <Table head={<><th className="th">Cálculo</th><th className="th">Periodo</th><th className="th">Colaboradores</th><th className="th">Bruto</th><th className="th">ISR</th><th className="th">Neto</th><th className="th">Estatus</th><th className="th" /></>}>
                {periodos.map((p) => (
                  <tr key={p.id} className="hover:bg-accent-50">
                    <td className="td"><Link to={`/aguinaldos/${p.id}`} className="font-semibold text-primary-700 hover:underline">{p.nombre}</Link><div className="text-xs text-slate-500">Pago {fmtFecha(p.fechaPago)}</div></td>
                    <td className="td text-slate-600">{fmtFecha(p.fechaInicio)} – {fmtFecha(p.fechaFin)}</td>
                    <td className="td">{p.recibos.length}</td>
                    <td className="td">{fmtMoney(sumar(p.recibos, 'importe'))}</td>
                    <td className="td">{fmtMoney(sumar(p.recibos, 'isr'))}</td>
                    <td className="td font-bold text-primary-900">{fmtMoney(sumar(p.recibos, 'neto'))}</td>
                    <td className="td"><Badge>{p.estatus}</Badge></td>
                    <td className="td text-right"><Link to={`/aguinaldos/${p.id}`} className="btn-secondary py-1.5">Abrir</Link></td>
                  </tr>
                ))}
              </Table>
            )}
          </Seccion>
        ) : <ConfigAguinaldoPanel />}
      </div>
      {nuevo && <NuevoCalculo onClose={() => setNuevo(false)} />}
    </>
  )
}

function Ayuda({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-snug text-slate-500">{children}</p>
}

function Check({ label, checked, onChange, ayuda }: { label: string; checked: boolean; onChange: (v: boolean) => void; ayuda?: string }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-primary-300">
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span><span className="block text-sm font-semibold text-primary-800">{label}</span>{ayuda && <span className="text-xs text-slate-500">{ayuda}</span>}</span>
    </label>
  )
}

const mmdd = (v: string) => `2026-${v}`
const aMmdd = (v: string) => v.slice(5)

export function ConfigAguinaldoPanel() {
  const { empresa, guardarItem, puede } = useStore()
  const [cfg, setCfg] = useState<ConfigAguinaldo>(() => configDe(empresa.configAguinaldo))
  const [guardado, setGuardado] = useState(false)
  const set = <K extends keyof ConfigAguinaldo>(k: K, v: ConfigAguinaldo[K]) => { setCfg((p) => ({ ...p, [k]: v })); setGuardado(false) }
  const esAdmin = puede('configuracion', 'editar')
  const guardar = () => { guardarItem('empresas', { ...empresa, configAguinaldo: cfg }, { accion: `Configuración de aguinaldo actualizada (${cfg.dias} días)`, modulo: 'Aguinaldos' }); setGuardado(true) }
  const exentoTope = cfg.valorUMA * cfg.diasExentos

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Prestación" icon={Gift}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Días de aguinaldo">
              <Input type="number" min={15} step="0.5" value={cfg.dias} onChange={(e) => set('dias', Number(e.target.value))} />
              <Ayuda>Mínimo de ley: 15 días de salario. Si la empresa otorga más (prestación superior), escríbelo aquí.</Ayuda>
            </Field>
            <Field label="Salario base">
              <Select value={cfg.base} onChange={(e) => set('base', e.target.value as ConfigAguinaldo['base'])}><option>Salario diario</option><option>Salario diario integrado</option></Select>
              <Ayuda>La ley indica salario diario (cuota diaria). Usa el integrado solo si tu contrato colectivo lo establece.</Ayuda>
            </Field>
            {cfg.base === 'Salario diario integrado' && (
              <Field label="Factor de integración"><Input type="number" min={1} step="0.0001" value={cfg.factorIntegracion} onChange={(e) => set('factorIntegracion', Number(e.target.value))} /><Ayuda>1.0493 = prestaciones mínimas de ley (15 días de aguinaldo y 25% de prima vacacional).</Ayuda></Field>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Periodo y pago" icon={CalendarClock}>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Inicio del cómputo"><Input type="date" value={mmdd(cfg.inicioPeriodo)} onChange={(e) => e.target.value && set('inicioPeriodo', aMmdd(e.target.value))} /></Field>
            <Field label="Fin del cómputo"><Input type="date" value={mmdd(cfg.finPeriodo)} onChange={(e) => e.target.value && set('finPeriodo', aMmdd(e.target.value))} /></Field>
            <Field label="Fecha de pago"><Input type="date" value={mmdd(cfg.fechaPago)} onChange={(e) => e.target.value && set('fechaPago', aMmdd(e.target.value))} /></Field>
            <p className="text-xs text-slate-500 sm:col-span-3">Solo cuentan el día y el mes; el año se toma al calcular. Lo usual es del 1 de enero al 31 de diciembre. El pago debe hacerse <b>antes del 20 de diciembre</b> (LFT art. 87).{cfg.fechaPago > '12-20' && <b className="text-rose-600"> La fecha de pago elegida es posterior al límite legal.</b>}</p>
          </div>
        </Seccion>

        <Seccion titulo="Días que se descuentan" icon={Scale}>
          <div className="space-y-2 p-5">
            <Check label="Faltas injustificadas" checked={cfg.descontarFaltas} onChange={(v) => set('descontarFaltas', v)} ayuda="Se restan los días de falta registrados en Incidencias." />
            <Check label="Permisos sin goce de sueldo" checked={cfg.descontarPermisosSinGoce} onChange={(v) => set('descontarPermisosSinGoce', v)} ayuda="Días en que la relación de trabajo estuvo suspendida." />
            <Check label="Incapacidades" checked={cfg.descontarIncapacidades} onChange={(v) => set('descontarIncapacidades', v)} ayuda="No recomendado: las incapacidades por maternidad y riesgo de trabajo cuentan como días laborados." />
          </div>
        </Seccion>

        <Seccion titulo="Personal incluido" icon={Users}>
          <div className="space-y-2 p-5">
            <Check label="Incluir bajas del año" checked={cfg.incluirBajas} onChange={(v) => set('incluirBajas', v)} ayuda="Quienes dejaron la empresa en el periodo reciben la parte proporcional (se paga en su finiquito)." />
            <p className="text-xs text-slate-500">Quien no trabajó el año completo recibe la parte proporcional: días de aguinaldo × días trabajados ÷ días del periodo. Por ejemplo, 6 meses = 7.5 días.</p>
          </div>
        </Seccion>
      </div>

      <Seccion titulo="Impuestos (ISR)" icon={Wallet}>
        <div className="grid gap-4 p-5 md:grid-cols-4">
          <Field label="Valor diario de la UMA"><Input type="number" min={0} step="0.01" value={cfg.valorUMA} onChange={(e) => set('valorUMA', Number(e.target.value))} /><Ayuda>Actualízalo con el valor vigente publicado por el INEGI.</Ayuda></Field>
          <Field label="UMAs exentas"><Input type="number" min={0} value={cfg.diasExentos} onChange={(e) => set('diasExentos', Number(e.target.value))} /><Ayuda>LISR art. 93 fr. XIV: 30 UMA = exento hasta <b>{fmtMoney(exentoTope)}</b>.</Ayuda></Field>
          <Field label="Método de cálculo del ISR">
            <Select value={cfg.metodoISR} onChange={(e) => set('metodoISR', e.target.value as ConfigAguinaldo['metodoISR'])}><option value="Art. 174 RLISR">Art. 174 RLISR (opcional, suele retener menos)</option><option value="Art. 96 LISR">Art. 96 LISR (se suma al sueldo del mes)</option></Select>
          </Field>
          <div className="flex items-end"><Check label="La empresa absorbe el ISR" checked={cfg.noRetenerISR} onChange={(v) => set('noRetenerISR', v)} /></div>
        </div>
      </Seccion>

      <div className="flex flex-wrap items-center gap-3">
        {esAdmin ? <button className="btn-primary" onClick={guardar}><Save size={16} /> Guardar configuración</button> : <span className="text-sm text-slate-500">Solo quien tiene permiso de edición en Configuración puede cambiarla.</span>}
        {esAdmin && <button className="btn-secondary" onClick={() => { setCfg(CONFIG_AGUINALDO_LEY); setGuardado(false) }}><RotateCcw size={16} /> Restablecer valores de ley</button>}
        {guardado && <span className="text-sm font-semibold text-accent-700">✓ Configuración guardada para {empresa.nombre}</span>}
      </div>
      <p className="text-xs text-slate-500">El ISR se estima con la tarifa mensual del art. 96 de la LISR, sin subsidio al empleo. Valídalo con tu contador antes de timbrar el CFDI.</p>
    </div>
  )
}

function NuevoCalculo({ onClose }: { onClose: () => void }) {
  const { empresa, deEmpresa, guardarItem } = useStore()
  const nav = useNavigate()
  const cfg = configDe(empresa.configAguinaldo)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const f = fechas(anio, cfg)
  const [inicio, setInicio] = useState(f.inicio)
  const [fin, setFin] = useState(f.fin)
  const [pago, setPago] = useState(f.pago)
  const cambiarAnio = (a: number) => { setAnio(a); const g = fechas(a, cfg); setInicio(g.inicio); setFin(g.fin); setPago(g.pago) }
  const calcular = () => {
    const recibos = colaboradoresConDerecho(deEmpresa('colaboradores'), cfg, inicio, fin).map((c) => calcularAguinaldo(c, deEmpresa('incidencias'), cfg, inicio, fin))
    const p: PeriodoAguinaldo = { id: uid(), empresaId: empresa.id, anio, nombre: `Aguinaldo ${anio}`, fechaInicio: inicio, fechaFin: fin, fechaPago: pago, config: cfg, recibos, estatus: 'Borrador', fechaCreacion: new Date().toISOString() }
    guardarItem('aguinaldos', p, { accion: `Aguinaldo ${anio} calculado (${recibos.length} colaboradores)`, modulo: 'Aguinaldos' })
    nav(`/aguinaldos/${p.id}`)
  }
  return (
    <Modal open onClose={onClose} title="Calcular aguinaldo" footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-accent" onClick={calcular}><Calculator size={16} /> Calcular</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Año"><Input type="number" min={2000} max={2100} value={anio} onChange={(e) => cambiarAnio(Number(e.target.value))} /></Field>
        <Field label="Fecha de pago"><Input type="date" value={pago} onChange={(e) => setPago(e.target.value)} /></Field>
        <Field label="Cómputo del"><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
        <Field label="Al"><Input type="date" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-lg bg-primary-50 p-3 text-sm text-primary-800">
        Se usará la configuración actual: <b>{cfg.dias} días</b> sobre <b>{cfg.base.toLowerCase()}</b>, exento hasta <b>{fmtMoney(cfg.valorUMA * cfg.diasExentos)}</b>, ISR por <b>{cfg.metodoISR}</b>{cfg.incluirBajas ? ', incluyendo bajas del año' : ''}.
      </div>
    </Modal>
  )
}

export function AguinaldoDetalle() {
  const { id } = useParams()
  const { db, deEmpresa, guardarItem, eliminarItem, empresa } = useStore()
  const nav = useNavigate()
  const p = db.aguinaldos.find((x) => x.id === id)
  if (!p) return <Empty title="Cálculo no encontrado" action={<Link to="/aguinaldos" className="btn-primary">Volver</Link>} />
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const t = (k: keyof ReciboAguinaldo) => sumar(p.recibos, k)

  const recalcular = () => {
    const cfg = configDe(empresa.configAguinaldo)
    const recibos = colaboradoresConDerecho(deEmpresa('colaboradores'), cfg, p.fechaInicio, p.fechaFin).map((c) => calcularAguinaldo(c, deEmpresa('incidencias'), cfg, p.fechaInicio, p.fechaFin))
    guardarItem('aguinaldos', { ...p, config: cfg, recibos })
  }
  const exportar = () => descargarCSV(p.nombre, p.recibos.map((r) => {
    const c = colMap.get(r.colaboradorId)
    return { Número: c?.numero, Colaborador: c ? nombreCompleto(c) : '', Desde: r.desde, Hasta: r.hasta, 'Días trabajados': r.diasTrabajados, 'Días descontados': r.diasDescontados, 'Días de aguinaldo': r.diasAguinaldo, 'Salario base': r.salarioBase, Importe: r.importe, Exento: r.exento, Gravado: r.gravado, ISR: r.isr, Neto: r.neto, Banco: c?.banco, Cuenta: c?.cuenta }
  }))

  return (
    <>
      <PageHeader title={p.nombre} subtitle={`${empresa.nombre} · cómputo ${fmtFecha(p.fechaInicio)} – ${fmtFecha(p.fechaFin)} · pago ${fmtFecha(p.fechaPago)}`}
        actions={<>
          <Badge>{p.estatus}</Badge>
          <button className="btn-secondary" onClick={exportar}><Download size={16} /> Exportar</button>
          <button className="btn-secondary" onClick={() => imprimirRecibos(p, p.recibos, db)}><Printer size={16} /> Imprimir recibos</button>
          {p.estatus === 'Borrador' && <>
            <button className="btn-secondary" onClick={recalcular} title="Vuelve a calcular con la configuración y datos actuales"><RefreshCw size={16} /> Recalcular</button>
            <button className="btn-primary" onClick={() => confirmar('Al cerrar el cálculo ya no podrá recalcularse. ¿Continuar?') && guardarItem('aguinaldos', { ...p, estatus: 'Cerrado' }, { accion: `${p.nombre} cerrado`, modulo: 'Aguinaldos' })}><Lock size={16} /> Cerrar</button>
            <button className="btn-ghost text-rose-600" title="Eliminar" onClick={() => { if (confirmar('¿Eliminar este cálculo?')) { eliminarItem('aguinaldos', p.id); nav('/aguinaldos') } }}><Trash2 size={16} /></button>
          </>}
        </>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Gift size={22} />} value={fmtMoney(t('importe'))} label="Aguinaldo bruto" />
        <StatCard icon={<Scale size={22} />} value={fmtMoney(t('exento'))} label={`Exento · gravado ${fmtMoney(t('gravado'))}`} tono="green" />
        <StatCard icon={<Calculator size={22} />} value={fmtMoney(t('isr'))} label={`ISR (${p.config.metodoISR})`} tono="red" />
        <StatCard icon={<Wallet size={22} />} value={fmtMoney(t('neto'))} label="Neto a pagar" tono="blue" />
      </div>
      <Seccion titulo="Detalle por colaborador" icon={Users}>
        {p.recibos.length === 0 ? <Empty title="No hay colaboradores con derecho en este periodo" /> : (
          <Table head={<><th className="th">Colaborador</th><th className="th">Periodo</th><th className="th">Días trab.</th><th className="th">Desc.</th><th className="th">Días aguinaldo</th><th className="th">Salario base</th><th className="th">Bruto</th><th className="th">Exento</th><th className="th">ISR</th><th className="th">Neto</th><th className="th" /></>}>
            {p.recibos.map((r) => { const c = colMap.get(r.colaboradorId); return (
              <tr key={r.colaboradorId} className="hover:bg-accent-50">
                <td className="td">{c ? <div className="flex items-center gap-2"><Avatar c={c} size={30} /><div><div className="font-semibold text-primary-900">{nombreCompleto(c)}</div>{c.estatus === 'Baja' && <span className="text-xs font-semibold text-rose-600">Baja {fmtFecha(c.fechaBaja)}</span>}</div></div> : '—'}</td>
                <td className="td text-xs text-slate-600">{fmtFecha(r.desde)} – {fmtFecha(r.hasta)}</td>
                <td className="td">{r.diasTrabajados}</td>
                <td className="td">{r.diasDescontados ? <span className="font-semibold text-rose-600">−{r.diasDescontados}</span> : 0}</td>
                <td className="td font-semibold">{r.diasAguinaldo}{!r.completo && <span className="ml-1 rounded bg-amber-50 px-1 text-[10px] font-bold text-amber-700">PROP.</span>}</td>
                <td className="td">{fmtMoney(r.salarioBase)}</td>
                <td className="td">{fmtMoney(r.importe)}</td>
                <td className="td text-slate-600">{fmtMoney(r.exento)}</td>
                <td className="td">{fmtMoney(r.isr)}</td>
                <td className="td font-bold text-primary-900">{fmtMoney(r.neto)}</td>
                <td className="td text-right"><button className="btn-ghost" title="Imprimir recibo" onClick={() => imprimirRecibos(p, [r], db)}><Printer size={16} /></button></td>
              </tr>) })}
            <tr className="bg-primary-50 font-bold text-primary-900">
              <td className="td" colSpan={6}>Totales</td><td className="td">{fmtMoney(t('importe'))}</td><td className="td">{fmtMoney(t('exento'))}</td><td className="td">{fmtMoney(t('isr'))}</td><td className="td">{fmtMoney(t('neto'))}</td><td className="td" />
            </tr>
          </Table>
        )}
      </Seccion>
      <p className="mt-3 text-xs text-slate-500">Configuración usada: {p.config.dias} días · {p.config.base.toLowerCase()} · UMA {fmtMoney(p.config.valorUMA)} × {p.config.diasExentos} · {p.config.metodoISR}{p.config.noRetenerISR ? ' · ISR absorbido por la empresa' : ''}.</p>
    </>
  )
}

function imprimirRecibos(p: PeriodoAguinaldo, recibos: ReciboAguinaldo[], db: DB) {
  const e = db.empresas.find((x) => x.id === p.empresaId)!
  const html = recibos.map((r) => {
    const c = db.colaboradores.find((x) => x.id === r.colaboradorId)
    if (!c) return ''
    return `<section><header><div style="display:flex;gap:12px;align-items:center">${logoHtml(e, 48)}<div><b>${e.razonSocial || e.nombre}</b><br>RFC ${e.rfc} · Reg. Pat. ${e.registroPatronal || '—'}</div></div><div class="r"><b>RECIBO DE AGUINALDO ${p.anio}</b><br>Pago: ${fmtFecha(p.fechaPago)}</div></header>
<div class="emp"><div><b>${nombreCompleto(c)}</b><br>${c.numero} · ${c.puesto}</div><div>RFC ${c.rfc}<br>CURP ${c.curp}</div><div>Periodo ${fmtFecha(r.desde)} – ${fmtFecha(r.hasta)}<br>Días computables ${r.diasComputables}</div></div>
<table><tr><th>Concepto</th><th class="r">Importe</th></tr>
<tr><td>Aguinaldo: ${r.diasAguinaldo} días × ${fmtMoney(r.salarioBase)}</td><td class="r">${fmtMoney(r.importe)}</td></tr>
<tr><td class="s">· Parte exenta (${p.config.diasExentos} UMA)</td><td class="r s">${fmtMoney(r.exento)}</td></tr>
<tr><td class="s">· Parte gravada</td><td class="r s">${fmtMoney(r.gravado)}</td></tr>
<tr><td>Retención de ISR</td><td class="r">−${fmtMoney(r.isr)}</td></tr></table>
<div class="neto">NETO A PAGAR: ${fmtMoney(r.neto)}</div>
<p class="firma">Recibí de conformidad el pago de mi aguinaldo correspondiente al año ${p.anio}.<br><br><br>_______________________________<br>${nombreCompleto(c)}</p></section>`
  }).join('')
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para imprimir.')
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${p.nombre}</title><style>
body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:0;padding:20px}section{border:1px solid #cbd5e1;border-top:5px solid #064467;border-radius:6px;padding:16px;margin-bottom:20px;page-break-inside:avoid}
header,.emp{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.emp{background:#eef5fa;padding:8px;border-radius:6px}table{width:100%;border-collapse:collapse}
th{text-align:left;background:#064467;color:#fff;padding:5px}td{padding:5px;border-bottom:1px solid #e5e7eb}.r{text-align:right}.s{color:#64748b;font-size:11px}.neto{text-align:right;font-size:15px;font-weight:bold;margin-top:12px;color:#064467}
.firma{text-align:center;margin-top:16px;font-size:11px}@media print{button{display:none}section{page-break-after:always}}</style></head><body>
<button onclick="print()" style="padding:8px 14px;margin-bottom:12px;background:#7CC142;border:0;border-radius:6px;font-weight:bold">Imprimir / Guardar PDF</button>${html}<p style="font-size:10px;color:#666">Generado el ${fmtFechaLarga(hoy())}. Documento informativo, no sustituye al CFDI.</p></body></html>`)
  w.document.close()
}
