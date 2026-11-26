import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { useStore } from '../store/Store'
import { Badge, PageHeader, Select, Table, Input } from '../components/ui'
import { saldoVacaciones } from '../components/Vacaciones'
import { porcentajeExpediente } from '../components/Documentos'
import { antiguedadTexto, descargarCSV, estadoContrato, fmtFecha, fmtMoney, hoy, nombreCompleto, parseISO } from '../lib/utils'
import type { Colaborador } from '../types'

type Fila = Record<string, string | number | undefined>
interface Reporte { id: string; titulo: string; desc: string; filas: Fila[] }

export default function Reportes() {
  const { db, empresa } = useStore()
  const [alcance, setAlcance] = useState<'actual' | 'todas'>('actual')
  const [sp] = useSearchParams()
  const [id, setId] = useState(sp.get('r') || 'plantilla')
  const [desde, setDesde] = useState(hoy().slice(0, 5) + '01-01')
  const [hasta, setHasta] = useState(hoy())

  const empNombre = new Map(db.empresas.map((e) => [e.id, e.nombre]))
  const enAlcance = <T extends { empresaId: string }>(l: T[]) => (alcance === 'todas' ? l : l.filter((x) => x.empresaId === empresa.id))
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const nom = (cid: string) => { const c = colMap.get(cid); return c ? nombreCompleto(c) : '' }
  const base = (c: Colaborador): Fila => ({ Empresa: empNombre.get(c.empresaId), Número: c.numero, Colaborador: nombreCompleto(c) })

  const reportes: Reporte[] = useMemo(() => {
    const cols = enAlcance(db.colaboradores)
    const activos = cols.filter((c) => c.estatus !== 'Baja')
    const mes = new Date().getMonth()
    const porDepto = new Map<string, { n: number; nomina: number }>()
    activos.forEach((c) => { const k = `${empNombre.get(c.empresaId)}|${c.departamento}`; const v = porDepto.get(k) ?? { n: 0, nomina: 0 }; v.n++; v.nomina += c.salarioDiario * 30.4; porDepto.set(k, v) })
    return [
      { id: 'plantilla', titulo: 'Plantilla de personal', desc: 'Colaboradores activos con sus datos principales',
        filas: activos.map((c) => ({ ...base(c), Puesto: c.puesto, Departamento: c.departamento, Ingreso: fmtFecha(c.fechaIngreso), Antigüedad: antiguedadTexto(c.fechaIngreso), 'Salario diario': fmtMoney(c.salarioDiario), Estatus: c.estatus })) },
      { id: 'departamentos', titulo: 'Plantilla por departamento', desc: 'Número de personas y costo mensual estimado por área',
        filas: [...porDepto.entries()].map(([k, v]) => { const [e, d] = k.split('|'); return { Empresa: e, Departamento: d, Colaboradores: v.n, 'Costo mensual aprox.': fmtMoney(v.nomina) } }) },
      { id: 'altas', titulo: 'Altas y bajas', desc: 'Movimientos de personal en el rango de fechas',
        filas: [
          ...cols.filter((c) => c.fechaIngreso >= desde && c.fechaIngreso <= hasta).map((c) => ({ ...base(c), Movimiento: 'Alta', Fecha: fmtFecha(c.fechaIngreso), Puesto: c.puesto, Motivo: '' })),
          ...cols.filter((c) => c.fechaBaja && c.fechaBaja >= desde && c.fechaBaja <= hasta).map((c) => ({ ...base(c), Movimiento: 'Baja', Fecha: fmtFecha(c.fechaBaja), Puesto: c.puesto, Motivo: c.motivoBaja })),
        ] },
      { id: 'cumpleanos', titulo: 'Cumpleaños del mes', desc: 'Colaboradores que cumplen años este mes',
        filas: activos.filter((c) => c.fechaNacimiento && parseISO(c.fechaNacimiento).getMonth() === mes).sort((a, b) => a.fechaNacimiento.slice(8).localeCompare(b.fechaNacimiento.slice(8))).map((c) => ({ ...base(c), Fecha: fmtFecha(c.fechaNacimiento).slice(0, 6), Departamento: c.departamento })) },
      { id: 'contratos', titulo: 'Contratos por vencer', desc: 'Contratos vencidos o que vencen en los próximos 30 días',
        filas: enAlcance(db.contratos).filter((k) => ['Por vencer', 'Vencido'].includes(estadoContrato(k))).map((k) => ({ Empresa: empNombre.get(k.empresaId), Colaborador: nom(k.colaboradorId), Tipo: k.tipo, Término: fmtFecha(k.fechaFin), Estado: estadoContrato(k) })) },
      { id: 'vacaciones', titulo: 'Saldos de vacaciones', desc: 'Días que corresponden, tomados y disponibles',
        filas: activos.map((c) => { const s = saldoVacaciones(c, db.vacaciones); return { ...base(c), 'Años': s.anios, Corresponden: s.dias, Tomados: s.usados, Disponibles: s.disponibles } }) },
      { id: 'incidencias', titulo: 'Incidencias', desc: 'Incidencias registradas en el rango de fechas',
        filas: enAlcance(db.incidencias).filter((i) => i.fecha >= desde && i.fecha <= hasta).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((i) => ({ Empresa: empNombre.get(i.empresaId), Fecha: fmtFecha(i.fecha), Colaborador: nom(i.colaboradorId), Tipo: i.tipo, Cantidad: i.cantidad, Estatus: i.estatus })) },
      { id: 'expedientes', titulo: 'Expedientes incompletos', desc: 'Colaboradores con documentación pendiente',
        filas: activos.map((c) => ({ ...base(c), Avance: porcentajeExpediente(db.documentos, c.id) })).filter((f) => (f.Avance as number) < 100).map((f) => ({ ...f, Avance: `${f.Avance}%` })) },
      { id: 'nomina', titulo: 'Resumen de nóminas', desc: 'Totales por periodo de nómina',
        filas: enAlcance(db.nominas).filter((n) => n.fechaInicio >= desde && n.fechaInicio <= hasta).map((n) => ({ Empresa: empNombre.get(n.empresaId), Periodo: n.nombre, Recibos: n.recibos.length, Percepciones: fmtMoney(n.recibos.reduce((s, r) => s + r.totalPercepciones, 0)), Deducciones: fmtMoney(n.recibos.reduce((s, r) => s + r.totalDeducciones, 0)), Neto: fmtMoney(n.recibos.reduce((s, r) => s + r.neto, 0)), Estatus: n.estatus })) },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, empresa.id, alcance, desde, hasta])

  const r = reportes.find((x) => x.id === id)!
  const cols = r.filas.length ? Object.keys(r.filas[0]).filter((k) => alcance === 'todas' || k !== 'Empresa') : []
  const usaFechas = ['altas', 'incidencias', 'nomina'].includes(id)

  return (
    <>
      <PageHeader title="Reportes" subtitle="Consulta, imprime o exporta a Excel (CSV) la información de tu personal"
        actions={<>
          <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
          <button className="btn-primary" disabled={!r.filas.length} onClick={() => descargarCSV(`${r.titulo}-${alcance === 'todas' ? 'todas las empresas' : empresa.nombre}`, r.filas)}><Download size={16} /> Exportar a Excel</button>
        </>} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="no-print space-y-4">
          <div className="card p-3">
            <label className="label px-1">Alcance</label>
            <Select value={alcance} onChange={(e) => setAlcance(e.target.value as 'actual' | 'todas')}>
              <option value="actual">Solo {empresa.nombre}</option><option value="todas">Todas las empresas (consolidado)</option>
            </Select>
          </div>
          <nav className="card p-2">
            {reportes.map((x) => (
              <button key={x.id} onClick={() => setId(x.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${x.id === id ? 'bg-primary-50 font-medium text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                {x.titulo}<span className="text-xs text-slate-400">{x.filas.length}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-4">
            <div><h2 className="font-semibold">{r.titulo}</h2><p className="text-sm text-slate-500">{r.desc} · {alcance === 'todas' ? 'Todas las empresas' : empresa.nombre}</p></div>
            {usaFechas && <div className="no-print flex gap-2"><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>}
          </div>
          {r.filas.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No hay información para este reporte.</p> : (
            <Table head={cols.map((c) => <th key={c} className="th">{c}</th>)}>
              {r.filas.map((f, i) => (
                <tr key={i}>{cols.map((c) => <td key={c} className="td">{['Estatus', 'Estado'].includes(c) ? <Badge>{String(f[c])}</Badge> : f[c]}</td>)}</tr>
              ))}
            </Table>
          )}
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">{r.filas.length} registro(s)</div>
        </div>
      </div>
    </>
  )
}
