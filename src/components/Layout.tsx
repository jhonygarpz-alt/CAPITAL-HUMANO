import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Users, FolderOpen, FileText, BarChart2, CalendarDays, Umbrella, AlertTriangle, FileBarChart, Settings, Menu, Search, Bell, X, HelpCircle, Briefcase, ChevronDown, LogOut, Cloud, CloudOff, Loader2,
} from 'lucide-react'
import { useStore } from '../store/Store'
import { cx, Avatar } from './ui'
import { Logo } from './Acceso'
import { estadoContrato, nombreCompleto, normalizar } from '../lib/utils'

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/expedientes', label: 'Expedientes', icon: FolderOpen },
  { to: '/contratos', label: 'Contratos', icon: FileText },
  { to: '/nomina', label: 'Nómina', icon: BarChart2 },
  { to: '/asistencias', label: 'Asistencias', icon: CalendarDays },
  { to: '/vacaciones', label: 'Vacaciones', icon: Umbrella },
  { to: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { to: '/vacantes', label: 'Vacantes', icon: Briefcase },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart },
]

function Sidebar({ compacto, onNavigate }: { compacto?: boolean; onNavigate?: () => void }) {
  const link = ({ isActive }: { isActive: boolean }) => cx('nav-item', isActive ? 'nav-active' : 'nav-idle', compacto && 'justify-center px-0')
  const item = (to: string, label: string, Icon: typeof Home, end?: boolean) => (
    <NavLink key={to} to={to} end={end} className={link} onClick={onNavigate} title={compacto ? label : undefined}>
      <Icon size={20} strokeWidth={1.8} className="shrink-0" /> {!compacto && label}
    </NavLink>
  )
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{NAV.map((n) => item(n.to, n.label, n.icon, n.end))}</nav>
      <div className="mx-3 space-y-1 border-t border-primary-200/70 py-3">
        {item('/ayuda', 'Ayuda', HelpCircle)}
        {item('/configuracion', 'Configuración', Settings)}
      </div>
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
  return <div className={cx('absolute top-full z-40 mt-2 overflow-hidden rounded-2xl border border-primary-200 bg-white/95 shadow-xl backdrop-blur-xl', className)}>{children}</div>
}

function BuscadorGlobal() {
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
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder="Buscar en Recursos Humanos…" className="input rounded-xl py-2.5 pl-10" />
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

function Notificaciones() {
  const { deEmpresa } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickFuera(() => setOpen(false))
  const avisos = useMemo(() => {
    const a: { texto: string; to: string }[] = []
    const vac = deEmpresa('vacaciones').filter((v) => v.estatus === 'Pendiente').length
    if (vac) a.push({ texto: `${vac} solicitud(es) de vacaciones por aprobar`, to: '/vacaciones' })
    const inc = deEmpresa('incidencias').filter((i) => i.estatus === 'Pendiente').length
    if (inc) a.push({ texto: `${inc} incidencia(s) pendientes de aplicar`, to: '/incidencias' })
    const cont = deEmpresa('contratos').filter((c) => ['Por vencer', 'Vencido'].includes(estadoContrato(c))).length
    if (cont) a.push({ texto: `${cont} contrato(s) por vencer o vencidos`, to: '/contratos' })
    const vacantes = deEmpresa('vacantes').filter((v) => v.estatus === 'Abierta' && v.candidatos === 0).length
    if (vacantes) a.push({ texto: `${vacantes} vacante(s) abiertas sin candidatos`, to: '/vacantes' })
    return a
  }, [deEmpresa])
  return (
    <div ref={ref} className="relative">
      <button className="btn-ghost relative" onClick={() => setOpen(!open)} aria-label="Notificaciones">
        <Bell size={22} strokeWidth={1.8} />
        {avisos.length > 0 && <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />}
      </button>
      {open && (
        <Desplegable className="right-0 w-72">
          <div className="border-b border-primary-100 px-4 py-2.5 text-sm font-semibold">Pendientes</div>
          {avisos.length === 0 && <div className="px-4 py-3 text-sm text-slate-500">Todo al día ✨</div>}
          {avisos.map((a) => (
            <button key={a.to} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-primary-50" onClick={() => { nav(a.to); setOpen(false) }}>{a.texto}</button>
          ))}
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
  const ini = nombre.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div ref={ref} className="relative">
      <button className="flex items-center gap-1 rounded-full p-0.5 transition hover:bg-white/70" onClick={() => setOpen(!open)} aria-label="Menú de usuario">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-semibold text-white ring-2 ring-white">
          {ini}
          <span className={cx('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white', sync === 'error' ? 'bg-rose-500' : sync === 'guardando' ? 'bg-amber-400' : 'bg-emerald-500')} />
        </span>
        <ChevronDown size={18} className="hidden text-slate-600 sm:block" />
      </button>
      {open && (
        <Desplegable className="right-0 w-64">
          <div className="border-b border-primary-100 px-4 py-3">
            <div className="truncate font-semibold">{nombre}</div>
            <div className="truncate text-xs text-slate-500">{usuario.email}</div>
            <div className="mt-1 text-xs font-medium text-primary-700">{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</div>
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
  if (sync === 'ok') return <span className="hidden items-center gap-1 text-xs text-slate-500 xl:flex" title="Todo guardado en la nube"><Cloud size={16} className="text-emerald-500" /> Guardado</span>
  if (sync === 'guardando') return <span className="flex items-center gap-1 text-xs text-amber-600"><Loader2 size={16} className="animate-spin" /> <span className="hidden sm:inline">Guardando…</span></span>
  return <span className="flex items-center gap-1 text-xs text-rose-600" title="No se pudo guardar. Revisa tu conexión y recarga la página."><CloudOff size={16} /> <span className="hidden sm:inline">Sin conexión</span></span>
}

export default function Layout() {
  const { db, empresa, setEmpresa } = useStore()
  const [menu, setMenu] = useState(false)
  const [compacto, setCompacto] = useState(() => { try { return localStorage.getItem('rh.menuCompacto') === '1' } catch { return false } })
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const alternar = () => {
    if (window.innerWidth < 1024) return setMenu(true)
    setCompacto((v) => { try { localStorage.setItem('rh.menuCompacto', v ? '0' : '1') } catch { /* */ } return !v })
  }

  return (
    <div className="min-h-screen">
      <header className="no-print glass sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-primary-200/70 px-3 sm:px-5">
        <div className="hidden items-center gap-3 pr-2 sm:flex lg:w-[236px]">
          <Logo size={38} />
          <div className="hidden leading-tight lg:block">
            <div className="text-[17px] font-bold text-slate-900">Recursos Humanos</div>
            <div className="text-[13px] text-slate-600">Sistema Multiempresa</div>
          </div>
        </div>
        <span className="hidden h-8 w-px bg-primary-200 lg:block" />
        <button className="btn-ghost" onClick={alternar} aria-label="Mostrar u ocultar menú"><Menu size={22} /></button>
        <div className="flex items-center gap-2">
          <span className="hidden font-medium text-slate-700 md:inline">Empresa:</span>
          <select value={empresa.id} onChange={(e) => setEmpresa(e.target.value)} className="input w-36 border-primary-300 py-2 font-medium shadow-[0_0_10px_-3px_rgba(139,92,246,.45)] sm:w-52">
            {db.empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="hidden flex-1 justify-center md:flex"><BuscadorGlobal /></div>
        <div className="ml-auto flex items-center gap-2">
          <EstadoSync />
          <Notificaciones />
          <MenuUsuario />
        </div>
      </header>

      <aside className={cx('no-print glass fixed bottom-0 left-0 top-[72px] z-20 hidden border-r border-primary-200/70 lg:block', compacto ? 'w-[76px]' : 'w-[260px]')}>
        <Sidebar compacto={compacto} />
      </aside>
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white/95 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-primary-100 px-4 py-4">
              <Logo size={34} />
              <div className="flex-1 leading-tight"><div className="font-bold">Recursos Humanos</div><div className="text-xs text-slate-500">Sistema Multiempresa</div></div>
              <button className="btn-ghost" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X size={18} /></button>
            </div>
            <Sidebar onNavigate={() => setMenu(false)} />
          </aside>
        </div>
      )}
      <div className={cx('transition-[padding]', compacto ? 'lg:pl-[76px]' : 'lg:pl-[260px]')}>
        <div className="no-print border-b border-primary-200/70 bg-white/50 px-4 py-2 backdrop-blur md:hidden"><BuscadorGlobal /></div>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
