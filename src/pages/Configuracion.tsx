import { useState, type FormEvent } from 'react'
import { Building2, Download, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import { useStore } from '../store/Store'
import { Field, Input, Modal, PageHeader, Select, confirmar } from '../components/ui'
import type { DB, Empresa } from '../types'
import { descargarArchivo, hoy, uid } from '../lib/utils'
import { crearDBDemo, crearDBVacia } from '../store/seed'

export default function Configuracion() {
  const { db, empresa, setEmpresa, eliminarItem, reemplazarDB } = useStore()
  const [edit, setEdit] = useState<Empresa | null>(null)

  const nueva = (): Empresa => ({ id: uid(), nombre: '', razonSocial: '', rfc: '', registroPatronal: '', direccion: '', color: '#5b2ff5', departamentos: ['Recursos Humanos', 'Administración'], periodicidadNomina: 'Quincenal' })
  const borrar = (e: Empresa) => {
    if (db.empresas.length === 1) return alert('Debe existir al menos una empresa.')
    const n = db.colaboradores.filter((c) => c.empresaId === e.id).length
    if (!confirmar(`¿Eliminar ${e.nombre}${n ? ` y sus ${n} colaboradores con toda su información` : ''}? Esta acción no se puede deshacer.`)) return
    if (e.id === empresa.id) setEmpresa(db.empresas.find((x) => x.id !== e.id)!.id)
    eliminarItem('empresas', e.id)
  }
  const respaldar = () => descargarArchivo(`respaldo-rh-${hoy()}.json`, JSON.stringify(db), 'application/json')
  const restaurar = async (f?: File) => {
    if (!f) return
    try {
      const data = JSON.parse(await f.text()) as DB
      if (!Array.isArray(data.empresas) || !Array.isArray(data.colaboradores)) throw new Error()
      if (confirmar('Se reemplazará toda la información actual por la del respaldo. ¿Continuar?')) reemplazarDB(data)
    } catch { alert('El archivo no es un respaldo válido.') }
  }

  return (
    <>
      <PageHeader title="Configuración" subtitle="Empresas, departamentos y respaldo de información" />
      <div className="space-y-6">
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-semibold">Empresas</h2><p className="text-sm text-slate-500">Administra todas las empresas desde un solo sistema. Cada una tiene su propio personal, nómina y expedientes.</p></div>
            <button className="btn-primary" onClick={() => setEdit(nueva())}><Plus size={16} /> Nueva empresa</button>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {db.empresas.map((e) => {
              const n = db.colaboradores.filter((c) => c.empresaId === e.id && c.estatus !== 'Baja').length
              return (
                <div key={e.id} className={`rounded-2xl border p-4 ${e.id === empresa.id ? 'border-primary-300 ring-4 ring-primary-50' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: e.color }}><Building2 size={18} /></div>
                    <div className="min-w-0 flex-1"><div className="font-semibold">{e.nombre}</div><div className="truncate text-xs text-slate-500">{e.razonSocial || 'Sin razón social'}</div></div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">RFC {e.rfc || '—'} · {n} colaboradores · Nómina {e.periodicidadNomina.toLowerCase()}</div>
                  <div className="mt-1 text-xs text-slate-500">{e.departamentos.length} departamentos</div>
                  <div className="mt-4 flex gap-2">
                    {e.id !== empresa.id && <button className="btn-secondary py-1.5" onClick={() => setEmpresa(e.id)}>Usar</button>}
                    <button className="btn-secondary py-1.5" onClick={() => setEdit(e)}>Editar</button>
                    <button className="btn-ghost ml-auto text-rose-600" onClick={() => borrar(e)} aria-label="Eliminar"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Respaldo de información</h2>
          <p className="mb-4 text-sm text-slate-500">La información se guarda en este navegador. Descarga respaldos periódicamente para no perder datos o para pasarlos a otra computadora.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={respaldar}><Download size={16} /> Descargar respaldo</button>
            <label className="btn-secondary cursor-pointer"><Upload size={16} /> Restaurar respaldo<input type="file" accept="application/json" className="hidden" onChange={(e) => restaurar(e.target.files?.[0])} /></label>
            <button className="btn-secondary" onClick={() => confirmar('¿Cargar los datos de demostración? Se reemplazará la información actual.') && reemplazarDB(crearDBDemo())}><RotateCcw size={16} /> Cargar datos de demostración</button>
            <button className="btn-ghost text-rose-600" onClick={() => confirmar('¿Borrar TODA la información y empezar desde cero? Descarga un respaldo antes.') && reemplazarDB(crearDBVacia())}><Trash2 size={16} /> Empezar desde cero</button>
          </div>
        </section>
      </div>
      {edit && <EmpresaForm e={edit} onClose={() => setEdit(null)} />}
    </>
  )
}

function EmpresaForm({ e: inicial, onClose }: { e: Empresa; onClose: () => void }) {
  const { guardarItem, db, setEmpresa } = useStore()
  const [e, setE] = useState(inicial)
  const [depto, setDepto] = useState('')
  const esNueva = !db.empresas.some((x) => x.id === e.id)
  const txt = (k: keyof Empresa, upper = false) => ({ value: e[k] as string, onChange: (ev: { target: { value: string } }) => setE({ ...e, [k]: upper ? ev.target.value.toUpperCase() : ev.target.value }) })
  const agregar = () => { const d = depto.trim(); if (d && !e.departamentos.includes(d)) setE({ ...e, departamentos: [...e.departamentos, d] }); setDepto('') }
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    guardarItem('empresas', e, { accion: `${esNueva ? 'Alta' : 'Actualización'} de la empresa ${e.nombre}` })
    if (esNueva) setEmpresa(e.id)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={esNueva ? 'Nueva empresa' : `Editar ${inicial.nombre}`} wide
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-emp" className="btn-primary">Guardar</button></>}>
      <form id="form-emp" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre comercial *"><Input required {...txt('nombre')} /></Field>
        <Field label="Razón social"><Input {...txt('razonSocial')} /></Field>
        <Field label="RFC"><Input maxLength={13} {...txt('rfc', true)} /></Field>
        <Field label="Registro patronal IMSS"><Input {...txt('registroPatronal', true)} /></Field>
        <Field label="Domicilio fiscal" className="sm:col-span-2"><Input {...txt('direccion')} /></Field>
        <Field label="Periodicidad de nómina">
          <Select value={e.periodicidadNomina} onChange={(ev) => setE({ ...e, periodicidadNomina: ev.target.value as Empresa['periodicidadNomina'] })}><option>Semanal</option><option>Quincenal</option><option>Mensual</option></Select>
        </Field>
        <Field label="Color identificador"><Input type="color" className="h-10 p-1" value={e.color} onChange={(ev) => setE({ ...e, color: ev.target.value })} /></Field>
        <div className="sm:col-span-2">
          <span className="label">Departamentos</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {e.departamentos.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700">{d}
                <button type="button" onClick={() => setE({ ...e, departamentos: e.departamentos.filter((x) => x !== d) })} aria-label={`Quitar ${d}`}><X size={14} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Nuevo departamento" value={depto} onChange={(ev) => setDepto(ev.target.value)} onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); agregar() } }} />
            <button type="button" className="btn-secondary" onClick={agregar}><Plus size={16} /> Agregar</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
