import { useState, type FormEvent } from 'react'
import { CheckCircle2, Circle, Download, Eye, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useStore } from '../store/Store'
import { DOCUMENTOS_REQUERIDOS, TIPOS_DOCUMENTO, type Colaborador, type Documento } from '../types'
import { fmtFecha, fmtTamano, hoy, nombreCompleto, uid } from '../lib/utils'
import { supabase, BUCKET } from '../lib/supabase'
import { Empty, Field, Input, Modal, Progress, Select, Textarea, confirmar } from './ui'
import { ColaboradorSelect } from './ColaboradorSelect'

const MAX_MB = 8

export function porcentajeExpediente(docs: Documento[], colaboradorId: string) {
  const tipos = new Set(docs.filter((d) => d.colaboradorId === colaboradorId).map((d) => d.tipo))
  const ok = DOCUMENTOS_REQUERIDOS.filter((t) => tipos.has(t)).length
  return Math.round((ok / DOCUMENTOS_REQUERIDOS.length) * 100)
}

export function SubirDocumento({ open, onClose, colaboradorId, tipo }: { open: boolean; onClose: () => void; colaboradorId?: string; tipo?: string }) {
  const { empresa, db, guardarItem } = useStore()
  const [d, setD] = useState<Documento>({ id: uid(), empresaId: empresa.id, colaboradorId: colaboradorId ?? '', tipo: tipo ?? TIPOS_DOCUMENTO[0], nombre: '', fecha: hoy() })
  const [error, setError] = useState('')
  const [file, setFile] = useState<File>()
  const [subiendo, setSubiendo] = useState(false)
  const archivo = (f?: File) => {
    if (!f) return
    if (f.size > MAX_MB * 1048576) return setError(`El archivo supera ${MAX_MB} MB.`)
    setError('')
    setFile(f)
    setD({ ...d, mime: f.type, tamano: f.size, nombre: d.nombre || f.name })
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!d.colaboradorId) return setError('Selecciona un colaborador.')
    let doc: Documento = { ...d, nombre: d.nombre || d.tipo }
    if (file) {
      setSubiendo(true)
      const limpio = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')
      const ruta = `${d.empresaId}/${d.colaboradorId}/${d.id}-${limpio}`
      const { error: err } = await supabase.storage.from(BUCKET).upload(ruta, file, { contentType: file.type || undefined, upsert: true })
      setSubiendo(false)
      if (err) return setError(`No se pudo subir el archivo: ${err.message}`)
      doc = { ...doc, ruta }
    }
    const c = db.colaboradores.find((x) => x.id === d.colaboradorId)
    guardarItem('documentos', doc, { colaboradorId: d.colaboradorId, accion: `Documento "${d.tipo}" agregado al expediente de ${c ? nombreCompleto(c) : ''}` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Agregar documento"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancelar</button><button form="form-doc" className="btn-primary" disabled={subiendo}>{subiendo && <Loader2 size={16} className="animate-spin" />}{subiendo ? 'Subiendo…' : 'Guardar'}</button></>}>
      <form id="form-doc" onSubmit={submit} className="space-y-3">
        {!colaboradorId && <Field label="Colaborador *"><ColaboradorSelect value={d.colaboradorId} onChange={(v) => setD({ ...d, colaboradorId: v })} incluirBajas required /></Field>}
        <Field label="Tipo de documento">
          <Select value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value })}>{TIPOS_DOCUMENTO.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-primary-300 hover:bg-primary-50/40">
          <Upload className="text-primary-500" />
          <span className="text-sm font-medium">{d.tamano ? `${d.nombre} (${fmtTamano(d.tamano)})` : 'Haz clic para seleccionar un archivo'}</span>
          <span className="text-xs text-slate-400">PDF, imagen o documento · máx. {MAX_MB} MB (opcional)</span>
          <input type="file" className="hidden" accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={(e) => archivo(e.target.files?.[0])} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre"><Input value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} placeholder={d.tipo} /></Field>
          <Field label="Fecha"><Input type="date" value={d.fecha} onChange={(e) => setD({ ...d, fecha: e.target.value })} /></Field>
        </div>
        <Field label="Notas"><Textarea value={d.notas ?? ''} onChange={(e) => setD({ ...d, notas: e.target.value })} /></Field>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}

export const tieneArchivo = (d: Documento) => Boolean(d.ruta || d.archivo)

export async function abrirDocumento(d: Documento, descargar = false) {
  if (!tieneArchivo(d)) return alert('Este registro no tiene archivo adjunto.')
  // Abrimos la ventana antes de esperar a la red para que el navegador no la bloquee
  const w = descargar ? null : window.open('', '_blank')
  let url = d.archivo ?? ''
  if (d.ruta) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.ruta, 300, descargar ? { download: d.nombre } : undefined)
    if (error || !data) { w?.close(); return alert('No se pudo obtener el archivo.') }
    url = data.signedUrl
  }
  if (descargar) {
    const a = document.createElement('a')
    a.href = url
    a.download = d.nombre
    a.click()
    return
  }
  if (!w) return alert('Permite las ventanas emergentes para ver el documento.')
  if (d.ruta) { w.location.href = url; return }
  w.document.title = d.nombre
  w.document.body.style.margin = '0'
  w.document.body.innerHTML = d.mime?.startsWith('image/')
    ? `<img src="${url}" style="max-width:100%">`
    : `<iframe src="${url}" style="border:0;width:100%;height:100vh"></iframe>`
}

export function ExpedienteColaborador({ c }: { c: Colaborador }) {
  const { db, eliminarItem } = useStore()
  const [subir, setSubir] = useState<string | null>(null)
  const docs = db.documentos.filter((d) => d.colaboradorId === c.id)
  const pct = porcentajeExpediente(db.documentos, c.id)
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">Expediente completo al {pct}%</span><span className="text-slate-500">{DOCUMENTOS_REQUERIDOS.filter((t) => docs.some((d) => d.tipo === t)).length} de {DOCUMENTOS_REQUERIDOS.length} documentos requeridos</span></div>
        <Progress value={pct} />
      </div>
      <div className="card divide-y divide-slate-100">
        {DOCUMENTOS_REQUERIDOS.map((t) => {
          const doc = docs.find((d) => d.tipo === t)
          return (
            <div key={t} className="flex items-center gap-3 px-4 py-3">
              {doc ? <CheckCircle2 className="shrink-0 text-emerald-500" size={20} /> : <Circle className="shrink-0 text-slate-300" size={20} />}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{t}</div>
                <div className="text-xs text-slate-500">{doc ? `${doc.nombre} · ${fmtFecha(doc.fecha)}` : 'Pendiente de entregar'}</div>
              </div>
              {doc ? (
                <div className="flex gap-1">
                  {tieneArchivo(doc) && <button className="btn-ghost" onClick={() => abrirDocumento(doc)} aria-label="Ver"><Eye size={16} /></button>}
                  <button className="btn-ghost text-rose-600" onClick={() => confirmar('¿Eliminar este documento?') && eliminarItem('documentos', doc.id, { colaboradorId: c.id, accion: `Documento "${doc.tipo}" eliminado` })} aria-label="Eliminar"><Trash2 size={16} /></button>
                </div>
              ) : (
                <button className="btn-secondary py-1.5" onClick={() => setSubir(t)}><Upload size={14} /> Subir</button>
              )}
            </div>
          )
        })}
      </div>
      {subir && <SubirDocumento open colaboradorId={c.id} tipo={subir} onClose={() => setSubir(null)} />}
    </div>
  )
}

export function ListaDocumentos({ docs, mostrarColaborador, onAgregar }: { docs: Documento[]; mostrarColaborador?: boolean; onAgregar?: () => void }) {
  const { db, eliminarItem } = useStore()
  if (!docs.length) return <Empty title="Sin documentos" text="Aún no se han cargado documentos." action={onAgregar && <button className="btn-primary" onClick={onAgregar}><Upload size={16} /> Agregar documento</button>} />
  return (
    <div className="divide-y divide-slate-100">
      {docs.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((d) => {
        const c = db.colaboradores.find((x) => x.id === d.colaboradorId)
        return (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><FileText size={18} /></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{d.nombre}</div>
              <div className="truncate text-xs text-slate-500">{d.tipo}{mostrarColaborador && c ? ` · ${nombreCompleto(c)}` : ''} · {fmtFecha(d.fecha)} {d.tamano ? `· ${fmtTamano(d.tamano)}` : ''}</div>
            </div>
            {tieneArchivo(d) && <>
              <button className="btn-ghost" onClick={() => abrirDocumento(d)} aria-label="Ver"><Eye size={16} /></button>
              <button className="btn-ghost" onClick={() => abrirDocumento(d, true)} aria-label="Descargar"><Download size={16} /></button>
            </>}
            <button className="btn-ghost text-rose-600" onClick={() => confirmar('¿Eliminar este documento?') && eliminarItem('documentos', d.id, { colaboradorId: d.colaboradorId, accion: `Documento "${d.nombre}" eliminado` })} aria-label="Eliminar"><Trash2 size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}
