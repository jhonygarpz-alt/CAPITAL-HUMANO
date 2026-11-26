import { useState, type FormEvent, type ReactNode } from 'react'
import { BarChart3, Building2, CalendarDays, Database, Eye, EyeOff, FileText, FolderOpen, KeyRound, Loader2, Lock, LogOut, Mail, Sparkles, UserRound, Users } from 'lucide-react'
import { empresasConocidas, recordarSesion, setRecordarSesion, supabase } from '../lib/supabase'
import { LogoOptima, Marca } from './Marca'

/** Fondo institucional para las pantallas de acceso. */
function FondoAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-700 p-4 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_10%_0%,rgba(26,98,144,.9),transparent_60%),radial-gradient(50rem_35rem_at_100%_100%,rgba(3,37,58,.9),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-accent-500" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[40px] border-white/[.04]" />
        <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full border-[48px] border-accent-500/[.08]" />
      </div>
      <div className="relative w-full">{children}</div>
    </div>
  )
}

function Marco({ children }: { children: ReactNode }) {
  return (
    <FondoAcceso>
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b-[6px] border-accent-500 bg-primary-600 px-6 py-5"><Marca size={42} /></div>
        <div className="p-7">{children}</div>
      </div>
    </FondoAcceso>
  )
}

export function Cargando({ texto, error, onReintentar }: { texto?: string; error?: string; onReintentar?: () => void }) {
  if (error) {
    return (
      <Marco>
        <p className="mb-2 font-semibold text-rose-600">No se pudo conectar con la base de datos</p>
        <p className="mb-4 text-sm text-slate-600">{error}</p>
        <div className="flex gap-2">
          {onReintentar && <button className="btn-primary" onClick={onReintentar}>Reintentar</button>}
          <button className="btn-secondary" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Salir</button>
        </div>
      </Marco>
    )
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary-700 text-white">
      <LogoOptima size={64} className="rounded-xl" />
      <Loader2 className="animate-spin text-accent-500" size={30} />
      {texto && <p className="text-sm text-white/80">{texto}</p>}
    </div>
  )
}

const MODULOS_ACCESO = [
  { icon: Users, label: 'Colaboradores' },
  { icon: FolderOpen, label: 'Expedientes' },
  { icon: FileText, label: 'Contratos' },
  { icon: CalendarDays, label: 'Asistencias' },
  { icon: BarChart3, label: 'Reportes' },
]

const campo = 'w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-11 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'

export function Login() {
  const [modo, setModo] = useState<'entrar' | 'registro' | 'recuperar'>('entrar')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [ver, setVer] = useState(false)
  const [recordar, setRecordar] = useState(recordarSesion)
  const empresas = empresasConocidas()
  const [empresaId, setEmpresaId] = useState(() => { try { return localStorage.getItem('rh.empresaActual') || empresas[0]?.id || '' } catch { return empresas[0]?.id || '' } })
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setOcupado(true)
    setMsg(null)
    setRecordarSesion(recordar)
    if (empresaId) { try { localStorage.setItem('rh.empresaActual', empresaId) } catch { /* sin almacenamiento */ } }
    const redirectTo = window.location.origin + window.location.pathname
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
      } else if (modo === 'registro') {
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: redirectTo } })
        if (error) throw error
        if (!data.session) setMsg({ tipo: 'ok', texto: 'Cuenta creada. Revisa tu correo y abre el enlace de confirmación para entrar.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
        if (error) throw error
        setMsg({ tipo: 'ok', texto: 'Te enviamos un correo con el enlace para restablecer tu contraseña.' })
      }
    } catch (err) {
      const t = (err as Error).message
      setMsg({ tipo: 'error', texto: t.includes('Invalid login') ? 'Correo o contraseña incorrectos.' : t.includes('not confirmed') ? 'Confirma tu correo antes de entrar (revisa tu bandeja).' : t })
    } finally {
      setOcupado(false)
    }
  }
  const cambiar = (m: typeof modo) => { setModo(m); setMsg(null) }

  return (
    <FondoAcceso>
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.55)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Panel institucional */}
        <div className="relative hidden flex-col bg-primary-600 px-10 py-12 text-white md:flex">
          <div className="absolute inset-y-0 right-0 w-2 bg-accent-500" />
          <LogoOptima size={84} className="rounded-2xl shadow-lg" />
          <h1 className="mt-6 font-marca text-[30px] font-extrabold leading-tight">Optima Dual Solutions</h1>
          <p className="mt-1 text-lg text-white/80">Recursos Humanos · Sistema Multiempresa</p>
          <span className="mt-5 block h-1.5 w-20 rounded-full bg-accent-500" />
          <p className="mt-5 max-w-[17rem] text-lg leading-snug text-white/90">Administración integral del talento humano</p>
          <ul className="mt-7 space-y-3">
            {MODULOS_ACCESO.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4 text-[15px] font-medium">
                <span className="flex h-10 w-11 items-center justify-center rounded-lg bg-accent-500 text-primary-900"><Icon size={20} strokeWidth={2} /></span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Formulario */}
        <div className="px-6 py-8 sm:px-12 sm:py-10">
          <div className="-mx-6 -mt-8 mb-6 border-b-[6px] border-accent-500 bg-primary-600 px-6 py-4 md:hidden"><Marca size={38} /></div>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-accent-500 bg-primary-50 text-primary-600 shadow-md">
            {email ? <span className="text-3xl font-extrabold uppercase">{email.slice(0, 2)}</span> : <UserRound size={46} strokeWidth={1.6} />}
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-primary-700">{modo === 'entrar' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear cuenta' : 'Recuperar contraseña'}</h2>
          <p className="mt-1 text-center text-slate-600">{modo === 'registro' ? 'Necesitas una invitación del administrador' : 'Accede al sistema de Recursos Humanos'}</p>

          <form onSubmit={submit} className="mx-auto mt-6 max-w-md space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-primary-800"><Mail size={16} /> Correo electrónico</span>
              <span className="relative block">
                <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
                <input className={campo} type="email" required autoComplete="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </span>
            </label>
            {modo !== 'recuperar' && (
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-primary-800"><Lock size={16} /> Contraseña</span>
                <span className="relative block">
                  <KeyRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
                  <input className={campo} type={ver ? 'text' : 'password'} required minLength={8} placeholder="••••••••" autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} value={pass} onChange={(e) => setPass(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-primary-400 hover:text-primary-700" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{ver ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
            )}
            {modo === 'entrar' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-700">
                  <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer rounded accent-primary-600" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
                  Recordar mi sesión
                </label>
                <button type="button" className="font-medium text-primary-600 hover:underline" onClick={() => cambiar('recuperar')}>¿Olvidaste tu contraseña?</button>
              </div>
            )}
            {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.tipo === 'ok' ? 'bg-accent-100 text-accent-800' : 'bg-rose-50 text-rose-700'}`}>{msg.texto}</p>}
            <button disabled={ocupado} className="btn-accent w-full py-3 text-lg">
              {ocupado && <Loader2 size={20} className="animate-spin" />}
              {modo === 'entrar' ? 'Entrar al sistema' : modo === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
            </button>
            <p className="text-center text-sm text-slate-600">
              {modo === 'entrar'
                ? <>¿Primera vez? <button type="button" className="font-semibold text-primary-600 hover:underline" onClick={() => cambiar('registro')}>Crear cuenta</button></>
                : <button type="button" className="font-semibold text-primary-600 hover:underline" onClick={() => cambiar('entrar')}>Volver a iniciar sesión</button>}
            </p>
            <div className="!mt-6 flex items-center gap-3 border-t border-slate-200 pt-5">
              <span className="flex items-center gap-2 whitespace-nowrap font-semibold text-primary-800"><Building2 size={20} strokeWidth={1.8} /> Empresa:</span>
              <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} disabled={!empresas.length} className="input">
                {empresas.length ? empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>) : <option value="">Se elige al entrar</option>}
              </select>
            </div>
          </form>
        </div>
      </div>
    </FondoAcceso>
  )
}

export function SinAcceso({ email, onReintentar }: { email: string; onReintentar: () => void }) {
  return (
    <Marco>
      <h1 className="mb-2 text-xl font-bold text-primary-700">Acceso pendiente</h1>
      <p className="mb-5 text-sm text-slate-600">La cuenta <b>{email}</b> aún no tiene permiso. Pide al administrador que te invite desde <b>Configuración → Usuarios</b> con este mismo correo y luego pulsa "Reintentar".</p>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={onReintentar}>Reintentar</button>
        <button className="btn-secondary" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Salir</button>
      </div>
    </Marco>
  )
}

export function Bienvenida({ esAdmin, onDemo, onVacia }: { esAdmin: boolean; onDemo: () => void; onVacia: () => void }) {
  return (
    <Marco>
      <h1 className="mb-2 flex items-center gap-2 text-xl font-bold text-primary-700"><Sparkles className="text-accent-600" size={20} /> ¡Bienvenido!</h1>
      {esAdmin ? (
        <>
          <p className="mb-5 text-sm text-slate-600">Tu base de datos está lista y vacía. ¿Cómo quieres empezar?</p>
          <div className="space-y-2">
            <button className="panel-link w-full text-left" onClick={onVacia}><Building2 size={20} className="shrink-0 text-accent-600" /><span><b className="block">Empezar con mi empresa</b><span className="text-xs font-normal text-slate-500">Crea una empresa vacía para capturar tu información real</span></span></button>
            <button className="panel-link w-full text-left" onClick={onDemo}><Database size={20} className="shrink-0 text-accent-600" /><span><b className="block">Cargar datos de demostración</b><span className="text-xs font-normal text-slate-500">3 empresas y 20 colaboradores de ejemplo para conocer el sistema</span></span></button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">El administrador aún no ha dado de alta ninguna empresa. Vuelve a intentarlo más tarde.</p>
      )}
      <button className="btn-ghost mt-5 text-sm" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Salir</button>
    </Marco>
  )
}
