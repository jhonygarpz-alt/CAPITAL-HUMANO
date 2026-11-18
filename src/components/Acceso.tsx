import { useState, type FormEvent, type ReactNode } from 'react'
import { Building2, Database, Loader2, LogOut, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="text-lg font-bold text-slate-900">Recursos Humanos</div>
            <div className="text-sm text-slate-500">Sistema Multiempresa</div>
          </div>
        </div>
        {children}
      </div>
    </div>
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

export function Login() {
  const [modo, setModo] = useState<'entrar' | 'registro' | 'recuperar'>('entrar')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setOcupado(true)
    setMsg(null)
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

  return (
    <Marco>
      <h1 className="mb-1 text-xl font-bold text-slate-900">{modo === 'entrar' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear cuenta' : 'Recuperar contraseña'}</h1>
      <p className="mb-5 text-sm text-slate-500">{modo === 'registro' ? 'Para entrar necesitas una invitación del administrador (el primer usuario registrado es el administrador).' : 'Accede para administrar el personal de tus empresas.'}</p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block"><span className="label">Correo electrónico</span><input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {modo !== 'recuperar' && (
          <label className="block"><span className="label">Contraseña</span><input className="input" type="password" required minLength={8} autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} value={pass} onChange={(e) => setPass(e.target.value)} /></label>
        )}
        {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg.texto}</p>}
        <button className="btn-primary w-full py-2.5" disabled={ocupado}>
          {ocupado && <Loader2 size={16} className="animate-spin" />}
          {modo === 'entrar' ? 'Entrar' : modo === 'registro' ? 'Crear cuenta' : 'Enviar enlace'}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
        {modo !== 'entrar' ? <button className="text-primary-600 hover:underline" onClick={() => { setModo('entrar'); setMsg(null) }}>Ya tengo cuenta</button>
          : <button className="text-primary-600 hover:underline" onClick={() => { setModo('registro'); setMsg(null) }}>Crear cuenta</button>}
        {modo === 'entrar' && <button className="text-slate-500 hover:underline" onClick={() => { setModo('recuperar'); setMsg(null) }}>Olvidé mi contraseña</button>}
      </div>
    </Marco>
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
