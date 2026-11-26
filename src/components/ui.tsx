import { useEffect, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X, Inbox, UserRound, type LucideIcon } from 'lucide-react'
import type { Colaborador } from '../types'
import { iniciales } from '../lib/utils'

export function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(' ')
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary-700 sm:text-[30px] sm:leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const TONOS = {
  navy: 'bg-primary-600 text-white',
  green: 'bg-accent-500 text-primary-900',
  blue: 'bg-primary-500 text-white',
  red: 'bg-rose-600 text-white',
  amber: 'bg-amber-500 text-white',
  slate: 'bg-slate-500 text-white',
}
export type Tono = keyof typeof TONOS

export function StatCard({ icon, value, label, tono = 'navy', onClick, compacto }: { icon: ReactNode; value: ReactNode; label: string; tono?: Tono; onClick?: () => void; compacto?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={cx('card flex border-b-4 border-b-accent-500 p-4 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:cursor-default', compacto ? 'flex-col items-start gap-2' : 'items-center gap-4 sm:p-5')}>
      <div className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm', TONOS[tono])}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-2xl font-extrabold leading-tight text-primary-700 sm:text-[28px]">{value}</div>
        <div className="text-sm font-medium leading-tight text-slate-600">{label}</div>
      </div>
    </button>
  )
}

const VERDE = 'bg-accent-100 text-accent-800 ring-accent-600/30'
const AMBAR = 'bg-amber-50 text-amber-700 ring-amber-600/25'
const AZUL = 'bg-primary-50 text-primary-700 ring-primary-600/25'
const GRIS = 'bg-slate-100 text-slate-600 ring-slate-500/20'
const ROJO = 'bg-rose-50 text-rose-700 ring-rose-600/25'
const BADGES: Record<string, string> = {
  Activo: VERDE, Vigente: VERDE, Aprobada: VERDE, Asistencia: VERDE, Aplicada: VERDE, Cerrada: VERDE, Completo: VERDE, Abierta: VERDE,
  Pendiente: AMBAR, 'Por vencer': AMBAR, Retardo: AMBAR,
  Incapacidad: AZUL, Permiso: AZUL, 'Home office': AZUL, 'En proceso': AZUL, Cubierta: AZUL,
  Borrador: GRIS, Baja: GRIS, Cancelado: GRIS, Cancelada: GRIS,
  Vencido: ROJO, Rechazada: ROJO, Falta: ROJO, Incompleto: ROJO,
}
const PUNTO: Record<string, string> = { Activo: 'bg-accent-600', Vigente: 'bg-accent-600', Aprobada: 'bg-accent-600', Abierta: 'bg-accent-600', Completo: 'bg-accent-600' }
export function Badge({ children, className, solido }: { children: string; className?: string; solido?: boolean }) {
  const verde = BADGES[children] === VERDE
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
      solido && verde ? 'bg-accent-500 text-primary-900 ring-accent-600' : BADGES[children] ?? AZUL, className)}>
      <span className={cx('h-2 w-2 rounded-full', solido && verde ? 'bg-primary-800' : PUNTO[children] ?? 'bg-current opacity-70')} />
      {children}
    </span>
  )
}

const AV_COLORES = ['bg-primary-100 text-primary-700', 'bg-accent-100 text-accent-800', 'bg-sky-100 text-sky-800', 'bg-slate-200 text-slate-700']
export function Avatar({ c, size = 36, cuadrado }: { c: Pick<Colaborador, 'nombre' | 'apellidoPaterno' | 'foto' | 'id'>; size?: number; cuadrado?: boolean }) {
  const color = AV_COLORES[(c.id.charCodeAt(0) + c.id.charCodeAt(1)) % AV_COLORES.length]
  if (cuadrado) {
    return (
      <div className="shrink-0 overflow-hidden rounded-xl border-4 border-accent-500 bg-slate-100 shadow-md" style={{ width: size, height: size }}>
        {c.foto ? <img src={c.foto} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-end justify-center text-slate-400"><UserRound size={size * 0.8} strokeWidth={1.4} fill="currentColor" className="-mb-2 opacity-70" /></div>}
      </div>
    )
  }
  return c.foto ? (
    <img src={c.foto} alt="" className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <div className={cx('flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white', color)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {iniciales(c)}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div className={cx('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-l-[6px] border-accent-500 bg-primary-600 px-5 py-3.5 text-white">
          <h2 className="text-base font-bold">{title}</h2>
          <button className="rounded-lg p-1.5 hover:bg-white/10" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, className, hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx('input', p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx('input', p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cx('input', p.className)} />

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-400"><Inbox size={22} /></div>
      <p className="font-semibold text-primary-700">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number | string; icon?: LucideIcon }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex overflow-x-auto rounded-t-lg border-b-2 border-slate-300 bg-white/70">
      {tabs.map((t, i) => {
        const activo = value === t.id
        const Icon = t.icon
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={cx('relative -mb-[2px] flex items-center gap-2 whitespace-nowrap border-b-4 px-4 py-3 text-[15px] font-semibold transition',
              activo ? 'rounded-t-lg border-accent-600 bg-accent-500 text-primary-900' : 'border-transparent text-primary-700 hover:bg-primary-50',
              i > 0 && !activo && 'before:absolute before:left-0 before:top-3 before:h-6 before:w-px before:bg-slate-300')}>
            {Icon && <Icon size={20} strokeWidth={1.9} />}
            {t.label}
            {t.count !== undefined && <span className={cx('rounded-md px-1.5 py-0.5 text-xs font-bold', activo ? 'bg-white/70 text-primary-800' : 'bg-accent-100 text-accent-800')}>{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead><tr>{head}</tr></thead>
        <tbody className="divide-y divide-slate-200 [&>tr:nth-child(even)]:bg-slate-50/70">{children}</tbody>
      </table>
    </div>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  const color = v >= 100 ? 'bg-accent-500' : v >= 60 ? 'bg-primary-500' : 'bg-amber-500'
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full bg-slate-200', className)}>
      <div className={cx('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
    </div>
  )
}

/** Tarjeta de sección de las fichas: encabezado azul con acento verde. */
export function Seccion({ titulo, icon: Icon, children, acciones, className }: { titulo: string; icon?: LucideIcon; children: ReactNode; acciones?: ReactNode; className?: string }) {
  return (
    <section className={cx('seccion', className)}>
      <div className="seccion-titulo">
        {Icon && <Icon size={24} strokeWidth={2} />}
        <h3 className="flex-1">{titulo}</h3>
        {acciones}
      </div>
      {children}
    </section>
  )
}

/** Renglón "ícono · etiqueta · valor" usado en las fichas. */
export function DatoFila({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 py-2 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-primary-700"><Icon size={18} strokeWidth={2} /></span>
      <span className="w-40 shrink-0 text-sm text-slate-700 sm:w-48">{label}</span>
      <span className="min-w-0 flex-1 break-words text-[15px] font-bold text-primary-900">{value || '—'}</span>
    </div>
  )
}

export function confirmar(msg: string) {
  return window.confirm(msg)
}
