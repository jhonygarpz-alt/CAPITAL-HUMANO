import { useEffect, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X, Inbox } from 'lucide-react'
import type { Colaborador } from '../types'
import { iniciales } from '../lib/utils'

export function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(' ')
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[32px] sm:leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const TONOS = {
  violet: 'bg-gradient-to-br from-violet-100 to-primary-200 text-primary-700',
  green: 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600',
  blue: 'bg-gradient-to-br from-sky-100 to-blue-200 text-blue-600',
  red: 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600',
  amber: 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600',
  slate: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600',
}
export type Tono = keyof typeof TONOS

export function StatCard({ icon, value, label, tono = 'violet', onClick }: { icon: ReactNode; value: ReactNode; label: string; tono?: Tono; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="card-glow flex flex-col items-start gap-2 p-4 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:border-primary-400 disabled:cursor-default sm:p-5">
      <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-white', TONOS[tono])}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">{value}</div>
        <div className="text-sm leading-tight text-slate-700 sm:text-base">{label}</div>
      </div>
    </button>
  )
}

const BADGES: Record<string, string> = {
  Activo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Vigente: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Aprobada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Asistencia: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Aplicada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Cerrada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Completo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pendiente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Por vencer': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Retardo: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Incapacidad: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Permiso: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'Home office': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Borrador: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  Baja: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Cancelado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Vencido: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Rechazada: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Falta: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Incompleto: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Abierta: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'En proceso': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Cubierta: 'bg-primary-50 text-primary-700 ring-primary-600/20',
  Cancelada: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}
const PUNTO: Record<string, string> = { Activo: 'bg-emerald-500', Vigente: 'bg-emerald-500', Aprobada: 'bg-emerald-500', Abierta: 'bg-emerald-500' }
export function Badge({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', BADGES[children] ?? 'bg-primary-50 text-primary-700 ring-primary-600/20', className)}>
      <span className={cx('h-2 w-2 rounded-full', PUNTO[children] ?? 'bg-current opacity-70')} />
      {children}
    </span>
  )
}

const AV_COLORES = ['bg-primary-100 text-primary-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700']
export function Avatar({ c, size = 36, cuadrado }: { c: Pick<Colaborador, 'nombre' | 'apellidoPaterno' | 'foto' | 'id'>; size?: number; cuadrado?: boolean }) {
  const color = AV_COLORES[(c.id.charCodeAt(0) + c.id.charCodeAt(1)) % AV_COLORES.length]
  const forma = cuadrado ? 'rounded-2xl shadow-md ring-4' : 'rounded-full ring-2'
  return c.foto ? (
    <img src={c.foto} alt="" className={cx('shrink-0 object-cover ring-white', forma)} style={{ width: size, height: size }} />
  ) : (
    <div className={cx('flex shrink-0 items-center justify-center font-semibold ring-white', forma, color)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div className={cx('flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-primary-200 bg-white/95 shadow-2xl backdrop-blur-xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
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
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Inbox size={22} /></div>
      <p className="font-medium text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-primary-200/80">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cx('relative whitespace-nowrap px-4 pb-3 pt-2.5 text-[15px] font-medium transition', value === t.id ? 'text-primary-700' : 'text-slate-700 hover:text-slate-900')}>
          {t.label}
          {t.count !== undefined && <span className={cx('ml-1.5 rounded-full px-1.5 py-0.5 text-xs', value === t.id ? 'bg-primary-100' : 'bg-slate-100')}>{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-1 bottom-0 h-1 rounded-full bg-gradient-to-r from-violet-500 to-primary-600 shadow-[0_0_8px_rgba(124,58,237,.6)]" />}
        </button>
      ))}
    </div>
  )
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-primary-100">
        <thead className="bg-white/40"><tr>{head}</tr></thead>
        <tbody className="divide-y divide-primary-100/70">{children}</tbody>
      </table>
    </div>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  const color = v >= 100 ? 'bg-emerald-500' : v >= 60 ? 'bg-primary-500' : 'bg-amber-500'
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cx('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
    </div>
  )
}

export function confirmar(msg: string) {
  return window.confirm(msg)
}
