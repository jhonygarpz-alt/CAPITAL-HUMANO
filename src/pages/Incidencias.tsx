import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Input, PageHeader, Select, Table, confirmar } from '../components/ui'
import { IncidenciaForm, cantidadTexto } from '../components/Incidencias'
import { fmtFecha, nombreCompleto } from '../lib/utils'
import { TIPOS_INCIDENCIA, type Incidencia } from '../types'

export default function Incidencias() {
  const { deEmpresa, db, guardarItem, eliminarItem } = useStore()
  const [form, setForm] = useState<{ i?: Incidencia } | null>(null)
  const [tipo, setTipo] = useState('')
  const [estatus, setEstatus] = useState('')
  const [desde, setDesde] = useState('')
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const filas = deEmpresa('incidencias').filter((i) => (!tipo || i.tipo === tipo) && (!estatus || i.estatus === estatus) && (!desde || i.fecha >= desde)).sort((a, b) => b.fecha.localeCompare(a.fecha))
  return (
    <>
      <PageHeader title="Incidencias" subtitle="Faltas, retardos, incapacidades, permisos, horas extra, bonos y descuentos"
        actions={<button className="btn-primary" onClick={() => setForm({})}><Plus size={16} /> Registrar incidencia</button>} />
      <div className="card overflow-hidden">
        <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-3">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos los tipos</option>{TIPOS_INCIDENCIA.map((t) => <option key={t}>{t}</option>)}</Select>
          <Select value={estatus} onChange={(e) => setEstatus(e.target.value)}><option value="">Todos los estatus</option><option>Pendiente</option><option>Aplicada</option></Select>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} title="Desde" />
        </div>
        {filas.length === 0 ? <Empty title="Sin incidencias" /> : (
          <Table head={<><th className="th">Colaborador</th><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Cantidad</th><th className="th hidden lg:table-cell">Descripción</th><th className="th">Estatus</th><th className="th" /></>}>
            {filas.map((i) => { const c = colMap.get(i.colaboradorId); return (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="td">{c && <Link to={`/colaboradores/${c.id}?tab=incidencias`} className="flex items-center gap-3 font-medium hover:text-primary-600"><Avatar c={c} size={30} />{nombreCompleto(c)}</Link>}</td>
                <td className="td">{fmtFecha(i.fecha)}</td><td className="td">{i.tipo}</td><td className="td">{cantidadTexto(i)}</td>
                <td className="td hidden max-w-xs truncate text-slate-500 lg:table-cell">{i.descripcion}</td>
                <td className="td"><Badge>{i.estatus}</Badge></td>
                <td className="td text-right">
                  {i.estatus === 'Pendiente' && <button className="btn-ghost text-emerald-600" title="Marcar como aplicada" onClick={() => guardarItem('incidencias', { ...i, estatus: 'Aplicada' })}><CheckCheck size={16} /></button>}
                  <button className="btn-ghost" title="Editar" onClick={() => setForm({ i })}><Pencil size={16} /></button>
                  <button className="btn-ghost text-rose-600" title="Eliminar" onClick={() => confirmar('¿Eliminar la incidencia?') && eliminarItem('incidencias', i.id, { colaboradorId: i.colaboradorId, accion: `Incidencia "${i.tipo}" eliminada` })}><Trash2 size={16} /></button>
                </td>
              </tr>) })}
          </Table>
        )}
      </div>
      {form && <IncidenciaForm open inicial={form.i} onClose={() => setForm(null)} />}
    </>
  )
}
