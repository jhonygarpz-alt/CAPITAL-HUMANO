import { useState, type FormEvent } from 'react'
import { Briefcase, Minus, Pencil, Plus, Trash2, UserCheck, Users } from 'lucide-react'
import { useStore } from '../store/Store'
import { Badge, Empty, Field, Input, Modal, PageHeader, Select, StatCard, Table, Textarea, confirmar } from '../components/ui'
import { diffDays, fmtFecha, fmtMoney, hoy, uid } from '../lib/utils'
import type { Vacante } from '../types'

const ESTATUS: Vacante['estatus'][] = ['Abierta', 'En proceso', 'Cubierta', 'Cancelada']

export default function Vacantes() {
  const { deEmpresa, guardarItem, eliminarItem } = useStore()
  const [form, setForm] = useState<{ v?: Vacante } | null>(null)
  const [estatus, setEstatus] = useState('activas')
  const lista = deEmpresa('vacantes')
  const activas = lista.filter((v) => v.estatus === 'Abierta' || v.estatus === 'En proceso')
  const filas = lista
    .filter((v) => (estatus === 'activas' ? activas.includes(v) : !estatus || v.estatus === estatus))
    .sort((a, b) => a.fechaApertura.localeCompare(b.fechaApertura))

  const candidatos = (v: Vacante, delta: number) => guardarItem('vacantes', { ...v, candidatos: Math.max(0, v.candidatos + delta) })

  return (
    <>
      <PageHeader title="Vacantes" subtitle="Posiciones abiertas y avance del reclutamiento"
        actions={<button className="btn-primary" onClick={() => setForm({})}><Plus size={16} /> Nueva vacante</button>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Briefcase size={22} />} value={activas.reduce((s, v) => s + v.posiciones, 0)} label="Posiciones por cubrir" />
        <StatCard icon={<Users size={22} />} value={activas.reduce((s, v) => s + v.candidatos, 0)} label="Candidatos en proceso" tono="blue" />
        <StatCard icon={<UserCheck size={22} />} value={lista.filter((v) => v.estatus === 'Cubierta').length} label="Vacantes cubiertas" tono="green" />
      </div>
      <div className="card-glow overflow-hidden">
        <div className="border-b border-primary-100 p-4">
          <Select className="sm:w-56" value={estatus} onChange={(e) => setEstatus(e.target.value)}>
            <option value="activas">Abiertas y en proceso</option>
            {ESTATUS.map((s) => <option key={s}>{s}</option>)}
            <option value="">Todas</option>
          </Select>
        </div>
        {filas.length === 0 ? <Empty title="Sin vacantes" text="Registra las posiciones que necesitas cubrir." action={<button className="btn-primary" onClick={() => setForm({})}><Plus size={16} /> Nueva vacante</button>} /> : (
          <Table head={<><th className="th">Puesto</th><th className="th hidden md:table-cell">Departamento</th><th className="th">Posiciones</th><th className="th">Candidatos</th><th className="th hidden lg:table-cell">Salario diario</th><th className="th hidden lg:table-cell">Abierta</th><th className="th">Estatus</th><th className="th" /></>}>
            {filas.map((v) => (
              <tr key={v.id} className="hover:bg-accent-50">
                <td className="td font-semibold text-slate-900">{v.puesto}</td>
                <td className="td hidden md:table-cell">{v.departamento}</td>
                <td className="td">{v.posiciones}</td>
                <td className="td">
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost px-1.5 py-1" onClick={() => candidatos(v, -1)} aria-label="Quitar candidato"><Minus size={14} /></button>
                    <span className="w-6 text-center font-medium">{v.candidatos}</span>
                    <button className="btn-ghost px-1.5 py-1" onClick={() => candidatos(v, 1)} aria-label="Agregar candidato"><Plus size={14} /></button>
                  </div>
                </td>
                <td className="td hidden lg:table-cell">{v.salarioOfrecido ? fmtMoney(v.salarioOfrecido) : '—'}</td>
                <td className="td hidden text-slate-500 lg:table-cell">{fmtFecha(v.fechaApertura)} · {diffDays(v.fechaApertura, hoy())} días</td>
                <td className="td"><Badge>{v.estatus}</Badge></td>
                <td className="td text-right">
                  <button className="btn-ghost" title="Editar" onClick={() => setForm({ v })}><Pencil size={16} /></button>
                  <button className="btn-ghost text-rose-600" title="Eliminar" onClick={() => confirmar('¿Eliminar esta vacante?') && eliminarItem('vacantes', v.id, { accion: `Vacante "${v.puesto}" eliminada` })}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      {form && <VacanteForm inicial={form.v} onClose={() => setForm(null)} />}
    </>
  )
}

function VacanteForm({ inicial, onClose }: { inicial?: Vacante; onClose: () => void }) {
  const { empresa, guardarItem } = useStore()
  const [v, setV] = useState<Vacante>(inicial ?? { id: uid(), empresaId: empresa.id, puesto: '', departamento: empresa.departamentos[0] ?? '', posiciones: 1, salarioOfrecido: 0, fechaApertura: hoy(), responsable: '', descripcion: '', estatus: 'Abierta', candidatos: 0 })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    guardarItem('vacantes', v, { accion: `${inicial ? 'Actualización de' : 'Nueva'} vacante: ${v.puesto} (${v.posiciones})` })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={inicial ? 'Editar vacante' : 'Nueva vacante'}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-vacante" className="btn-primary">Guardar</button></>}>
      <form id="form-vacante" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Puesto *" className="sm:col-span-2"><Input required value={v.puesto} onChange={(e) => setV({ ...v, puesto: e.target.value })} /></Field>
        <Field label="Departamento"><Select value={v.departamento} onChange={(e) => setV({ ...v, departamento: e.target.value })}>{Array.from(new Set([...empresa.departamentos, v.departamento].filter(Boolean))).map((d) => <option key={d}>{d}</option>)}</Select></Field>
        <Field label="Posiciones"><Input type="number" min={1} value={v.posiciones} onChange={(e) => setV({ ...v, posiciones: Number(e.target.value) })} /></Field>
        <Field label="Salario diario ofrecido"><Input type="number" min={0} step="0.01" value={v.salarioOfrecido || ''} onChange={(e) => setV({ ...v, salarioOfrecido: Number(e.target.value) })} /></Field>
        <Field label="Fecha de apertura"><Input type="date" value={v.fechaApertura} onChange={(e) => setV({ ...v, fechaApertura: e.target.value })} /></Field>
        <Field label="Responsable"><Input value={v.responsable} onChange={(e) => setV({ ...v, responsable: e.target.value })} /></Field>
        <Field label="Estatus"><Select value={v.estatus} onChange={(e) => setV({ ...v, estatus: e.target.value as Vacante['estatus'] })}>{ESTATUS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Perfil / descripción" className="sm:col-span-2"><Textarea value={v.descripcion} onChange={(e) => setV({ ...v, descripcion: e.target.value })} /></Field>
      </form>
    </Modal>
  )
}
