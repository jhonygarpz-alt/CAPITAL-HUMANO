import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Copy, KeyRound, Mail, Plus, RefreshCw, Shield, ShieldCheck, Trash2, UserCheck, UserPlus, UserX, Users, X } from 'lucide-react'
import { useStore } from '../../store/Store'
import { supabase } from '../../lib/supabase'
import { MODULOS, NIVEL_TEXTO, permisosDe, type Nivel, type Rol } from '../../lib/permisos'
import { Badge, Empty, Field, Input, Modal, Seccion, Select, StatCard, Table, Textarea, confirmar, cx } from '../../components/ui'
import { fmtFecha } from '../../lib/utils'

interface Usuario { user_id: string; email: string; nombre: string | null; rol: string; activo: boolean; created_at?: string; ultimo_acceso?: string | null }

/** Llama a la función segura del servidor que administra cuentas. */
async function funcionUsuarios<T = { ok: boolean }>(body: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('rh-usuarios', { body })
  if (error) {
    let msg = error.message
    try { const j = await (error as { context?: Response }).context?.json(); if (j?.error) msg = j.error } catch { /* sin detalle */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

export function generarContrasena() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const r = crypto.getRandomValues(new Uint32Array(12))
  const s = Array.from(r, (n) => a[n % a.length]).join('')
  return `Rh-${s.slice(0, 6)}-${s.slice(6)}`
}

const COLOR_NIVEL: Record<Nivel, string> = {
  editar: 'bg-accent-100 text-accent-800 border-accent-300',
  ver: 'bg-primary-50 text-primary-700 border-primary-200',
  ninguno: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function UsuariosPermisos() {
  const { usuario, refrescarPermisos } = useStore()
  const esAdmin = usuario.rol === 'admin'
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [invitaciones, setInvitaciones] = useState<{ email: string; rol: string }[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [rolEdit, setRolEdit] = useState<Rol | 'nuevo' | null>(null)
  const [reset, setReset] = useState<Usuario | null>(null)
  const [invitar, setInvitar] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true); setError('')
    try {
      const { data: rs } = await supabase.from('rh_roles').select('id,nombre,descripcion,permisos,sistema').order('created_at')
      setRoles((rs as Rol[]) ?? [])
      if (esAdmin) {
        const r = await funcionUsuarios<{ usuarios: Usuario[] }>({ accion: 'listar' })
        setUsuarios(r.usuarios)
        const { data: inv } = await supabase.from('rh_invitaciones').select('email,rol').order('created_at')
        setInvitaciones(inv ?? [])
      } else {
        const { data } = await supabase.from('rh_miembros').select('user_id,email,nombre,rol,activo,created_at').order('created_at')
        setUsuarios((data as Usuario[]) ?? [])
      }
    } catch (e) { setError((e as Error).message) }
    setCargando(false)
  }, [esAdmin])
  useEffect(() => { cargar() }, [cargar])

  const rolNombre = (id: string) => roles.find((r) => r.id === id)?.nombre ?? id
  const activos = usuarios.filter((u) => u.activo).length

  const actualizarMiembro = async (u: Usuario, cambios: Partial<Usuario>) => {
    const { error: e } = await supabase.from('rh_miembros').update(cambios).eq('user_id', u.user_id)
    if (e) return alert(e.message)
    setUsuarios((l) => l.map((x) => (x.user_id === u.user_id ? { ...x, ...cambios } : x)))
  }
  const eliminar = async (u: Usuario) => {
    if (!confirmar(`¿Eliminar definitivamente la cuenta de ${u.email}? Ya no podrá entrar al sistema. La información que capturó se conserva.`)) return
    try { await funcionUsuarios({ accion: 'eliminar', user_id: u.user_id }); setUsuarios((l) => l.filter((x) => x.user_id !== u.user_id)) } catch (e) { alert((e as Error).message) }
  }
  const cambiarPermiso = async (rol: Rol, modulo: string, nivel: Nivel) => {
    const permisos = { ...rol.permisos, [modulo]: nivel }
    setRoles((l) => l.map((r) => (r.id === rol.id ? { ...r, permisos } : r)))
    const { error: e } = await supabase.from('rh_roles').update({ permisos }).eq('id', rol.id)
    if (e) { alert(e.message); cargar() } else if (rol.id === usuario.rol) refrescarPermisos()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<Users size={22} />} value={usuarios.length} label="Usuarios totales" />
        <StatCard icon={<UserCheck size={22} />} value={activos} label="Activos" tono="green" />
        <StatCard icon={<UserX size={22} />} value={usuarios.length - activos} label="Desactivados" tono="amber" />
        <StatCard icon={<Shield size={22} />} value={roles.length} label="Roles" tono="blue" />
      </div>
      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <Seccion titulo="Usuarios" icon={Users} acciones={esAdmin && <div className="flex gap-2">
        <button className="btn border border-white/60 py-1.5 text-sm text-white hover:bg-white/10" onClick={() => setInvitar(true)}><Mail size={16} /> Invitar</button>
        <button className="btn border border-accent-600 bg-accent-500 py-1.5 text-sm text-primary-900 hover:bg-accent-400" onClick={() => setNuevo(true)}><UserPlus size={16} /> Nuevo usuario</button>
      </div>}>
        {cargando ? <p className="p-5 text-sm text-slate-500">Cargando usuarios…</p> : usuarios.length === 0 ? <Empty title="Sin usuarios" /> : (
          <Table head={<><th className="th">Usuario</th><th className="th">Rol</th><th className="th">Estado</th><th className="th hidden lg:table-cell">Último acceso</th><th className="th" /></>}>
            {usuarios.map((u) => {
              const yo = u.user_id === usuario.user_id
              return (
                <tr key={u.user_id} className={cx(!u.activo && 'opacity-60')}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">{(u.nombre || u.email)[0].toUpperCase()}</span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-primary-900">{u.nombre || u.email.split('@')[0]}{yo && <span className="ml-1 text-xs font-normal text-slate-400">(tú)</span>}</div>
                        <div className="truncate text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    {esAdmin && !yo
                      ? <Select className="w-44 py-1.5" value={u.rol} onChange={(e) => actualizarMiembro(u, { rol: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</Select>
                      : <span className="font-medium">{rolNombre(u.rol)}</span>}
                  </td>
                  <td className="td">
                    {esAdmin && !yo
                      ? <button onClick={() => actualizarMiembro(u, { activo: !u.activo })} className={cx('rounded-full px-3 py-1 text-xs font-semibold ring-1', u.activo ? 'bg-accent-100 text-accent-800 ring-accent-300' : 'bg-slate-100 text-slate-600 ring-slate-300')} title={u.activo ? 'Clic para desactivar' : 'Clic para activar'}>{u.activo ? '● Activo' : '○ Desactivado'}</button>
                      : <Badge>{u.activo ? 'Activo' : 'Baja'}</Badge>}
                  </td>
                  <td className="td hidden text-slate-600 lg:table-cell">{u.ultimo_acceso ? fmtFecha(u.ultimo_acceso.slice(0, 10)) : esAdmin ? 'Nunca' : '—'}</td>
                  <td className="td text-right">
                    {esAdmin && <button className="btn-ghost" title="Restablecer contraseña" onClick={() => setReset(u)}><KeyRound size={16} /></button>}
                    {esAdmin && !yo && <button className="btn-ghost text-rose-600" title="Eliminar cuenta" onClick={() => eliminar(u)}><Trash2 size={16} /></button>}
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
        {esAdmin && invitaciones.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Invitaciones pendientes</p>
            <div className="flex flex-wrap gap-2">
              {invitaciones.map((i) => (
                <span key={i.email} className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-800">
                  <Mail size={14} /> {i.email} · {rolNombre(i.rol)}
                  <button title="Cancelar invitación" onClick={async () => { await supabase.from('rh_invitaciones').delete().eq('email', i.email); cargar() }}><X size={14} /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </Seccion>

      <Seccion titulo="Roles y permisos" icon={ShieldCheck} acciones={esAdmin && <button className="btn border border-accent-600 bg-accent-500 py-1.5 text-sm text-primary-900 hover:bg-accent-400" onClick={() => setRolEdit('nuevo')}><Plus size={16} /> Nuevo rol</button>}>
        <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((r) => {
            const n = usuarios.filter((u) => u.rol === r.id).length
            return (
              <button key={r.id} disabled={!esAdmin || r.id === 'admin'} onClick={() => setRolEdit(r)} className="rounded-lg border border-slate-200 p-3 text-left transition enabled:hover:border-accent-500 disabled:cursor-default">
                <div className="flex items-center justify-between gap-2"><b className="text-primary-800">{r.nombre}</b><span className="rounded-md bg-primary-600 px-2 py-0.5 text-xs font-bold text-white">{n} usuario{n === 1 ? '' : 's'}</span></div>
                <p className="mt-1 text-xs text-slate-500">{r.descripcion || 'Sin descripción'}</p>
              </button>
            )
          })}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr><th className="th">Módulo</th>{roles.map((r) => <th key={r.id} className="th text-center">{r.nombre}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50/70">
              {MODULOS.map((m) => (
                <tr key={m.id}>
                  <td className="td font-semibold text-primary-800">{m.label}</td>
                  {roles.map((r) => {
                    const nivel = permisosDe(r.id, r)[m.id]
                    const editable = esAdmin && r.id !== 'admin'
                    return (
                      <td key={r.id} className="td text-center">
                        {editable
                          ? <select value={nivel} onChange={(e) => cambiarPermiso(r, m.id, e.target.value as Nivel)} className={cx('rounded-md border px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary-200', COLOR_NIVEL[nivel])}>
                              {(['editar', 'ver', 'ninguno'] as Nivel[]).map((n) => <option key={n} value={n}>{NIVEL_TEXTO[n]}</option>)}
                            </select>
                          : <span className={cx('inline-block rounded-md border px-2 py-1 text-xs font-semibold', COLOR_NIVEL[nivel])}>{NIVEL_TEXTO[nivel]}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500"><b>Editar</b>: puede capturar, modificar y eliminar. <b>Ver</b>: solo consulta. <b>Sin acceso</b>: el módulo no aparece en el menú. Los permisos también se aplican en la base de datos, no solo en pantalla. El Administrador siempre tiene acceso total.</p>
      </Seccion>

      {nuevo && <NuevoUsuario roles={roles} onClose={() => setNuevo(false)} onCreado={cargar} />}
      {rolEdit && <RolForm rol={rolEdit === 'nuevo' ? null : rolEdit} roles={roles} enUso={rolEdit !== 'nuevo' && usuarios.some((u) => u.rol === rolEdit.id)} onClose={() => setRolEdit(null)} onGuardado={cargar} />}
      {reset && <Restablecer u={reset} onClose={() => setReset(null)} />}
      {invitar && <Invitar roles={roles} onClose={() => setInvitar(false)} onHecho={cargar} />}
    </div>
  )
}

function Credenciales({ email, password }: { email: string; password: string }) {
  const [copiado, setCopiado] = useState(false)
  const texto = `Sistema de Recursos Humanos\nLiga: ${window.location.origin}${window.location.pathname}\nUsuario: ${email}\nContraseña: ${password}`
  return (
    <div className="rounded-lg border-2 border-accent-500 bg-accent-50 p-4 text-sm">
      <p className="mb-2 font-semibold text-primary-800">Comparte estos datos con la persona:</p>
      <pre className="whitespace-pre-wrap font-mono text-[13px] text-primary-900">{texto}</pre>
      <button className="btn-secondary mt-3 py-1.5" onClick={() => { navigator.clipboard?.writeText(texto); setCopiado(true) }}><Copy size={14} /> {copiado ? 'Copiado' : 'Copiar'}</button>
      <p className="mt-2 text-xs text-slate-600">Recomiéndale cambiar su contraseña con «¿Olvidaste tu contraseña?» al entrar por primera vez.</p>
    </div>
  )
}

function NuevoUsuario({ roles, onClose, onCreado }: { roles: Rol[]; onClose: () => void; onCreado: () => void }) {
  const [f, setF] = useState({ nombre: '', email: '', rol: 'rh', password: generarContrasena() })
  const [estado, setEstado] = useState<'form' | 'enviando' | 'listo'>('form')
  const [error, setError] = useState('')
  const rol = roles.find((r) => r.id === f.rol)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setEstado('enviando'); setError('')
    try { await funcionUsuarios({ accion: 'crear', ...f }); setEstado('listo'); onCreado() } catch (err) { setError((err as Error).message); setEstado('form') }
  }
  return (
    <Modal open onClose={onClose} title="Nuevo usuario" footer={estado === 'listo'
      ? <button className="btn-primary" onClick={onClose}>Listo</button>
      : <><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-usr" className="btn-accent" disabled={estado === 'enviando'}><UserPlus size={16} /> {estado === 'enviando' ? 'Creando…' : 'Crear usuario'}</button></>}>
      {estado === 'listo' ? <Credenciales email={f.email} password={f.password} /> : (
        <form id="form-usr" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre completo"><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej. Laura Pérez" /></Field>
          <Field label="Correo electrónico *"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Rol"><Select value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</Select></Field>
          <Field label="Contraseña temporal *">
            <div className="flex gap-2"><Input required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="font-mono" /><button type="button" className="btn-secondary px-2.5" title="Generar otra" onClick={() => setF({ ...f, password: generarContrasena() })}><RefreshCw size={16} /></button></div>
          </Field>
          {rol && <p className="rounded-lg bg-primary-50 p-3 text-xs text-primary-800 sm:col-span-2"><b>{rol.nombre}:</b> {rol.descripcion}</p>}
          <p className="text-xs text-slate-500 sm:col-span-2">La cuenta queda confirmada y lista para entrar; no se envía ningún correo.</p>
          {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        </form>
      )}
    </Modal>
  )
}

function Restablecer({ u, onClose }: { u: Usuario; onClose: () => void }) {
  const [password, setPassword] = useState(generarContrasena())
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')
  const enviar = async () => {
    setError('')
    try { await funcionUsuarios({ accion: 'restablecer', user_id: u.user_id, password }); setListo(true) } catch (e) { setError((e as Error).message) }
  }
  return (
    <Modal open onClose={onClose} title={`Restablecer contraseña · ${u.email}`} footer={listo ? <button className="btn-primary" onClick={onClose}>Listo</button> : <><button className="btn-secondary" onClick={onClose}>Cancelar</button><button className="btn-accent" onClick={enviar}><KeyRound size={16} /> Restablecer</button></>}>
      {listo ? <Credenciales email={u.email} password={password} /> : (
        <>
          <Field label="Nueva contraseña"><div className="flex gap-2"><Input minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" /><button type="button" className="btn-secondary px-2.5" onClick={() => setPassword(generarContrasena())}><RefreshCw size={16} /></button></div></Field>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </>
      )}
    </Modal>
  )
}

function Invitar({ roles, onClose, onHecho }: { roles: Rol[]; onClose: () => void; onHecho: () => void }) {
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('rh')
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const { error: err } = await supabase.from('rh_invitaciones').insert({ email: email.trim().toLowerCase(), rol })
    if (err) return setError(err.code === '23505' ? 'Ese correo ya está invitado.' : err.message)
    onHecho(); onClose()
  }
  return (
    <Modal open onClose={onClose} title="Invitar por correo" footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-inv" className="btn-accent"><Mail size={16} /> Invitar</button></>}>
      <form id="form-inv" onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-600">La persona entra a la página, pulsa <b>«Crear cuenta»</b> con este correo y elige su propia contraseña. Recibirá el rol indicado.</p>
        <Field label="Correo *"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Rol"><Select value={rol} onChange={(e) => setRol(e.target.value)}>{roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</Select></Field>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}

function RolForm({ rol, roles, enUso, onClose, onGuardado }: { rol: Rol | null; roles: Rol[]; enUso: boolean; onClose: () => void; onGuardado: () => void }) {
  const [nombre, setNombre] = useState(rol?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(rol?.descripcion ?? '')
  const [base, setBase] = useState('consulta')
  const [error, setError] = useState('')
  const id = useMemo(() => rol?.id ?? (nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rol'), [rol, nombre])
  const guardar = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    const { error: err } = rol
      ? await supabase.from('rh_roles').update({ nombre, descripcion }).eq('id', rol.id)
      : await supabase.from('rh_roles').insert({ id: roles.some((r) => r.id === id) ? `${id}-${Date.now().toString(36).slice(-4)}` : id, nombre, descripcion, permisos: roles.find((r) => r.id === base)?.permisos ?? {} })
    if (err) return setError(err.message)
    onGuardado(); onClose()
  }
  const borrar = async () => {
    if (!rol || !confirmar(`¿Eliminar el rol «${rol.nombre}»?`)) return
    const { error: err } = await supabase.from('rh_roles').delete().eq('id', rol.id)
    if (err) return setError(err.message)
    onGuardado(); onClose()
  }
  return (
    <Modal open onClose={onClose} title={rol ? `Editar rol · ${rol.nombre}` : 'Nuevo rol'} footer={<>
      {rol && !rol.sistema && <button className="btn-ghost mr-auto text-rose-600" disabled={enUso} title={enUso ? 'Hay usuarios con este rol' : undefined} onClick={borrar}><Trash2 size={16} /> Eliminar</button>}
      <button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-rol" className="btn-accent">Guardar</button></>}>
      <form id="form-rol" onSubmit={guardar} className="space-y-3">
        <Field label="Nombre del rol *"><Input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Reclutamiento" /></Field>
        <Field label="Descripción"><Textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></Field>
        {!rol && <Field label="Copiar permisos de"><Select value={base} onChange={(e) => setBase(e.target.value)}>{roles.filter((r) => r.id !== 'admin').map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</Select></Field>}
        <p className="text-xs text-slate-500">Los permisos por módulo se ajustan en la tabla de «Roles y permisos».</p>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}
