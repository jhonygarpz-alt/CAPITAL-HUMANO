import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Input, PageHeader, Select, Table, Tabs, confirmar } from '../components/ui'
import { VacacionForm, saldoVacaciones } from '../components/Vacaciones'
import { fmtFecha, nombreCompleto, normalizar } from '../lib/utils'
import type { EstatusSolicitud, Vacacion } from '../types'

export default function Vacaciones() {
  const { deEmpresa, db, guardarItem, eliminarItem } = useStore()
  const [tab, setTab] = useState<'solicitudes' | 'saldos'>('solicitudes')
  const [estatus, setEstatus] = useState('')
  const [q, setQ] = useState('')
  const [nueva, setNueva] = useState(false)
  const vacs = deEmpresa('vacaciones')
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const filas = vacs.filter((v) => !estatus || v.estatus === estatus).sort((a, b) => (a.estatus === 'Pendiente' ? -1 : 0) - (b.estatus === 'Pendiente' ? -1 : 0) || b.fechaInicio.localeCompare(a.fechaInicio))
  const saldos = useMemo(() => deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja' && (!q || normalizar(nombreCompleto(c)).includes(normalizar(q)))).map((c) => ({ c, s: saldoVacaciones(c, db.vacaciones) })), [deEmpresa, db.vacaciones, q])

  const cambiar = (v: Vacacion, e: EstatusSolicitud) => {
    const c = colMap.get(v.colaboradorId)
    guardarItem('vacaciones', { ...v, estatus: e }, { colaboradorId: v.colaboradorId, accion: `Vacaciones ${e.toLowerCase()} (${v.dias} días) de ${c ? nombreCompleto(c) : ''}` })
  }

  return (
    <>
      <PageHeader title="Vacaciones" subtitle="Solicitudes, aprobaciones y saldos según la Ley Federal del Trabajo"
        actions={<button className="btn-primary" onClick={() => setNueva(true)}><Plus size={16} /> Nueva solicitud</button>} />
      <div className="card overflow-hidden">
        <div className="px-4 pt-2"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'solicitudes', label: 'Solicitudes', count: vacs.filter((v) => v.estatus === 'Pendiente').length }, { id: 'saldos', label: 'Saldos por colaborador' }]} /></div>
        {tab === 'solicitudes' ? (
          <>
            <div className="border-b border-slate-100 p-4">
              <Select className="sm:w-56" value={estatus} onChange={(e) => setEstatus(e.target.value)}><option value="">Todos los estatus</option><option>Pendiente</option><option>Aprobada</option><option>Rechazada</option></Select>
            </div>
            {filas.length === 0 ? <Empty title="Sin solicitudes" /> : (
              <Table head={<><th className="th">Colaborador</th><th className="th">Periodo</th><th className="th">Días</th><th className="th hidden md:table-cell">Comentario</th><th className="th">Estatus</th><th className="th" /></>}>
                {filas.map((v) => { const c = colMap.get(v.colaboradorId); return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="td">{c && <Link to={`/colaboradores/${c.id}?tab=vacaciones`} className="flex items-center gap-3 font-medium hover:text-primary-600"><Avatar c={c} size={30} />{nombreCompleto(c)}</Link>}</td>
                    <td className="td">{fmtFecha(v.fechaInicio)} – {fmtFecha(v.fechaFin)}</td>
                    <td className="td">{v.dias}</td>
                    <td className="td hidden max-w-xs truncate text-slate-500 md:table-cell">{v.comentario || '—'}</td>
                    <td className="td"><Badge>{v.estatus}</Badge></td>
                    <td className="td text-right">
                      {v.estatus === 'Pendiente' ? <>
                        <button className="btn-ghost text-emerald-600" onClick={() => cambiar(v, 'Aprobada')}><Check size={16} /> Aprobar</button>
                        <button className="btn-ghost text-rose-600" onClick={() => cambiar(v, 'Rechazada')}><X size={16} /> Rechazar</button>
                      </> : <button className="btn-ghost text-slate-400" title="Eliminar" onClick={() => confirmar('¿Eliminar la solicitud?') && eliminarItem('vacaciones', v.id)}><Trash2 size={16} /></button>}
                    </td>
                  </tr>) })}
              </Table>
            )}
          </>
        ) : (
          <>
            <div className="border-b border-slate-100 p-4"><Input className="sm:w-72" placeholder="Buscar colaborador…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Table head={<><th className="th">Colaborador</th><th className="th">Antigüedad</th><th className="th">Periodo vigente</th><th className="th">Corresponden</th><th className="th">Tomados</th><th className="th">Pendientes</th><th className="th">Disponibles</th></>}>
              {saldos.map(({ c, s }) => (
                <tr key={c.id}>
                  <td className="td"><div className="flex items-center gap-3 font-medium"><Avatar c={c} size={30} />{nombreCompleto(c)}</div></td>
                  <td className="td">{s.anios} {s.anios === 1 ? 'año' : 'años'}</td>
                  <td className="td text-slate-500">{fmtFecha(s.inicio)} – {fmtFecha(s.fin)}</td>
                  <td className="td">{s.dias}</td><td className="td">{s.usados}</td><td className="td">{s.pendientes}</td>
                  <td className="td font-semibold text-primary-700">{s.disponibles}</td>
                </tr>
              ))}
            </Table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Días por año cumplido: 1 → 12, 2 → 14, 3 → 16, 4 → 18, 5 → 20, 6 a 10 → 22, 11 a 15 → 24 y +2 cada 5 años. Antes de cumplir el primer año no hay días generados.</p>
          </>
        )}
      </div>
      {nueva && <VacacionForm open onClose={() => setNueva(false)} />}
    </>
  )
}
