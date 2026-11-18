import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Users, FolderOpen, FileSignature, Wallet, CalendarCheck, Palmtree, AlertTriangle, BarChart3, Settings, Menu, Search, Bell, Building2, X, HelpCircle,
} from 'lucide-react'
import { useStore } from '../store/Store'
import { cx, Avatar } from './ui'
import { estadoContrato, nombreCompleto, normalizar } from '../lib/utils'

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/expedientes', label: 'Expedientes', icon: FolderOpen },
  { to: '/contratos', label: 'Contratos', icon: FileSignature },
  { to: '/nomina', label: 'Nómina', icon: Wallet },
  { to: '/asistencias', label: 'Asistencias', icon: CalendarCheck },
  { to: '/vacaciones', label: 'Vacaciones', icon: Palmtree },
  { to: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const link = ({ isActive }: { isActive: boolean }) =>
    cx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition', isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm"><Users size={20} /></div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-900">Recursos Humanos</div>
          <div className="text-xs text-slate-500">Sistema Multiempresa</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link} onClick={onNavigate}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-slate-100 p-3">
        <NavLink to="/ayuda" className={link} onClick={onNavigate}><HelpCircle size={18} /> Ayuda</NavLink>
        <NavLink to="/configuracion" className={link} onClick={onNavigate}><Settings size={18} /> Configuración</NavLink>
      </div>
    </div>
  )
}

function BuscadorGlobal() {
  const { deEmpresa } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const res = useMemo(() => {
    const t = normalizar(q.trim())
    if (!t) return []
    return deEmpresa('colaboradores')
      .filter((c) => normalizar(`${nombreCompleto(c)} ${c.numero} ${c.puesto} ${c.departamento} ${c.email}`).includes(t))
      .slice(0, 8)
  }, [q, deEmpresa])
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder="Buscar colaborador, puesto, número…" className="input rounded-full bg-slate-50 pl-9" />
      {open && q && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {res.length === 0 && <div className="px-4 py-3 text-sm text-slate-500">Sin resultados</div>}
          {res.map((c) => (
            <button key={c.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50" onClick={() => { nav(`/colaboradores/${c.id}`); setQ(''); setOpen(false) }}>
              <Avatar c={c} size={30} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{nombreCompleto(c)}</div>
                <div className="truncate text-xs text-slate-500">{c.numero} · {c.puesto}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Notificaciones() {
  const { deEmpresa } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const avisos = useMemo(() => {
    const a: { texto: string; to: string }[] = []
    const vac = deEmpresa('vacaciones').filter((v) => v.estatus === 'Pendiente').length
    if (vac) a.push({ texto: `${vac} solicitud(es) de vacaciones por aprobar`, to: '/vacaciones' })
    const inc = deEmpresa('incidencias').filter((i) => i.estatus === 'Pendiente').length
    if (inc) a.push({ texto: `${inc} incidencia(s) pendientes de aplicar`, to: '/incidencias' })
    const cont = deEmpresa('contratos').filter((c) => ['Por vencer', 'Vencido'].includes(estadoContrato(c))).length
    if (cont) a.push({ texto: `${cont} contrato(s) por vencer o vencidos`, to: '/contratos' })
    return a
  }, [deEmpresa])
  return (
    <div className="relative">
      <button className="btn-ghost relative" onClick={() => setOpen(!open)} aria-label="Notificaciones">
        <Bell size={20} />
        {avisos.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg" onMouseLeave={() => setOpen(false)}>
          <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold">Pendientes</div>
          {avisos.length === 0 && <div className="px-4 py-3 text-sm text-slate-500">Todo al día ✨</div>}
          {avisos.map((a) => (
            <button key={a.to} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50" onClick={() => { nav(a.to); setOpen(false) }}>{a.texto}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { db, empresa, setEmpresa } = useStore()
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block"><Sidebar /></aside>
      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <button className="btn-ghost absolute right-2 top-4" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X size={18} /></button>
            <Sidebar onNavigate={() => setMenu(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="btn-ghost lg:hidden" onClick={() => setMenu(true)} aria-label="Abrir menú"><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 md:inline">Empresa:</span>
            <div className="relative">
              <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: empresa.color }} />
              <select value={empresa.id} onChange={(e) => setEmpresa(e.target.value)} className="input w-40 py-1.5 pl-9 font-medium sm:w-48">
                {db.empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="hidden flex-1 justify-center md:flex"><BuscadorGlobal /></div>
          <div className="ml-auto flex items-center gap-1">
            <Notificaciones />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">RH</div>
          </div>
        </header>
        <div className="no-print border-b border-slate-200 bg-white px-4 py-2 md:hidden"><BuscadorGlobal /></div>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
