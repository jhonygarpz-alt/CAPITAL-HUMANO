import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, PageHeader, StatCard, Table, cx } from '../components/ui'
import { addDays, descargarCSV, fmtFecha, fmtFechaLarga, hoy, nombreCompleto, uid } from '../lib/utils'
import type { Asistencia, TipoAsistencia } from '../types'
import { CalendarCheck, Clock, UserX, Home } from 'lucide-react'

const TIPOS: TipoAsistencia[] = ['Asistencia', 'Retardo', 'Falta', 'Permiso', 'Home office']
const COLOR: Record<TipoAsistencia, string> = {
  Asistencia: 'bg-emerald-500 text-white', Retardo: 'bg-amber-500 text-white', Falta: 'bg-rose-500 text-white', Permiso: 'bg-sky-500 text-white', 'Home office': 'bg-primary-500 text-white',
}
const CORTO: Record<TipoAsistencia, string> = { Asistencia: 'A', Retardo: 'R', Falta: 'F', Permiso: 'P', 'Home office': 'H' }

export default function Asistencias() {
  const { deEmpresa, guardarItem, eliminarItem, empresa } = useStore()
  const [fecha, setFecha] = useState(hoy())
  const cols = deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja').sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
  const asis = deEmpresa('asistencias')
  const delDia = useMemo(() => new Map(asis.filter((a) => a.fecha === fecha).map((a) => [a.colaboradorId, a])), [asis, fecha])
  const semana = Array.from({ length: 7 }, (_, i) => addDays(fecha, i - 6))
  const idx = useMemo(() => new Map(asis.map((a) => [a.colaboradorId + a.fecha, a])), [asis])

  const marcar = (colaboradorId: string, tipo: TipoAsistencia | null, extra?: Partial<Asistencia>) => {
    const prev = delDia.get(colaboradorId)
    if (!tipo) return prev && eliminarItem('asistencias', prev.id)
    const ahora = new Date().toTimeString().slice(0, 5)
    guardarItem('asistencias', { id: prev?.id ?? uid(), empresaId: empresa.id, colaboradorId, fecha, tipo, entrada: prev?.entrada ?? (tipo === 'Falta' ? undefined : fecha === hoy() ? ahora : '09:00'), salida: prev?.salida, ...extra })
  }
  const todosAsistencia = () => cols.forEach((c) => !delDia.has(c.id) && marcar(c.id, 'Asistencia'))
  const cuenta = (t: TipoAsistencia) => [...delDia.values()].filter((a) => a.tipo === t).length

  const exportar = () => descargarCSV(`asistencias-${empresa.nombre}-${fecha}`, asis.filter((a) => semana.includes(a.fecha)).map((a) => {
    const c = cols.find((x) => x.id === a.colaboradorId)
    return { Fecha: a.fecha, Colaborador: c ? nombreCompleto(c) : '', Tipo: a.tipo, Entrada: a.entrada, Salida: a.salida }
  }))

  return (
    <>
      <PageHeader title="Asistencias" subtitle="Registro diario de entradas, salidas, retardos y faltas"
        actions={<><button className="btn-secondary" onClick={exportar}><Download size={16} /> Exportar semana</button><button className="btn-primary" onClick={todosAsistencia}><CalendarCheck size={16} /> Marcar asistencia a todos</button></>} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<CalendarCheck size={20} />} value={cuenta('Asistencia') + cuenta('Home office')} label="Asistencias" tono="green" />
        <StatCard icon={<Clock size={20} />} value={cuenta('Retardo')} label="Retardos" tono="amber" />
        <StatCard icon={<UserX size={20} />} value={cuenta('Falta')} label="Faltas" tono="red" />
        <StatCard icon={<Home size={20} />} value={cols.length - delDia.size} label="Sin registro" tono="slate" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <button className="btn-secondary px-2.5" onClick={() => setFecha(addDays(fecha, -1))} aria-label="Día anterior"><ChevronLeft size={16} /></button>
          <input type="date" className="input w-44" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
          <button className="btn-secondary px-2.5" onClick={() => setFecha(addDays(fecha, 1))} aria-label="Día siguiente"><ChevronRight size={16} /></button>
          {fecha !== hoy() && <button className="btn-ghost" onClick={() => setFecha(hoy())}>Hoy</button>}
          <span className="ml-auto text-sm text-slate-500">{fmtFechaLarga(fecha)}</span>
        </div>
        <Table head={<><th className="th">Colaborador</th><th className="th">Registro del día</th><th className="th">Entrada</th><th className="th">Salida</th><th className="th hidden lg:table-cell">Últimos 7 días</th></>}>
          {cols.map((c) => {
            const a = delDia.get(c.id)
            return (
              <tr key={c.id}>
                <td className="td"><div className="flex items-center gap-3"><Avatar c={c} size={30} /><div><div className="font-medium">{nombreCompleto(c)}</div><div className="text-xs text-slate-500">{c.puesto}</div></div></div></td>
                <td className="td">
                  <div className="flex gap-1">
                    {TIPOS.map((t) => (
                      <button key={t} title={t} onClick={() => marcar(c.id, a?.tipo === t ? null : t)}
                        className={cx('h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition', a?.tipo === t ? COLOR[t] : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}>
                        <span className="hidden xl:inline">{t}</span><span className="xl:hidden">{CORTO[t]}</span>
                      </button>
                    ))}
                  </div>
                </td>
                <td className="td"><input type="time" className="input w-28 py-1" disabled={!a || a.tipo === 'Falta'} value={a?.entrada ?? ''} onChange={(e) => a && marcar(c.id, a.tipo, { entrada: e.target.value })} /></td>
                <td className="td"><input type="time" className="input w-28 py-1" disabled={!a || a.tipo === 'Falta'} value={a?.salida ?? ''} onChange={(e) => a && marcar(c.id, a.tipo, { salida: e.target.value })} /></td>
                <td className="td hidden lg:table-cell">
                  <div className="flex gap-1">
                    {semana.map((d) => { const r = idx.get(c.id + d); return (
                      <span key={d} title={`${fmtFecha(d)}: ${r?.tipo ?? 'Sin registro'}`} className={cx('flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold', r ? COLOR[r.tipo] : 'bg-slate-100 text-slate-300')}>{r ? CORTO[r.tipo] : '·'}</span>
                    ) })}
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Haz clic en un tipo para marcarlo; vuelve a hacer clic para quitarlo. A = Asistencia, R = Retardo, F = Falta, P = Permiso, H = Home office. Para que una falta se descuente en nómina, regístrala también en Incidencias.</p>
      </div>
    </>
  )
}
