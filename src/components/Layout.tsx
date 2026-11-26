import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Users, FolderOpen, FileText, Wallet, CalendarDays, Umbrella, AlertTriangle, BarChart3, Settings, Menu, Search, Bell, X, HelpCircle, Briefcase, Gift, Stamp, ChevronDown, ChevronRight, LogOut, Cloud, CloudOff, Loader2, Lock, Eye, Cake, FileWarning, Award,
} from 'lucide-react'
import { useStore } from '../store/Store'
import { cx, Avatar } from './ui'
import { Marca, LogoOptima } from './Marca'
import { nombreCompleto, normalizar } from '../lib/utils'
import { calcularAvisos, type TipoAviso } from '../lib/avisos'
import { moduloDeRuta, MODULOS } from '../lib/permisos'

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/expedientes', label: 'Expedientes', icon: FolderOpen },
  { to: '/contratos', label: 'Contratos', icon: FileText },
  { to: '/nomina', label: 'Nómina', icon: Wallet },
  { to: '/aguinaldos', label: 'Aguinaldos', icon: Gift },
  { to: '/asistencias', label: 'Asistencias', icon: CalendarDays },
  { to: '/vacaciones', label: 'Vacaciones', icon: Umbrella },
  { to: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { to: '/constancias', label: 'Constancias', icon: Stamp },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]
const NAV_FIN = [
  { to: '/ayuda', label: 'Ayuda', icon: HelpCircle },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]
const TITULOS: Record<string, string> = Object.fromEntries([...NAV, ...NAV_FIN].map((n) => [n.to.slice(1), n.label]))

function Sidebar({ expandido, onNavigate }: { expandido: boolean; onNavigate?: () => void }) {
  const { puede } = useStore()
  const visible = (n: (typeof NAV)[number]) => { const m = moduloDeRuta(n.to); return !m || puede(m) }
  const item = ({ to, label, icon: Icon, end }: (typeof NAV)[number]) => (
    <NavLink key={to} to={to} end={end} onClick={onNavigate} title={expandido ? undefined : label}
      className={({ isActive }) => cx('flex items-center gap-3 py-3 text-[15px] font-medium transition', expandido ? 'mx-2 rounded-lg px-3' : 'justify-center',
        isActive ? 'bg-accent-500 text-primary-900 shadow-[inset_0_-2px_0_rgba(0,0,0,.08)]' : 'text-white/85 hover:bg-white/10 hover:text-white')}>
      <Icon size={24} strokeWidth={1.8} className="shrink-0" /> {expandido && label}
    </NavLink>
  )
  return (
    <div className="flex h-full flex-col py-3">
      <nav className="flex-1 space-y-1 overflow-y-auto">{NAV.filter(visible).map(item)}</nav>
      <div className={cx('space-y-1 border-t border-white/20 pt-3', expandido ? 'mx-3' : 'mx-4')}>{NAV_FIN.filter(visible).map(item)}</div>
    </div>
  )
}

function useClickFuera(cerrar: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cerrar() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [cerrar])
  return ref
}

function Desplegable({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('absolute top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl', className)}>{children}</div>
}

function BuscadorGlobal({ oscuro }: { oscuro?: boolean }) {
  const { deEmpresa } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useClickFuera(() => setOpen(false))
  const res = useMemo(() => {
    const t = normalizar(q.trim())
    if (!t) return []
    return deEmpresa('colaboradores')
      .filter((c) => normalizar(`${nombreCompleto(c)} ${c.numero} ${c.puesto} ${c.departamento} ${c.email}`).includes(t))
      .slice(0, 8)
  }, [q, deEmpresa])
  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-700" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder="Buscar en Recursos Humanos…"
        className={cx('w-full rounded-full border py-2 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:ring-4', oscuro ? 'border-transparent bg-white focus:ring-accent-500/40' : 'border-slate-300 bg-white focus:ring-primary-100')} />
      {open && q && (
        <Desplegable className="left-0 right-0">
          {res.length === 0 && <div className="px-4 py-3 text-sm text-slate-500">Sin resultados</div>}
          {res.map((c) => (
            <button key={c.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-50" onClick={() => { nav(`/colaboradores/${c.id}`); setQ(''); setOpen(false) }}>
              <Avatar c={c} size={30} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{nombreCompleto(c)}</div>
                <div className="truncate text-xs text-slate-500">{c.numero} · {c.puesto}</div>
              </div>
            </button>
          ))}
        </Desplegable>
      )}
    </div>
  )
}

const ICONO_AVISO: Record<TipoAviso, typeof Bell> = {
  primaVacacional: Wallet, cumpleanos: Cake, documentos: FileWarning, contratos: FileText, aniversarios: Award, vacacionesPendientes: Umbrella, incidenciasPendientes: AlertTriangle,
}

function Notificaciones() {
  const { db, empresa, puede } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickFuera(() => setOpen(false))
  const avisos = useMemo(() => calcularAvisos(db, empresa), [db, empresa])
  const urgentes = avisos.filter((a) => a.urgente).length
  return (
    <div ref={ref} className="relative">
      <button className="relative rounded-lg p-2 text-white transition hover:bg-white/10" onClick={() => setOpen(!open)} aria-label="Notificaciones">
        <Bell size={24} strokeWidth={1.8} />
        {avisos.length > 0 && <span className={cx('absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-primary-600 px-1 text-[10px] font-bold', urgentes ? 'bg-rose-500 text-white' : 'bg-accent-500 text-primary-900')}>{avisos.length > 99 ? '99+' : avisos.length}</span>}
      </button>
      {open && (
        <Desplegable className="right-0 w-[22rem] max-w-[calc(100vw-1.5rem)]">
          <div className="flex items-center justify-between bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white">
            <span>Notificaciones ({avisos.length})</span>
            {puede('configuracion', 'editar') && <button className="text-xs font-medium text-accent-300 hover:underline" onClick={() => { nav('/configuracion?tab=notificaciones'); setOpen(false) }}>Configurar</button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {avisos.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-500">Todo al día ✅</div>}
            {avisos.map((a) => {
              const Icon = ICONO_AVISO[a.tipo]
              return (
                <button key={a.id} className="flex w-full gap-3 border-b border-slate-100 px-4 py-2.5 text-left hover:bg-accent-50" onClick={() => { nav(a.to); setOpen(false) }}>
                  <span className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a.urgente ? 'bg-rose-100 text-rose-600' : 'bg-accent-100 text-primary-700')}><Icon size={16} /></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold text-primary-900">{a.titulo}</span><span className="block text-xs text-slate-500">{a.detalle}</span></span>
                </button>
              )
            })}
          </div>
        </Desplegable>
      )}
    </div>
  )
}

function MenuUsuario() {
  const { usuario, cerrarSesion, sync } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickFuera(() => setOpen(false))
  const nombre = usuario.nombre || usuario.email.split('@')[0]
  const ini = (nombre[0] ?? '?').toUpperCase()
  return (
    <div ref={ref} className="relative">
      <button className="flex items-center gap-1 rounded-full p-0.5 text-white transition hover:bg-white/10" onClick={() => setOpen(!open)} aria-label="Menú de usuario">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white text-lg font-bold">
          {ini}
          <span className={cx('absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-primary-600', sync === 'error' ? 'bg-rose-500' : sync === 'guardando' ? 'bg-amber-400' : 'bg-accent-500')} />
        </span>
        <ChevronDown size={18} className="hidden sm:block" />
      </button>
      {open && (
        <Desplegable className="right-0 w-64">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="truncate font-semibold">{nombre}</div>
            <div className="truncate text-xs text-slate-500">{usuario.email}</div>
            <div className="mt-1 text-xs font-semibold text-accent-700">{usuario.rolNombre ?? usuario.rol}</div>
          </div>
          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-primary-50" onClick={() => { nav('/configuracion'); setOpen(false) }}><Settings size={16} /> Configuración</button>
          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={cerrarSesion}><LogOut size={16} /> Cerrar sesión</button>
        </Desplegable>
      )}
    </div>
  )
}

function EstadoSync() {
  const { sync } = useStore()
  if (sync === 'ok') return <span className="hidden items-center gap-1.5 text-sm text-white xl:flex" title="Todo guardado en la nube"><Cloud size={20} className="text-accent-500" /> Guardado</span>
  if (sync === 'guardando') return <span className="flex items-center gap-1.5 text-sm text-amber-300"><Loader2 size={18} className="animate-spin" /> <span className="hidden sm:inline">Guardando…</span></span>
  return <span className="flex items-center gap-1.5 text-sm text-rose-300" title="No se pudo guardar. Revisa tu conexión y recarga la página."><CloudOff size={18} /> <span className="hidden sm:inline">Sin conexión</span></span>
}

function MigasDePan() {
  const { db } = useStore()
  const loc = useLocation()
  const partes = loc.pathname.split('/').filter(Boolean)
  if (!partes.length) return null
  const migas: { label: string; to?: string }[] = [{ label: TITULOS[partes[0]] ?? partes[0], to: partes.length > 1 ? `/${partes[0]}` : undefined }]
  if (partes[0] === 'colaboradores' && partes[1]) {
    const c = db.colaboradores.find((x) => x.id === partes[1])
    const tab = new URLSearchParams(loc.search).get('tab')
    migas.push({ label: tab ? ({ general: 'Información', expediente: 'Expediente', documentos: 'Documentos', contratos: 'Contratos', vacaciones: 'Vacaciones', incidencias: 'Incidencias', nomina: 'Nómina', historial: 'Historial' } as Record<string, string>)[tab] ?? 'Ficha' : c ? nombreCompleto(c) : 'Ficha' })
  } else if (partes[0] === 'aguinaldos' && partes[1]) {
    migas.push({ label: db.aguinaldos.find((n) => n.id === partes[1])?.nombre ?? 'Detalle' })
  } else if (partes[0] === 'nomina' && partes[1]) {
    migas.push({ label: db.nominas.find((n) => n.id === partes[1])?.nombre ?? 'Detalle' })
  }
  return (
    <nav className="no-print mb-4 flex flex-wrap items-center gap-1.5 text-[15px] text-primary-700" aria-label="Ruta">
      <Link to="/" className="rounded p-0.5 hover:bg-primary-50" aria-label="Inicio"><Home size={20} /></Link>
      <ChevronRight size={16} className="text-slate-400" />
      {migas.map((m, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-400">/</span>}
          {m.to ? <Link to={m.to} className="hover:underline">{m.label}</Link> : <b className="font-bold text-primary-800">{m.label}</b>}
        </span>
      ))}
    </nav>
  )
}

/** Muestra la página solo si el rol tiene acceso; si es de consulta, avisa. */
function Protegido({ children }: { children: ReactNode }) {
  const { puede } = useStore()
  const loc = useLocation()
  const m = moduloDeRuta(loc.pathname)
  if (!m) return <>{children}</>
  const nombre = MODULOS.find((x) => x.id === m)?.label ?? m
  if (!puede(m)) {
    return (
      <div className="card mx-auto mt-10 max-w-lg border-t-4 border-t-amber-500 p-8 text-center">
        <Lock className="mx-auto mb-3 text-amber-500" size={36} />
        <h2 className="text-xl font-bold text-primary-700">Sin acceso a {nombre}</h2>
        <p className="mt-2 text-sm text-slate-600">Tu rol no incluye este módulo. Si lo necesitas, pide a un administrador que ajuste tus permisos en Configuración → Usuarios y permisos.</p>
        <Link to="/" className="btn-primary mt-5">Ir al inicio</Link>
      </div>
    )
  }
  return (
    <>
      {!puede(m, 'editar') && (
        <div className="no-print mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Eye size={16} className="shrink-0" /> <span><b>Solo consulta:</b> tu rol permite ver {nombre}, pero no modificar.</span>
        </div>
      )}
      {children}
    </>
  )
}

export default function Layout() {
  const { db, empresa, setEmpresa } = useStore()
  const [menu, setMenu] = useState(false)
  const [expandido, setExpandido] = useState(() => { try { return localStorage.getItem('rh.menuExpandido') === '1' } catch { return false } })
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const alternar = () => {
    if (window.innerWidth < 1024) return setMenu(true)
    setExpandido((v) => { try { localStorage.setItem('rh.menuExpandido', v ? '0' : '1') } catch { /* */ } return !v })
  }
  const ancho = expandido ? 'lg:w-[240px]' : 'lg:w-[84px]'

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 flex h-[76px] items-center bg-primary-600 text-white shadow-md">
        <div className={cx('flex h-full w-14 shrink-0 items-center justify-center bg-primary-700 transition-[width] sm:w-[84px]', ancho)}>
          <button className="rounded-lg p-2 hover:bg-white/10" onClick={alternar} aria-label="Mostrar u ocultar menú"><Menu size={26} /></button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:gap-5 sm:px-5">
          <div className="hidden sm:block"><Marca size={46} /></div>
          <div className="sm:hidden"><LogoOptima size={38} className="rounded-lg" /></div>
          <span className="hidden h-10 w-px bg-white/30 lg:block" />
          <div className="flex items-center gap-2">
            <span className="hidden font-semibold lg:inline">Empresa:</span>
            <select value={empresa.id} onChange={(e) => setEmpresa(e.target.value)} className="w-32 rounded-lg border-0 bg-white px-3 py-2 font-semibold text-primary-800 outline-none focus:ring-4 focus:ring-accent-500/40 sm:w-44">
              {db.empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <span className="hidden h-10 w-px bg-white/30 xl:block" />
          <div className="hidden flex-1 md:flex"><BuscadorGlobal oscuro /></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <EstadoSync />
            <Notificaciones />
            <MenuUsuario />
          </div>
        </div>
      </header>

      <aside className={cx('no-print fixed bottom-0 left-0 top-[76px] z-20 hidden bg-primary-700 transition-[width] lg:block', ancho)}>
        <Sidebar expandido={expandido} />
      </aside>
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-primary-900/50" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-primary-700 shadow-xl">
            <div className="flex items-center justify-between bg-primary-600 px-4 py-4">
              <Marca size={36} />
              <button className="rounded-lg p-1.5 text-white hover:bg-white/10" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X size={20} /></button>
            </div>
            <Sidebar expandido onNavigate={() => setMenu(false)} />
          </aside>
        </div>
      )}
      <div className={cx('transition-[padding]', expandido ? 'lg:pl-[240px]' : 'lg:pl-[84px]')}>
        <div className="no-print border-b border-slate-200 bg-white px-4 py-2 md:hidden"><BuscadorGlobal /></div>
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6"><MigasDePan /><Protegido><Outlet /></Protegido></main>
      </div>
    </div>
  )
}
