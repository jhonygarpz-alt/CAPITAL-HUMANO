import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellRing, Building2, DatabaseBackup, Download, Gift, Plus, RotateCcw, Trash2, Upload, Users, X } from 'lucide-react'
import { useStore } from '../store/Store'
import { Field, Input, Modal, PageHeader, Seccion, Select, Tabs, confirmar } from '../components/ui'
import type { DB, Empresa } from '../types'
import { descargarArchivo, hoy, uid } from '../lib/utils'
import { crearDBDemo, crearDBVacia } from '../store/seed'
import UsuariosPermisos from './config/UsuariosPermisos'
import NotificacionesConfig from './config/NotificacionesConfig'
import PrimaConfig from './config/PrimaConfig'
import { ConfigAguinaldoPanel } from './Aguinaldos'

type Tab = 'empresas' | 'usuarios' | 'notificaciones' | 'prestaciones' | 'respaldo'

export default function Configuracion() {
  const [sp, setSp] = useSearchParams()
  const { usuario } = useStore()
  const tab = (sp.get('tab') as Tab) || 'empresas'
  const [sub, setSub] = useState<'prima' | 'aguinaldo'>('prima')
  return (
    <>
      <PageHeader title="Configuración" subtitle="Empresas, usuarios y permisos, notificaciones, prestaciones y respaldo" />
      <Tabs<Tab> value={tab} onChange={(t) => setSp({ tab: t }, { replace: true })} tabs={[
        { id: 'empresas', label: 'Empresas', icon: Building2 },
        { id: 'usuarios', label: 'Usuarios y permisos', icon: Users },
        { id: 'notificaciones', label: 'Notificaciones', icon: BellRing },
        { id: 'prestaciones', label: 'Prestaciones', icon: Gift },
        ...(usuario.rol === 'admin' ? [{ id: 'respaldo' as Tab, label: 'Respaldo', icon: DatabaseBackup }] : []),
      ]} />
      <div className="mt-6">
        {tab === 'empresas' && <Empresas />}
        {tab === 'usuarios' && <UsuariosPermisos />}
        {tab === 'notificaciones' && <NotificacionesConfig />}
        {tab === 'prestaciones' && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <button className={sub === 'prima' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSub('prima')}>Prima vacacional</button>
              <button className={sub === 'aguinaldo' ? 'btn-primary' : 'btn-secondary'} onClick={() => setSub('aguinaldo')}>Aguinaldo</button>
            </div>
            {sub === 'prima' ? <PrimaConfig /> : <ConfigAguinaldoPanel />}
            <p className="text-xs text-slate-500">Las prestaciones se configuran por empresa. Empresa actual: elige otra en el selector del encabezado para configurarla.</p>
          </div>
        )}
        {tab === 'respaldo' && usuario.rol === 'admin' && <Respaldo />}
      </div>
    </>
  )
}

function Empresas() {
  const { db, empresa, setEmpresa, eliminarItem, puede } = useStore()
  const [edit, setEdit] = useState<Empresa | null>(null)
  const editable = puede('configuracion', 'editar')
  const nueva = (): Empresa => ({ id: uid(), nombre: '', razonSocial: '', rfc: '', registroPatronal: '', direccion: '', color: '#064467', departamentos: ['Recursos Humanos', 'Administración'], periodicidadNomina: 'Quincenal' })
  const borrar = (e: Empresa) => {
    if (db.empresas.length === 1) return alert('Debe existir al menos una empresa.')
    const n = db.colaboradores.filter((c) => c.empresaId === e.id).length
    if (!confirmar(`¿Eliminar ${e.nombre}${n ? ` y sus ${n} colaboradores con toda su información` : ''}? Esta acción no se puede deshacer.`)) return
    if (e.id === empresa.id) setEmpresa(db.empresas.find((x) => x.id !== e.id)!.id)
    eliminarItem('empresas', e.id)
  }
  return (
    <Seccion titulo="Empresas" icon={Building2} acciones={editable && <button className="btn border border-accent-600 bg-accent-500 py-1.5 text-sm text-primary-900 hover:bg-accent-400" onClick={() => setEdit(nueva())}><Plus size={16} /> Nueva empresa</button>}>
      <p className="px-5 pt-4 text-sm text-slate-600">Administra todas las empresas desde un solo sistema. Cada una tiene su propio personal, nómina, expedientes y prestaciones.</p>
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {db.empresas.map((e) => {
          const n = db.colaboradores.filter((c) => c.empresaId === e.id && c.estatus !== 'Baja').length
          return (
            <div key={e.id} className={`rounded-xl border-2 p-4 ${e.id === empresa.id ? 'border-accent-500 bg-accent-50/40' : 'border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{ background: e.color }}><Building2 size={18} /></div>
                <div className="min-w-0 flex-1"><div className="font-bold text-primary-800">{e.nombre}</div><div className="truncate text-xs text-slate-500">{e.razonSocial || 'Sin razón social'}</div></div>
              </div>
              <div className="mt-3 text-xs text-slate-600">RFC {e.rfc || '—'} · {n} colaboradores · Nómina {e.periodicidadNomina.toLowerCase()}</div>
              <div className="mt-1 text-xs text-slate-600">{e.departamentos.length} departamentos{e.firmanteNombre ? ` · Firma: ${e.firmanteNombre}` : ''}</div>
              <div className="mt-4 flex gap-2">
                {e.id !== empresa.id && <button className="btn-secondary py-1.5" onClick={() => setEmpresa(e.id)}>Usar</button>}
                {editable && <button className="btn-secondary py-1.5" onClick={() => setEdit(e)}>Editar</button>}
                {editable && <button className="btn-ghost ml-auto text-rose-600" onClick={() => borrar(e)} aria-label="Eliminar"><Trash2 size={16} /></button>}
              </div>
            </div>
          )
        })}
      </div>
      {edit && <EmpresaForm e={edit} onClose={() => setEdit(null)} />}
    </Seccion>
  )
}

function Respaldo() {
  const { db, reemplazarDB } = useStore()
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
    <Seccion titulo="Respaldo de información" icon={DatabaseBackup}>
      <div className="p-5">
        <p className="mb-4 text-sm text-slate-600">La información se guarda en la nube (Supabase) y está disponible desde cualquier computadora o celular. Además puedes descargar una copia de seguridad en un archivo.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={respaldar}><Download size={16} /> Descargar respaldo</button>
          <label className="btn-secondary cursor-pointer"><Upload size={16} /> Restaurar respaldo<input type="file" accept="application/json" className="hidden" onChange={(e) => restaurar(e.target.files?.[0])} /></label>
          <button className="btn-secondary" onClick={() => confirmar('¿Cargar los datos de demostración? Se reemplazará TODA la información actual para todos los usuarios.') && reemplazarDB(crearDBDemo())}><RotateCcw size={16} /> Cargar datos de demostración</button>
          <button className="btn-ghost text-rose-600" onClick={() => confirmar('¿Borrar TODA la información y empezar desde cero? Descarga un respaldo antes.') && reemplazarDB(crearDBVacia())}><Trash2 size={16} /> Empezar desde cero</button>
        </div>
      </div>
    </Seccion>
  )
}

function EmpresaForm({ e: inicial, onClose }: { e: Empresa; onClose: () => void }) {
  const { guardarItem, db, setEmpresa } = useStore()
  const [e, setE] = useState(inicial)
  const [depto, setDepto] = useState('')
  const esNueva = !db.empresas.some((x) => x.id === e.id)
  const txt = (k: keyof Empresa, upper = false) => ({ value: (e[k] as string) ?? '', onChange: (ev: { target: { value: string } }) => setE({ ...e, [k]: upper ? ev.target.value.toUpperCase() : ev.target.value }) })
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
        <Field label="Domicilio fiscal" className="sm:col-span-2" hint="La ciudad (última parte) se usa como lugar de emisión de las constancias"><Input {...txt('direccion')} placeholder="Calle y número, Colonia, Ciudad, Estado" /></Field>
        <Field label="Teléfono de RH"><Input {...txt('telefono')} /></Field>
        <div />
        <Field label="Firma de constancias (nombre)"><Input {...txt('firmanteNombre')} placeholder="Lic. Nombre Apellido" /></Field>
        <Field label="Cargo de quien firma"><Input {...txt('firmantePuesto')} placeholder="Gerente de Recursos Humanos" /></Field>
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
