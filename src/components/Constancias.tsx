import { useMemo, useState, type FormEvent } from 'react'
import { BadgeCheck, FileCheck2, GraduationCap, Plane, Printer, type LucideIcon } from 'lucide-react'
import { useStore } from '../store/Store'
import { TIPOS_CONSTANCIA, type Constancia, type TipoConstancia } from '../types'
import { hoy, nombreCompleto, uid } from '../lib/utils'
import { PREFIJO_FOLIO, TIENE_INGLES, abrirConstancia, htmlConstancia } from '../lib/plantillas'
import { Field, Input, Modal, Select, Textarea, cx } from './ui'
import { ColaboradorSelect } from './ColaboradorSelect'

export const INFO_CONSTANCIA: Record<TipoConstancia, { icon: LucideIcon; desc: string }> = {
  'Constancia laboral': { icon: BadgeCheck, desc: 'Acredita puesto, antigüedad y, opcionalmente, salario.' },
  'Carta patronal': { icon: FileCheck2, desc: 'Para créditos, arrendamientos y otros trámites.' },
  'Carta para visa': { icon: Plane, desc: 'Permiso de viaje y regreso garantizado. Español o inglés.' },
  'Carta para beca': { icon: GraduationCap, desc: 'Para trámites de beca del colaborador o sus hijos.' },
}

/** Siguiente folio: CL-2026-0001, por empresa, tipo y año. */
export function siguienteFolio(lista: Constancia[], empresaId: string, tipo: TipoConstancia, fecha: string) {
  const pref = `${PREFIJO_FOLIO[tipo]}-${fecha.slice(0, 4)}-`
  const max = lista.filter((k) => k.empresaId === empresaId && k.folio.startsWith(pref)).reduce((m, k) => Math.max(m, Number(k.folio.slice(pref.length)) || 0), 0)
  return pref + String(max + 1).padStart(4, '0')
}

export function ConstanciaForm({ onClose, colaboradorId, tipoInicial }: { onClose: () => void; colaboradorId?: string; tipoInicial?: TipoConstancia }) {
  const { db, empresa, usuario, guardarItem, puede } = useStore()
  const [k, setK] = useState<Constancia>(() => ({
    id: uid(), empresaId: empresa.id, colaboradorId: colaboradorId ?? '', tipo: tipoInicial ?? 'Constancia laboral', folio: '', fecha: hoy(),
    dirigidoA: '', incluirSalario: true, idioma: 'Español', motivoViaje: '',
    firmanteNombre: empresa.firmanteNombre ?? '', firmantePuesto: empresa.firmantePuesto ?? 'Recursos Humanos', emitidaPor: usuario.email,
  }))
  const set = <K extends keyof Constancia>(campo: K, v: Constancia[K]) => setK((p) => ({ ...p, [campo]: v }))
  const c = db.colaboradores.find((x) => x.id === k.colaboradorId)
  const folio = siguienteFolio(db.constancias, empresa.id, k.tipo, k.fecha)
  const contrato = useMemo(() => db.contratos.filter((x) => x.colaboradorId === k.colaboradorId && !x.cancelado).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0], [db.contratos, k.colaboradorId])
  const vista = c ? htmlConstancia({ k: { ...k, folio }, c, e: empresa, contrato }) : ''
  const ingles = TIENE_INGLES(k.tipo)

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!c) return
    const final: Constancia = { ...k, folio, idioma: ingles ? k.idioma : 'Español' }
    guardarItem('constancias', final, { colaboradorId: c.id, accion: `${k.tipo} emitida (folio ${folio}) para ${nombreCompleto(c)}` })
    if (puede('configuracion', 'editar') && final.firmanteNombre !== (empresa.firmanteNombre ?? '') || final.firmantePuesto !== (empresa.firmantePuesto ?? '')) {
      guardarItem('empresas', { ...empresa, firmanteNombre: final.firmanteNombre, firmantePuesto: final.firmantePuesto })
    }
    abrirConstancia({ k: final, c, e: empresa, contrato })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Generar constancia" wide
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-const" className="btn-accent" disabled={!c}><Printer size={16} /> Generar e imprimir</button></>}>
      <form id="form-const" onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_CONSTANCIA.map((t) => {
              const Icon = INFO_CONSTANCIA[t].icon
              return (
                <button type="button" key={t} onClick={() => set('tipo', t)}
                  className={cx('flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm font-semibold transition', k.tipo === t ? 'border-accent-500 bg-accent-50 text-primary-800' : 'border-slate-200 text-slate-600 hover:border-primary-300')}>
                  <Icon size={18} className={k.tipo === t ? 'text-accent-700' : 'text-primary-500'} /> {t}
                </button>
              )
            })}
          </div>
          {!colaboradorId && <Field label="Colaborador *"><ColaboradorSelect value={k.colaboradorId} onChange={(v) => set('colaboradorId', v)} required /></Field>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fecha de emisión"><Input type="date" required value={k.fecha} onChange={(e) => set('fecha', e.target.value)} /></Field>
            {ingles
              ? <Field label="Idioma"><Select value={k.idioma} onChange={(e) => set('idioma', e.target.value as Constancia['idioma'])}><option>Español</option><option>Inglés</option></Select></Field>
              : <Field label="Folio"><Input disabled value={folio} /></Field>}
          </div>
          <Field label="Dirigido a"><Input value={k.dirigidoA} onChange={(e) => set('dirigidoA', e.target.value)} placeholder={k.idioma === 'Inglés' && ingles ? 'To whom it may concern' : 'A quien corresponda'} /></Field>

          {k.tipo === 'Carta patronal' && (
            <Field label="Trámite"><Input value={k.tramite ?? ''} onChange={(e) => set('tramite', e.target.value)} placeholder="Ej. crédito hipotecario, arrendamiento, crédito automotriz" /></Field>
          )}
          {k.tipo === 'Carta para visa' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="País de destino *"><Input required value={k.pais ?? ''} onChange={(e) => set('pais', e.target.value)} placeholder={k.idioma === 'Inglés' ? 'United States' : 'Estados Unidos'} /></Field>
              <Field label="Motivo del viaje"><Input value={k.motivoViaje ?? ''} onChange={(e) => set('motivoViaje', e.target.value)} placeholder={k.idioma === 'Inglés' ? 'tourism' : 'turismo'} /></Field>
              <Field label="Viaje del *"><Input type="date" required value={k.viajeDesde ?? ''} onChange={(e) => set('viajeDesde', e.target.value)} /></Field>
              <Field label="Al *"><Input type="date" required min={k.viajeDesde} value={k.viajeHasta ?? ''} onChange={(e) => set('viajeHasta', e.target.value)} /></Field>
            </div>
          )}
          {k.tipo === 'Carta para beca' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institución *" className="sm:col-span-2"><Input required value={k.institucion ?? ''} onChange={(e) => set('institucion', e.target.value)} placeholder="Ej. Universidad, SEP, CONAHCYT" /></Field>
              <Field label="Beneficiario"><Input value={k.beneficiario ?? ''} onChange={(e) => set('beneficiario', e.target.value)} placeholder={c ? nombreCompleto(c) : 'El colaborador'} /></Field>
              <Field label="Parentesco"><Select value={k.parentesco ?? ''} onChange={(e) => set('parentesco', e.target.value)}><option value="">El propio colaborador</option><option>hijo</option><option>hija</option><option>cónyuge</option></Select></Field>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 accent-primary-600" checked={k.incluirSalario} onChange={(e) => set('incluirSalario', e.target.checked)} /> Incluir salario
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Firma (nombre)"><Input value={k.firmanteNombre} onChange={(e) => set('firmanteNombre', e.target.value)} placeholder="Lic. Nombre Apellido" /></Field>
            <Field label="Cargo de quien firma"><Input value={k.firmantePuesto} onChange={(e) => set('firmantePuesto', e.target.value)} /></Field>
          </div>
          <Field label="Observaciones (opcional, se agregan al texto)"><Textarea rows={2} value={k.observaciones ?? ''} onChange={(e) => set('observaciones', e.target.value)} /></Field>
          <p className="text-xs text-slate-500">Folio que se asignará: <b className="text-primary-700">{folio}</b>. La firma se recuerda para la empresa.</p>
        </div>

        <div>
          <span className="label">Vista previa</span>
          <div className="h-[520px] overflow-hidden rounded-lg border border-slate-300 bg-slate-200">
            {c ? <iframe title="Vista previa" srcDoc={vista} className="h-[1100px] w-[200%] origin-top-left scale-50 border-0" />
              : <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">Selecciona un colaborador para ver la vista previa.</div>}
          </div>
        </div>
      </form>
    </Modal>
  )
}
