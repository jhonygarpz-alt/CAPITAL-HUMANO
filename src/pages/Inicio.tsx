import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, UserPlus, Palmtree, CalendarDays, CalendarX, Plus, FileWarning, Cake, ArrowRight, FolderOpen } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, PageHeader, StatCard, Table, Tabs, cx } from '../components/ui'
import { ColaboradorForm } from '../components/ColaboradorForm'
import { AccionesFila, PanelColaborador } from './Colaboradores'
import { porcentajeExpediente } from '../components/Documentos'
import { addDays, diffDays, estadoContrato, fmtFecha, hoy, nombreCompleto, parseISO } from '../lib/utils'

export default function Inicio() {
  const { deEmpresa, empresa, db } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState<'colaboradores' | 'contratos' | 'documentos'>('colaboradores')
  const [nuevo, setNuevo] = useState(false)
  const [sel, setSel] = useState<string>()

  const cols = deEmpresa('colaboradores')
  const activos = cols.filter((c) => c.estatus !== 'Baja')
  const t = hoy()
  const inicioMes = t.slice(0, 8) + '01'
  const altasMes = cols.filter((c) => c.fechaIngreso >= inicioMes).length
  const vacantes = deEmpresa('vacantes').filter((v) => v.estatus === 'Abierta' || v.estatus === 'En proceso').reduce((s, v) => s + v.posiciones, 0)
  const incPend = deEmpresa('incidencias').filter((i) => i.estatus === 'Pendiente').length
  const contratos = deEmpresa('contratos')
  const porVencer = contratos.filter((k) => ['Por vencer', 'Vencido'].includes(estadoContrato(k)))
  const mes = new Date().getMonth()
  const cumple = activos.filter((c) => c.fechaNacimiento && parseISO(c.fechaNacimiento).getMonth() === mes).sort((a, b) => a.fechaNacimiento.slice(8).localeCompare(b.fechaNacimiento.slice(8)))
  const recientes = [...activos].sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso))
  const docsRecientes = deEmpresa('documentos').sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8)
  const seleccionado = activos.find((c) => c.id === sel) ?? recientes[0]
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))

  return (
    <>
      <PageHeader title="Administración de Personal" subtitle={`Resumen de ${empresa.nombre}`}
        actions={<button className="btn-primary" onClick={() => setNuevo(true)}><Plus size={16} /> Nuevo colaborador</button>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={<Users size={22} />} value={activos.length} label="Colaboradores" tono="blue" onClick={() => nav('/colaboradores')} />
            <StatCard icon={<UserPlus size={22} />} value={altasMes} label="Altas del mes" tono="green" onClick={() => nav('/reportes')} />
            <StatCard icon={<CalendarDays size={22} />} value={vacantes} label="Vacantes" tono="violet" onClick={() => nav('/vacantes')} />
            <StatCard icon={<CalendarX size={22} />} value={incPend} label="Incidencias" tono="red" onClick={() => nav('/incidencias')} />
          </div>

          <div>
            <Tabs value={tab} onChange={setTab} tabs={[{ id: 'colaboradores', label: 'Colaboradores' }, { id: 'contratos', label: 'Contratos' }, { id: 'documentos', label: 'Documentos' }]} />
          </div>
          <div className="card-glow overflow-hidden">
            {tab === 'colaboradores' && (recientes.length === 0 ? <Empty title="Aún no hay colaboradores" action={<button className="btn-primary" onClick={() => setNuevo(true)}>Registrar el primero</button>} /> : (
              <Table head={<><th className="th">Colaborador</th><th className="th">Puesto</th><th className="th hidden md:table-cell">Empresa</th><th className="th hidden 2xl:table-cell">Expediente</th><th className="th">Estatus</th><th className="th" /></>}>
                {recientes.slice(0, 8).map((c) => (
                  <tr key={c.id} className={cx('cursor-pointer transition hover:bg-white/60', seleccionado?.id === c.id && 'bg-primary-50/70')} onClick={() => setSel(c.id)} onDoubleClick={() => nav(`/colaboradores/${c.id}`)}>
                    <td className="td"><div className="flex items-center gap-3"><Avatar c={c} size={38} /><span className="font-semibold text-slate-900">{nombreCompleto(c)}</span></div></td>
                    <td className="td">{c.puesto}</td>
                    <td className="td hidden md:table-cell">{empresa.nombre}</td>
                    <td className="td hidden 2xl:table-cell">{porcentajeExpediente(db.documentos, c.id)}%</td>
                    <td className="td"><Badge>{c.estatus}</Badge></td>
                    <td className="td text-right"><AccionesFila c={c} /></td>
                  </tr>
                ))}
              </Table>
            ))}
            {tab === 'contratos' && (contratos.length === 0 ? <Empty title="Sin contratos" /> : (
              <Table head={<><th className="th">Colaborador</th><th className="th">Tipo</th><th className="th">Término</th><th className="th">Estado</th></>}>
                {[...contratos].sort((a, b) => (a.fechaFin ?? '9').localeCompare(b.fechaFin ?? '9')).slice(0, 8).map((k) => {
                  const c = colMap.get(k.colaboradorId)
                  return <tr key={k.id}><td className="td font-medium">{c ? nombreCompleto(c) : '—'}</td><td className="td">{k.tipo}</td><td className="td text-slate-500">{k.fechaFin ? fmtFecha(k.fechaFin) : 'Indefinido'}</td><td className="td"><Badge>{estadoContrato(k)}</Badge></td></tr>
                })}
              </Table>
            ))}
            {tab === 'documentos' && (docsRecientes.length === 0 ? <Empty title="Sin documentos" /> : (
              <Table head={<><th className="th">Documento</th><th className="th">Colaborador</th><th className="th">Fecha</th></>}>
                {docsRecientes.map((d) => { const c = colMap.get(d.colaboradorId); return <tr key={d.id}><td className="td font-medium">{d.tipo}</td><td className="td">{c ? nombreCompleto(c) : '—'}</td><td className="td text-slate-500">{fmtFecha(d.fecha)}</td></tr> })}
              </Table>
            ))}
            <div className="border-t border-primary-100 px-4 py-3 text-right">
              <Link to={`/${tab === 'documentos' ? 'expedientes' : tab}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">Ver todo <ArrowRight size={14} /></Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><FileWarning size={18} className="text-amber-500" /> Contratos por vencer</h3>
              {porVencer.length === 0 ? <p className="text-sm text-slate-500">No hay contratos próximos a vencer. 👍</p> : (
                <ul className="space-y-2">
                  {porVencer.slice(0, 5).map((k) => { const c = colMap.get(k.colaboradorId); const d = diffDays(t, k.fechaFin!); return (
                    <li key={k.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/colaboradores/${k.colaboradorId}?tab=contratos`} className="truncate hover:text-primary-600">{c ? nombreCompleto(c) : '—'}</Link>
                      <span className={d < 0 ? 'text-rose-600' : 'text-amber-600'}>{d < 0 ? `venció hace ${-d} d` : `en ${d} días`}</span>
                    </li>) })}
                </ul>
              )}
            </div>
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Cake size={18} className="text-rose-500" /> Cumpleaños del mes</h3>
              {cumple.length === 0 ? <p className="text-sm text-slate-500">Sin cumpleaños este mes.</p> : (
                <ul className="space-y-2">
                  {cumple.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center gap-3 text-sm"><Avatar c={c} size={28} /><span className="flex-1 truncate">{nombreCompleto(c)}</span><span className="text-slate-500">{fmtFecha(c.fechaNacimiento).slice(0, 6)}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <ProximasAusencias />
        </div>
        {seleccionado ? <PanelColaborador c={seleccionado} /> : (
          <div className="card p-5 text-sm text-slate-500"><FolderOpen className="mb-2" /> Selecciona un colaborador para ver su resumen.</div>
        )}
      </div>
      {nuevo && <ColaboradorForm open onClose={() => setNuevo(false)} onSaved={(c) => setSel(c.id)} />}
    </>
  )
}

function ProximasAusencias() {
  const { deEmpresa, db } = useStore()
  const t = hoy()
  const lim = addDays(t, 30)
  const prox = deEmpresa('vacaciones').filter((v) => v.estatus !== 'Rechazada' && v.fechaFin >= t && v.fechaInicio <= lim).sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
  return (
    <div className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Palmtree size={18} className="text-sky-500" /> Vacaciones próximas (30 días)</h3>
      {prox.length === 0 ? <p className="text-sm text-slate-500">Nadie tiene vacaciones programadas.</p> : (
        <ul className="space-y-2">
          {prox.map((v) => { const c = db.colaboradores.find((x) => x.id === v.colaboradorId); return (
            <li key={v.id} className="flex flex-wrap items-center gap-3 text-sm">
              {c && <Avatar c={c} size={28} />}<span className="flex-1 truncate">{c ? nombreCompleto(c) : '—'}</span>
              <span className="text-slate-500">{fmtFecha(v.fechaInicio)} – {fmtFecha(v.fechaFin)}</span><Badge>{v.estatus}</Badge>
            </li>) })}
        </ul>
      )}
    </div>
  )
}
