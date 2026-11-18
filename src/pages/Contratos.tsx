import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Download, Pencil, Plus, Printer } from 'lucide-react'
import { useStore } from '../store/Store'
import { Badge, Empty, PageHeader, Select, StatCard, Table, confirmar } from '../components/ui'
import { ContratoForm, imprimirContrato } from '../components/Contratos'
import { descargarCSV, estadoContrato, fmtFecha, fmtMoney, nombreCompleto } from '../lib/utils'
import type { Contrato } from '../types'
import { FileCheck2, FileClock, FileX2 } from 'lucide-react'

export default function Contratos() {
  const { deEmpresa, db, guardarItem, empresa } = useStore()
  const [estado, setEstado] = useState('')
  const [form, setForm] = useState<{ k?: Contrato } | null>(null)
  const lista = deEmpresa('contratos')
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const filas = useMemo(() => lista.filter((k) => !estado || estadoContrato(k) === estado).sort((a, b) => (a.fechaFin ?? '9999').localeCompare(b.fechaFin ?? '9999')), [lista, estado])
  const cuenta = (e: string) => lista.filter((k) => estadoContrato(k) === e).length

  const exportar = () => descargarCSV(`contratos-${empresa.nombre}`, filas.map((k) => {
    const c = colMap.get(k.colaboradorId)
    return { Colaborador: c ? nombreCompleto(c) : '', Tipo: k.tipo, Puesto: k.puesto, 'Salario diario': k.salarioDiario, Inicio: k.fechaInicio, Término: k.fechaFin ?? 'Indefinido', Estado: estadoContrato(k) }
  }))

  return (
    <>
      <PageHeader title="Contratos" subtitle="Control de contratos laborales, vigencias y renovaciones"
        actions={<><button className="btn-secondary" onClick={exportar}><Download size={16} /> Exportar</button><button className="btn-primary" onClick={() => setForm({})}><Plus size={16} /> Nuevo contrato</button></>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<FileCheck2 size={20} />} value={cuenta('Vigente')} label="Vigentes" tono="green" onClick={() => setEstado('Vigente')} />
        <StatCard icon={<FileClock size={20} />} value={cuenta('Por vencer')} label="Vencen en 30 días o menos" tono="amber" onClick={() => setEstado('Por vencer')} />
        <StatCard icon={<FileX2 size={20} />} value={cuenta('Vencido')} label="Vencidos" tono="red" onClick={() => setEstado('Vencido')} />
      </div>
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-100 p-4">
          <Select className="sm:w-56" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option><option>Vigente</option><option>Por vencer</option><option>Vencido</option><option>Cancelado</option>
          </Select>
        </div>
        {filas.length === 0 ? <Empty title="Sin contratos" action={<button className="btn-primary" onClick={() => setForm({})}>Crear contrato</button>} /> : (
          <Table head={<><th className="th">Colaborador</th><th className="th">Tipo</th><th className="th hidden md:table-cell">Puesto</th><th className="th hidden lg:table-cell">Salario</th><th className="th">Vigencia</th><th className="th">Estado</th><th className="th" /></>}>
            {filas.map((k) => {
              const c = colMap.get(k.colaboradorId)
              return (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{c ? <Link to={`/colaboradores/${c.id}?tab=contratos`} className="hover:text-primary-600">{nombreCompleto(c)}</Link> : '—'}</td>
                  <td className="td">{k.tipo}</td><td className="td hidden md:table-cell">{k.puesto}</td>
                  <td className="td hidden lg:table-cell">{fmtMoney(k.salarioDiario)}</td>
                  <td className="td text-slate-500">{fmtFecha(k.fechaInicio)} – {k.fechaFin ? fmtFecha(k.fechaFin) : 'Indefinido'}</td>
                  <td className="td"><Badge>{estadoContrato(k)}</Badge></td>
                  <td className="td text-right">
                    <button className="btn-ghost" title="Imprimir" onClick={() => imprimirContrato(k, db)}><Printer size={16} /></button>
                    <button className="btn-ghost" title="Editar / renovar" onClick={() => setForm({ k })}><Pencil size={16} /></button>
                    {!k.cancelado && <button className="btn-ghost text-rose-600" title="Cancelar contrato" onClick={() => confirmar('¿Cancelar este contrato?') && guardarItem('contratos', { ...k, cancelado: true }, { colaboradorId: k.colaboradorId, accion: `Contrato ${k.tipo.toLowerCase()} cancelado` })}><Ban size={16} /></button>}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>
      {form && <ContratoForm open inicial={form.k} onClose={() => setForm(null)} />}
    </>
  )
}
