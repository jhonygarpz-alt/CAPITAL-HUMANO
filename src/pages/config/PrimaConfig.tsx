import { useState, type ReactNode } from 'react'
import { CalendarHeart, Percent, RotateCcw, Save, Wallet } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Field, Input, Seccion, Select } from '../../components/ui'
import { CONFIG_PRIMA_LEY, calcularPrima, configPrimaDe, diasVacacionesConfig } from '../../lib/prima'
import { fmtMoney } from '../../lib/utils'
import type { ConfigPrima, Colaborador } from '../../types'

const Ayuda = ({ children }: { children: ReactNode }) => <p className="mt-1 text-xs leading-snug text-slate-500">{children}</p>

export default function PrimaConfig() {
  const { empresa, guardarItem, puede } = useStore()
  const [cfg, setCfg] = useState<ConfigPrima>(() => configPrimaDe(empresa.configPrima))
  const [guardado, setGuardado] = useState(false)
  const editable = puede('configuracion', 'editar')
  const set = <K extends keyof ConfigPrima>(k: K, v: ConfigPrima[K]) => { setCfg((p) => ({ ...p, [k]: v })); setGuardado(false) }
  const guardar = () => { guardarItem('empresas', { ...empresa, configPrima: cfg }, { accion: `Configuración de prima vacacional actualizada (${cfg.porcentaje}%)`, modulo: 'Configuración' }); setGuardado(true) }
  const ejemplo = calcularPrima({ salarioDiario: 500 } as Colaborador, diasVacacionesConfig(1, cfg), cfg)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Prima vacacional" icon={Percent}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Porcentaje de prima (%)">
              <Input type="number" min={25} max={100} step="1" value={cfg.porcentaje} onChange={(e) => set('porcentaje', Number(e.target.value))} />
              <Ayuda>Mínimo de ley: 25% del salario de los días de vacaciones (LFT art. 80).{cfg.porcentaje < 25 && <b className="text-rose-600"> Es menor al mínimo legal.</b>}</Ayuda>
            </Field>
            <Field label="Salario base">
              <Select value={cfg.base} onChange={(e) => set('base', e.target.value as ConfigPrima['base'])}><option>Salario diario</option><option>Salario diario integrado</option></Select>
              <Ayuda>Lo usual es el salario diario.</Ayuda>
            </Field>
            {cfg.base === 'Salario diario integrado' && <Field label="Factor de integración"><Input type="number" min={1} step="0.0001" value={cfg.factorIntegracion} onChange={(e) => set('factorIntegracion', Number(e.target.value))} /></Field>}
            <Field label="Momento de pago" className="sm:col-span-2">
              <Select value={cfg.momentoPago} onChange={(e) => set('momentoPago', e.target.value as ConfigPrima['momentoPago'])}><option>Al disfrutar las vacaciones</option><option>En el aniversario</option></Select>
              <Ayuda>«Al disfrutar»: se paga por los días que se toman. «En el aniversario»: se paga completa al cumplir cada año de servicio.</Ayuda>
            </Field>
          </div>
        </Seccion>

        <Seccion titulo="Días de vacaciones" icon={CalendarHeart}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Tabla de días">
              <Select value={cfg.tablaVacaciones} onChange={(e) => set('tablaVacaciones', e.target.value as ConfigPrima['tablaVacaciones'])}><option>Ley (reforma 2023)</option><option>Días adicionales</option></Select>
            </Field>
            {cfg.tablaVacaciones === 'Días adicionales' && <Field label="Días extra sobre la ley"><Input type="number" min={0} value={cfg.diasAdicionales} onChange={(e) => set('diasAdicionales', Number(e.target.value))} /></Field>}
            <div className="text-xs text-slate-600 sm:col-span-2">
              <p className="mb-1 font-semibold text-primary-800">Días por año cumplido:</p>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 11, 16, 21].map((a) => <span key={a} className="rounded-md bg-primary-50 px-2 py-1"><b>{a === 6 ? '6-10' : a === 11 ? '11-15' : a === 16 ? '16-20' : a === 21 ? '21-25' : a}</b> {a === 1 ? 'año' : 'años'}: {diasVacacionesConfig(a, cfg)} días</span>)}
              </div>
            </div>
          </div>
        </Seccion>
      </div>

      <Seccion titulo="Impuestos (ISR)" icon={Wallet}>
        <div className="grid gap-4 p-5 md:grid-cols-4">
          <Field label="Valor diario de la UMA"><Input type="number" min={0} step="0.01" value={cfg.valorUMA} onChange={(e) => set('valorUMA', Number(e.target.value))} /><Ayuda>Actualízalo con el valor vigente del INEGI.</Ayuda></Field>
          <Field label="UMAs exentas"><Input type="number" min={0} value={cfg.umasExentas} onChange={(e) => set('umasExentas', Number(e.target.value))} /><Ayuda>LISR art. 93 fr. XIV: 15 UMA = exento hasta <b>{fmtMoney(cfg.valorUMA * cfg.umasExentas)}</b> por año.</Ayuda></Field>
          <Field label="Método de cálculo del ISR"><Select value={cfg.metodoISR} onChange={(e) => set('metodoISR', e.target.value as ConfigPrima['metodoISR'])}><option value="Art. 174 RLISR">Art. 174 RLISR (opcional)</option><option value="Art. 96 LISR">Art. 96 LISR</option></Select></Field>
          <label className="flex cursor-pointer items-center gap-2 self-end rounded-lg border border-slate-200 p-3 text-sm font-semibold text-primary-800">
            <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={cfg.noRetenerISR} onChange={(e) => set('noRetenerISR', e.target.checked)} /> La empresa absorbe el ISR
          </label>
        </div>
        <p className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
          <b className="text-primary-800">Ejemplo:</b> salario de $500 diarios con 1 año cumplido → {ejemplo.dias} días × $500 × {cfg.porcentaje}% = <b>{fmtMoney(ejemplo.importe)}</b> (exento {fmtMoney(ejemplo.exento)}, ISR {fmtMoney(ejemplo.isr)}, neto <b>{fmtMoney(ejemplo.neto)}</b>).
        </p>
      </Seccion>

      <div className="flex flex-wrap items-center gap-3">
        {editable ? <>
          <button className="btn-primary" onClick={guardar}><Save size={16} /> Guardar prima vacacional</button>
          <button className="btn-secondary" onClick={() => { setCfg(CONFIG_PRIMA_LEY); setGuardado(false) }}><RotateCcw size={16} /> Restablecer valores de ley</button>
        </> : <span className="text-sm text-slate-500">Solo quien tiene permiso de edición en Configuración puede cambiarla.</span>}
        {guardado && <span className="text-sm font-semibold text-accent-700">✓ Guardado para {empresa.nombre}</span>}
      </div>
    </div>
  )
}
