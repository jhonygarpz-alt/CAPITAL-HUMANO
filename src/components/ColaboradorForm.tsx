import { useState, type FormEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import type { Colaborador } from '../types'
import { useStore } from '../store/Store'
import { hoy, nombreCompleto, redimensionarImagen, uid } from '../lib/utils'
import { Avatar, Field, Input, Modal, Select } from './ui'

export function nuevoNumero(lista: Colaborador[]) {
  const max = lista.reduce((m, c) => Math.max(m, Number(c.numero.replace(/\D/g, '')) || 0), 0)
  return `EMP-${String(max + 1).padStart(6, '0')}`
}

export function ColaboradorForm({ open, onClose, inicial, onSaved }: { open: boolean; onClose: () => void; inicial?: Colaborador; onSaved?: (c: Colaborador) => void }) {
  const { db, empresa, guardarItem } = useStore()
  const [c, setC] = useState<Colaborador>(
    () =>
      inicial ?? {
        id: uid(), empresaId: empresa.id, numero: nuevoNumero(db.colaboradores),
        nombre: '', apellidoPaterno: '', apellidoMaterno: '', email: '', telefono: '', fechaNacimiento: '', genero: 'Femenino',
        curp: '', rfc: '', nss: '', direccion: '', puesto: '', departamento: empresa.departamentos[0] ?? '', fechaIngreso: hoy(),
        salarioDiario: 0, banco: '', cuenta: '', contactoEmergencia: '', telefonoEmergencia: '', estatus: 'Activo',
      },
  )
  const set = <K extends keyof Colaborador>(k: K, v: Colaborador[K]) => setC((p) => ({ ...p, [k]: v }))
  const txt = (k: keyof Colaborador, upper = false) => ({
    value: (c[k] as string) ?? '',
    onChange: (e: { target: { value: string } }) => set(k, (upper ? e.target.value.toUpperCase() : e.target.value) as never),
  })

  const subirFoto = async (f?: File) => {
    if (!f) return
    set('foto', await redimensionarImagen(f))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    guardarItem('colaboradores', c, { colaboradorId: c.id, accion: inicial ? `Actualización de datos de ${nombreCompleto(c)}` : `Alta de ${nombreCompleto(c)} como ${c.puesto}` })
    onSaved?.(c)
    onClose()
  }

  const deptos = Array.from(new Set([...empresa.departamentos, c.departamento].filter(Boolean)))

  return (
    <Modal open={open} onClose={onClose} title={inicial ? 'Editar colaborador' : 'Nuevo colaborador'} wide
      footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-colab" className="btn-primary">Guardar</button></>}>
      <form id="form-colab" onSubmit={submit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar c={c.nombre ? c : { ...c, nombre: '?', apellidoPaterno: '' }} size={76} />
          <div className="space-y-2">
            <label className="btn-secondary cursor-pointer">
              <Camera size={16} /> {c.foto ? 'Cambiar fotografía' : 'Subir fotografía'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => subirFoto(e.target.files?.[0])} />
            </label>
            {c.foto && <button type="button" className="btn-ghost text-rose-600" onClick={() => set('foto', undefined)}><Trash2 size={14} /> Quitar</button>}
            <p className="text-xs text-slate-400">Número de empleado: <b className="text-slate-600">{c.numero}</b></p>
          </div>
        </div>

        <Seccion titulo="Datos personales">
          <Field label="Nombre(s) *"><Input required {...txt('nombre')} /></Field>
          <Field label="Apellido paterno *"><Input required {...txt('apellidoPaterno')} /></Field>
          <Field label="Apellido materno"><Input {...txt('apellidoMaterno')} /></Field>
          <Field label="Fecha de nacimiento"><Input type="date" {...txt('fechaNacimiento')} /></Field>
          <Field label="Género">
            <Select value={c.genero} onChange={(e) => set('genero', e.target.value as Colaborador['genero'])}>
              <option>Femenino</option><option>Masculino</option><option>Otro</option>
            </Select>
          </Field>
          <Field label="CURP"><Input maxLength={18} {...txt('curp', true)} /></Field>
          <Field label="RFC"><Input maxLength={13} {...txt('rfc', true)} /></Field>
          <Field label="NSS (IMSS)"><Input maxLength={11} {...txt('nss')} /></Field>
          <Field label="Teléfono"><Input {...txt('telefono')} /></Field>
          <Field label="Correo electrónico" className="sm:col-span-2"><Input type="email" {...txt('email')} /></Field>
          <Field label="Domicilio" className="sm:col-span-3"><Input {...txt('direccion')} /></Field>
        </Seccion>

        <Seccion titulo="Datos laborales">
          <Field label="Puesto *"><Input required {...txt('puesto')} /></Field>
          <Field label="Departamento">
            <Select value={c.departamento} onChange={(e) => set('departamento', e.target.value)}>
              {deptos.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Fecha de ingreso *"><Input type="date" required {...txt('fechaIngreso')} /></Field>
          <Field label="Salario diario *" hint={c.salarioDiario ? `≈ ${(c.salarioDiario * 30.4).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} mensuales` : undefined}>
            <Input type="number" min={0} step="0.01" required value={c.salarioDiario || ''} onChange={(e) => set('salarioDiario', Number(e.target.value))} />
          </Field>
          <Field label="Estatus">
            <Select value={c.estatus} onChange={(e) => set('estatus', e.target.value as Colaborador['estatus'])}>
              <option>Activo</option><option>Incapacidad</option><option>Baja</option>
            </Select>
          </Field>
          {c.estatus === 'Baja' && (
            <>
              <Field label="Fecha de baja"><Input type="date" {...txt('fechaBaja')} /></Field>
              <Field label="Motivo de baja" className="sm:col-span-3">
                <Select {...txt('motivoBaja')}>
                  <option value="">Selecciona…</option>
                  <option>Renuncia voluntaria</option><option>Despido</option><option>Término de contrato</option><option>Abandono de empleo</option><option>Jubilación</option><option>Otro</option>
                </Select>
              </Field>
            </>
          )}
        </Seccion>

        <Seccion titulo="Pago y emergencia">
          <Field label="Banco"><Input {...txt('banco')} /></Field>
          <Field label="Cuenta / CLABE" className="sm:col-span-2"><Input {...txt('cuenta')} /></Field>
          <Field label="Contacto de emergencia" className="sm:col-span-2"><Input {...txt('contactoEmergencia')} /></Field>
          <Field label="Teléfono de emergencia"><Input {...txt('telefonoEmergencia')} /></Field>
        </Seccion>
      </form>
    </Modal>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">{titulo}</legend>
      <div className="grid gap-3 sm:grid-cols-3">{children}</div>
    </fieldset>
  )
}
