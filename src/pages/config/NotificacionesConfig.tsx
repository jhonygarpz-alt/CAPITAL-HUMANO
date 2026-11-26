import { useState } from 'react'
import { Award, BellRing, Cake, FileText, FileWarning, Save, Umbrella, Wallet, AlertTriangle, type LucideIcon } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Seccion, cx } from '../../components/ui'
import { configNotificaciones, ETIQUETA_AVISO, NOTIFICACIONES_DEFECTO, type TipoAviso } from '../../lib/avisos'
import type { ConfigNotificaciones } from '../../types'

const FILAS: { tipo: TipoAviso; icon: LucideIcon; desc: string; conDias: boolean; unidad?: string }[] = [
  { tipo: 'primaVacacional', icon: Wallet, desc: 'Avisa cuándo hay que pagar la prima vacacional: antes de las vacaciones aprobadas o del aniversario, según cómo esté configurada en Prestaciones.', conDias: true },
  { tipo: 'cumpleanos', icon: Cake, desc: 'Recordatorio de los cumpleaños del personal.', conDias: true },
  { tipo: 'documentos', icon: FileWarning, desc: 'Documentos del expediente con fecha de vencimiento (INE, licencias, certificados, permisos…). También avisa de los ya vencidos.', conDias: true },
  { tipo: 'contratos', icon: FileText, desc: 'Contratos por tiempo determinado, de prueba o de capacitación próximos a terminar.', conDias: true },
  { tipo: 'aniversarios', icon: Award, desc: 'Aniversarios laborales (años cumplidos en la empresa).', conDias: true },
  { tipo: 'vacacionesPendientes', icon: Umbrella, desc: 'Solicitudes de vacaciones que esperan aprobación.', conDias: false },
  { tipo: 'incidenciasPendientes', icon: AlertTriangle, desc: 'Incidencias registradas que aún no se aplican en nómina.', conDias: false },
]

export default function NotificacionesConfig() {
  const { db, guardarItem, puede } = useStore()
  const [cfg, setCfg] = useState<ConfigNotificaciones>(() => configNotificaciones(db))
  const [guardado, setGuardado] = useState(false)
  const editable = puede('configuracion', 'editar')
  const set = (t: TipoAviso, cambios: Partial<ConfigNotificaciones[TipoAviso]>) => { setCfg((p) => ({ ...p, [t]: { ...p[t], ...cambios } })); setGuardado(false) }
  const guardar = () => { guardarItem('ajustes', { id: 'general', notificaciones: cfg }, { accion: 'Configuración de notificaciones actualizada', modulo: 'Configuración' }); setGuardado(true) }

  return (
    <div className="space-y-6">
      <Seccion titulo="Notificaciones" icon={BellRing}>
        <div className="divide-y divide-slate-200">
          {FILAS.map(({ tipo, icon: Icon, desc, conDias }) => {
            const v = cfg[tipo]
            return (
              <div key={tipo} className={cx('flex flex-wrap items-center gap-4 px-5 py-4', !v.activo && 'bg-slate-50')}>
                <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', v.activo ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500')}><Icon size={22} /></span>
                <div className="min-w-[14rem] flex-1">
                  <div className="font-bold text-primary-800">{ETIQUETA_AVISO[tipo]}</div>
                  <p className="text-sm text-slate-600">{desc}</p>
                </div>
                {conDias && (
                  <label className={cx('flex items-center gap-2 text-sm', !v.activo && 'opacity-50')}>
                    <span className="text-slate-600">Avisar</span>
                    <input type="number" min={0} max={365} disabled={!v.activo || !editable} value={v.dias}
                      onChange={(e) => set(tipo, { dias: Math.max(0, Math.min(365, Number(e.target.value))) })}
                      className="input w-20 py-1.5 text-center font-bold text-primary-800" aria-label={`Días de anticipación para ${ETIQUETA_AVISO[tipo]}`} />
                    <span className="text-slate-600">días antes</span>
                  </label>
                )}
                <button type="button" role="switch" aria-checked={v.activo} aria-label={`Activar ${ETIQUETA_AVISO[tipo]}`} disabled={!editable} onClick={() => set(tipo, { activo: !v.activo })}
                  className={cx('relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50', v.activo ? 'bg-accent-500' : 'bg-slate-300')}>
                  <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', v.activo ? 'left-6' : 'left-1')} />
                </button>
              </div>
            )
          })}
        </div>
      </Seccion>
      <div className="flex flex-wrap items-center gap-3">
        {editable ? <>
          <button className="btn-primary" onClick={guardar}><Save size={16} /> Guardar notificaciones</button>
          <button className="btn-secondary" onClick={() => { setCfg(NOTIFICACIONES_DEFECTO); setGuardado(false) }}>Restablecer valores sugeridos</button>
        </> : <span className="text-sm text-slate-500">Solo quien tiene permiso de edición en Configuración puede cambiar las notificaciones.</span>}
        {guardado && <span className="text-sm font-semibold text-accent-700">✓ Notificaciones guardadas</span>}
      </div>
      <p className="text-xs text-slate-500">Los avisos aparecen en la campana del encabezado y en «Avisos y recordatorios» del Inicio, para todas las empresas. Para que avise de un documento, captura su fecha de vencimiento al subirlo al expediente.</p>
    </div>
  )
}
