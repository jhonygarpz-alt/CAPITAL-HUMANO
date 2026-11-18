import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Download, FolderOpen, FileSignature, FileText, History, ChevronRight, Mail, Phone } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Input, PageHeader, Select, Table, cx } from '../components/ui'
import { ColaboradorForm } from '../components/ColaboradorForm'
import { antiguedadTexto, descargarCSV, fmtFecha, fmtMoney, nombreCompleto, normalizar } from '../lib/utils'
import type { Colaborador } from '../types'

export default function Colaboradores() {
  const { deEmpresa, empresa } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [depto, setDepto] = useState('')
  const [estatus, setEstatus] = useState('Activos')
  const [nuevo, setNuevo] = useState(false)
  const [sel, setSel] = useState<string>()

  const todos = deEmpresa('colaboradores')
  const lista = useMemo(() => {
    const t = normalizar(q)
    return todos
      .filter((c) => (estatus === 'Activos' ? c.estatus !== 'Baja' : estatus === 'Todos' ? true : c.estatus === estatus))
      .filter((c) => !depto || c.departamento === depto)
      .filter((c) => !t || normalizar(`${nombreCompleto(c)} ${c.numero} ${c.puesto} ${c.email} ${c.curp}`).includes(t))
      .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
  }, [todos, q, depto, estatus])

  const seleccionado = todos.find((c) => c.id === sel) ?? lista[0]

  const exportar = () =>
    descargarCSV(`colaboradores-${empresa.nombre}`, lista.map((c) => ({
      Número: c.numero, Nombre: nombreCompleto(c), Puesto: c.puesto, Departamento: c.departamento, Ingreso: c.fechaIngreso,
      'Salario diario': c.salarioDiario, CURP: c.curp, RFC: c.rfc, NSS: c.nss, Correo: c.email, Teléfono: c.telefono, Estatus: c.estatus,
    })))

  return (
    <>
      <PageHeader title="Colaboradores" subtitle={`${todos.filter((c) => c.estatus !== 'Baja').length} colaboradores activos en ${empresa.nombre}`}
        actions={<>
          <button className="btn-secondary" onClick={exportar}><Download size={16} /> Exportar</button>
          <button className="btn-primary" onClick={() => setNuevo(true)}><Plus size={16} /> Nuevo colaborador</button>
        </>} />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[1fr_180px_140px]">
            <Input placeholder="Buscar por nombre, número, puesto o CURP…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={depto} onChange={(e) => setDepto(e.target.value)}>
              <option value="">Todos los departamentos</option>
              {empresa.departamentos.map((d) => <option key={d}>{d}</option>)}
            </Select>
            <Select value={estatus} onChange={(e) => setEstatus(e.target.value)}>
              <option>Activos</option><option>Activo</option><option>Incapacidad</option><option>Baja</option><option>Todos</option>
            </Select>
          </div>
          {lista.length === 0 ? (
            <Empty title="No hay colaboradores" text="Ajusta los filtros o registra un nuevo colaborador." action={<button className="btn-primary" onClick={() => setNuevo(true)}><Plus size={16} /> Nuevo colaborador</button>} />
          ) : (
            <Table head={<><th className="th">Colaborador</th><th className="th">Puesto</th><th className="th hidden md:table-cell">Departamento</th><th className="th hidden lg:table-cell">Ingreso</th><th className="th">Estatus</th><th className="th" /></>}>
              {lista.map((c) => (
                <tr key={c.id} onClick={() => setSel(c.id)} onDoubleClick={() => nav(`/colaboradores/${c.id}`)}
                  className={cx('cursor-pointer transition hover:bg-slate-50', seleccionado?.id === c.id && 'bg-primary-50/50')}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar c={c} size={34} />
                      <div>
                        <div className="font-medium text-slate-900">{nombreCompleto(c)}</div>
                        <div className="text-xs text-slate-500">{c.numero}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">{c.puesto}</td>
                  <td className="td hidden md:table-cell">{c.departamento}</td>
                  <td className="td hidden text-slate-500 lg:table-cell">{fmtFecha(c.fechaIngreso)}</td>
                  <td className="td"><Badge>{c.estatus}</Badge></td>
                  <td className="td text-right">
                    <Link to={`/colaboradores/${c.id}`} className="btn-ghost" onClick={(e) => e.stopPropagation()} aria-label="Ver ficha"><ChevronRight size={16} /></Link>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {seleccionado && <PanelColaborador c={seleccionado} />}
      </div>
      {nuevo && <ColaboradorForm open onClose={() => setNuevo(false)} onSaved={(c) => setSel(c.id)} />}
    </>
  )
}

export function PanelColaborador({ c }: { c: Colaborador }) {
  const links = [
    { tab: 'expediente', label: 'Expediente', icon: FolderOpen },
    { tab: 'contratos', label: 'Contratos', icon: FileSignature },
    { tab: 'documentos', label: 'Documentos', icon: FileText },
    { tab: 'historial', label: 'Historial', icon: History },
  ]
  return (
    <aside className="card h-fit p-5 xl:sticky xl:top-24">
      <div className="flex flex-col items-center text-center">
        <Avatar c={c} size={88} />
        <h3 className="mt-3 font-semibold text-slate-900">{nombreCompleto(c)}</h3>
        <p className="text-xs text-slate-500">{c.numero}</p>
        <p className="mt-1 text-sm text-slate-600">{c.puesto}</p>
        <div className="mt-2"><Badge>{c.estatus}</Badge></div>
      </div>
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Departamento</dt><dd className="text-right font-medium">{c.departamento}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Antigüedad</dt><dd className="font-medium">{antiguedadTexto(c.fechaIngreso)}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Salario diario</dt><dd className="font-medium">{fmtMoney(c.salarioDiario)}</dd></div>
        {c.email && <div className="flex items-center gap-2 pt-1 text-slate-600"><Mail size={14} className="shrink-0" /><span className="truncate">{c.email}</span></div>}
        {c.telefono && <div className="flex items-center gap-2 text-slate-600"><Phone size={14} /> {c.telefono}</div>}
      </dl>
      <div className="mt-5 space-y-1 border-t border-slate-100 pt-4">
        {links.map(({ tab, label, icon: Icon }) => (
          <Link key={tab} to={`/colaboradores/${c.id}?tab=${tab}`} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary-50 hover:text-primary-700">
            <Icon size={16} /> {label} <ChevronRight size={14} className="ml-auto opacity-50" />
          </Link>
        ))}
      </div>
      <Link to={`/colaboradores/${c.id}`} className="btn-primary mt-4 w-full">Ver ficha completa</Link>
    </aside>
  )
}
