import { useState, type FormEvent, type ReactNode } from 'react'
import { BarChart3, Building2, CalendarDays, Database, Eye, EyeOff, FileText, FolderOpen, KeyRound, Loader2, Lock, LogOut, Mail, Sparkles, UserRound, Users } from 'lucide-react'
import { empresasConocidas, recordarSesion, setRecordarSesion, supabase } from '../lib/supabase'

export function Logo({ size = 40 }: { size?: number }) {
  const s = size / 2 - 2
  return (
    <div className="grid shrink-0 grid-cols-2 gap-1" style={{ width: size, height: size }} aria-hidden>
      <span className="rounded-[5px] bg-gradient-to-br from-sky-400 to-blue-600" style={{ width: s, height: s }} />
      <span className="rounded-[5px] bg-gradient-to-br from-violet-400 to-primary-600" style={{ width: s, height: s }} />
      <span className="rounded-[5px] bg-gradient-to-br from-blue-500 to-indigo-600" style={{ width: s, height: s }} />
      <span className="rounded-[5px] bg-gradient-to-br from-indigo-400 to-violet-600" style={{ width: s, height: s }} />
    </div>
  )
}

function Marco({ children }: { children: ReactNode }) {
  return (
    <FondoAcceso>
      <div className="card-glow mx-auto w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="text-lg font-bold text-slate-900">Recursos Humanos</div>
            <div className="text-sm text-slate-500">Sistema Multiempresa</div>
          </div>
        </div>
        {children}
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="animate-spin text-primary-600" size={32} />
      {texto && <p className="text-sm">{texto}</p>}
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

/** Fondo oscuro con brillos violetas para las pantallas de acceso. */
function FondoAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#140f3a] p-4 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70rem_45rem_at_15%_10%,rgba(124,58,237,.45),transparent_60%),radial-gradient(60rem_40rem_at_95%_30%,rgba(59,130,246,.30),transparent_60%),radial-gradient(50rem_30rem_at_50%_110%,rgba(168,85,247,.45),transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/3 opacity-30 lg:block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.10) 0 2px, transparent 2px 90px), linear-gradient(180deg, rgba(147,197,253,.25), rgba(196,181,253,.15))' }} />
        <svg className="absolute bottom-0 left-0 h-48 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ola" x1="0" x2="1"><stop offset="0" stopColor="#a855f7" stopOpacity="0" /><stop offset=".5" stopColor="#c084fc" stopOpacity=".9" /><stop offset="1" stopColor="#a855f7" stopOpacity="0" /></linearGradient>
          </defs>
          <path d="M0 150 C 320 60, 620 210, 900 130 S 1300 40, 1440 110" fill="none" stroke="url(#ola)" strokeWidth="3" />
          <path d="M0 170 C 360 100, 640 220, 940 150 S 1320 80, 1440 140" fill="none" stroke="url(#ola)" strokeWidth="1.5" opacity=".6" />
        </svg>
      </div>
      <div className="relative w-full">{children}</div>
    </div>
  )
}

/** Orquídea decorativa en SVG. */
function Orquidea({ className }: { className?: string }) {
  const petalo = (r: number, l = 46, w = 22) => <ellipse cx="0" cy={-l / 2} rx={w / 2} ry={l / 2} transform={`rotate(${r})`} fill="url(#petalo)" stroke="#f5d0fe" strokeOpacity=".35" />
  return (
    <svg viewBox="0 0 260 170" className={className} aria-hidden>
      <defs>
        <radialGradient id="petalo" cx=".5" cy=".9" r="1"><stop offset="0" stopColor="#f0abfc" /><stop offset=".55" stopColor="#c026d3" /><stop offset="1" stopColor="#7e22ce" /></radialGradient>
        <radialGradient id="boton" cx=".4" cy=".4" r=".8"><stop offset="0" stopColor="#e9d5ff" /><stop offset="1" stopColor="#7c3aed" /></radialGradient>
      </defs>
      <path d="M40 160 C 70 120, 120 100, 240 70" stroke="#3b2a5e" strokeWidth="3" fill="none" />
      <path d="M10 165 C 20 120, 45 100, 70 95 C 55 125, 40 150, 10 165Z" fill="#1f3d2b" opacity=".9" />
      <g transform="translate(78 108)">{[0, 72, 144, 216, 288].map((r) => <g key={r}>{petalo(r)}</g>)}<circle r="8" fill="#fdf4ff" /><circle r="4" fill="#facc15" /></g>
      <g transform="translate(150 92) scale(.7)">{[20, 92, 164, 236, 308].map((r) => <g key={r}>{petalo(r)}</g>)}<circle r="8" fill="#fdf4ff" /></g>
      {[[195, 80, 9], [215, 74, 7], [232, 70, 5.5]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="url(#boton)" />)}
    </svg>
  )
}

const campoOscuro = 'w-full rounded-xl border border-white/20 bg-white/[.06] py-2.5 pl-11 pr-11 text-[15px] text-white outline-none transition placeholder:text-white/45 focus:border-violet-400 focus:bg-white/[.10] focus:ring-4 focus:ring-violet-500/25'

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
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-violet-300/40 bg-white/[.07] text-white shadow-[0_0_0_1px_rgba(255,255,255,.08)_inset,0_0_60px_-10px_rgba(168,85,247,.55),0_30px_80px_-30px_rgba(0,0,0,.6)] backdrop-blur-2xl md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Panel izquierdo */}
        <div className="relative hidden overflow-hidden px-10 pb-10 pt-12 md:block">
          <div aria-hidden className="absolute -right-24 top-0 h-full w-48 rounded-[50%] border-r-2 border-violet-400/50 shadow-[12px_0_40px_-12px_rgba(168,85,247,.7)]" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-fuchsia-500/10" />
          <div className="relative">
            <div className="grid w-fit grid-cols-2 gap-1.5">
              {[0, 1, 2, 3].map((i) => <span key={i} className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 shadow-[0_0_14px_rgba(167,139,250,.6)]" />)}
            </div>
            <h1 className="mt-6 text-[28px] font-bold leading-tight">Recursos Humanos</h1>
            <p className="mt-1 text-lg text-white/75">Sistema Multiempresa</p>
            <span className="mt-4 block h-1 w-20 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
            <p className="mt-5 max-w-[16rem] text-lg leading-snug text-white/85">Administración integral del talento humano</p>
            <ul className="mt-6 space-y-3">
              {MODULOS_ACCESO.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-4 text-[15px] text-white/90">
                  <span className="flex h-10 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/10"><Icon size={20} strokeWidth={1.8} /></span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <Orquidea className="pointer-events-none absolute -bottom-2 -left-2 w-64 drop-shadow-[0_0_20px_rgba(217,70,239,.45)]" />
        </div>

        {/* Panel derecho */}
        <div className="px-6 py-8 sm:px-12 sm:py-10">
          <div className="mb-6 flex items-center justify-center gap-3 md:hidden">
            <div className="grid grid-cols-2 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="h-4 w-4 rounded bg-gradient-to-br from-violet-400 to-purple-600" />)}</div>
            <div className="leading-tight"><div className="font-bold">Recursos Humanos</div><div className="text-xs text-white/70">Sistema Multiempresa</div></div>
          </div>
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-300 to-purple-600 p-[3px] shadow-[0_0_30px_rgba(168,85,247,.75)]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#2a1f63] to-[#3b2a85] text-violet-100">
              {email ? <span className="text-3xl font-semibold uppercase">{email.slice(0, 2)}</span> : <UserRound size={52} strokeWidth={1.5} />}
            </div>
          </div>
          <h2 className="mt-4 text-center text-3xl font-bold">{modo === 'entrar' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear cuenta' : 'Recuperar contraseña'}</h2>
          <p className="mt-1 text-center text-white/75">{modo === 'registro' ? 'Necesitas una invitación del administrador (el primer usuario es el administrador)' : 'Accede al sistema de Recursos Humanos'}</p>

          <form onSubmit={submit} className="mx-auto mt-6 max-w-md space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-sm text-white/90"><Mail size={16} /> Correo electrónico</span>
              <span className="relative block">
                <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
                <input className={campoOscuro} type="email" required autoComplete="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </span>
            </label>
            {modo !== 'recuperar' && (
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm text-white/90"><Lock size={16} /> Contraseña</span>
                <span className="relative block">
                  <KeyRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" />
                  <input className={campoOscuro} type={ver ? 'text' : 'password'} required minLength={8} placeholder="••••••••" autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} value={pass} onChange={(e) => setPass(e.target.value)} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/70 hover:text-white" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{ver ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
            )}
            {modo === 'entrar' && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-white/90">
                  <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer rounded accent-violet-500" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
                  Recordar mi sesión
                </label>
                <button type="button" className="text-violet-200 hover:text-white hover:underline" onClick={() => cambiar('recuperar')}>¿Olvidaste tu contraseña?</button>
              </div>
            )}
            {msg && <p className={`rounded-xl px-3 py-2 text-sm ${msg.tipo === 'ok' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}>{msg.texto}</p>}
            <button disabled={ocupado} className="flex w-full items-center justify-center gap-3 rounded-xl border border-violet-300/60 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-3 text-lg font-semibold shadow-[0_0_24px_rgba(168,85,247,.6)] transition hover:brightness-110 disabled:opacity-60">
              {ocupado ? <Loader2 size={20} className="animate-spin" /> : <span className="grid grid-cols-2 gap-0.5">{[0, 1, 2, 3].map((i) => <span key={i} className="h-2.5 w-2.5 bg-white" />)}</span>}
              {modo === 'entrar' ? 'Entrar al sistema' : modo === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
            </button>
            <p className="text-center text-sm text-white/70">
              {modo === 'entrar'
                ? <>¿Primera vez? <button type="button" className="font-medium text-violet-200 hover:text-white hover:underline" onClick={() => cambiar('registro')}>Crear cuenta</button></>
                : <button type="button" className="font-medium text-violet-200 hover:text-white hover:underline" onClick={() => cambiar('entrar')}>Volver a iniciar sesión</button>}
            </p>
            <div className="!mt-6 flex items-center gap-3 border-t border-white/15 pt-5">
              <span className="flex items-center gap-2 whitespace-nowrap text-white/90"><Building2 size={20} strokeWidth={1.6} /> Empresa:</span>
              <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} disabled={!empresas.length}
                className="w-full rounded-xl border border-white/20 bg-white/[.06] px-3 py-2 text-white outline-none focus:border-violet-400 disabled:text-white/50 [&>option]:text-slate-900">
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
      <h1 className="mb-2 text-xl font-bold text-slate-900">Acceso pendiente</h1>
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
      <h1 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-900"><Sparkles className="text-primary-600" size={20} /> ¡Bienvenido!</h1>
      {esAdmin ? (
        <>
          <p className="mb-5 text-sm text-slate-600">Tu base de datos está lista y vacía. ¿Cómo quieres empezar?</p>
          <div className="space-y-2">
            <button className="panel-link w-full text-left" onClick={onVacia}><Building2 size={18} className="text-primary-600" /><span><b className="block">Empezar con mi empresa</b><span className="text-xs font-normal text-slate-500">Crea una empresa vacía para capturar tu información real</span></span></button>
            <button className="panel-link w-full text-left" onClick={onDemo}><Database size={18} className="text-primary-600" /><span><b className="block">Cargar datos de demostración</b><span className="text-xs font-normal text-slate-500">3 empresas y 20 colaboradores de ejemplo para conocer el sistema</span></span></button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">El administrador aún no ha dado de alta ninguna empresa. Vuelve a intentarlo más tarde.</p>
      )}
      <button className="btn-ghost mt-5 text-sm" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Salir</button>
    </Marco>
  )
}
