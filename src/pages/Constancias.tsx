import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileStack, Plus, Printer, Trash2 } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Empty, Input, PageHeader, Seccion, Select, Table, confirmar } from '../components/ui'
import { ConstanciaForm, INFO_CONSTANCIA } from '../components/Constancias'
import { abrirConstancia } from '../lib/plantillas'
import { descargarCSV, fmtFecha, nombreCompleto, normalizar } from '../lib/utils'
import { TIPOS_CONSTANCIA, type Constancia, type TipoConstancia } from '../types'

export function reimprimir(k: Constancia, db: ReturnType<typeof useStore>['db']) {
  const c = db.colaboradores.find((x) => x.id === k.colaboradorId)
  const e = db.empresas.find((x) => x.id === k.empresaId)
  if (!c || !e) return alert('El colaborador o la empresa ya no existen.')
  const contrato = db.contratos.filter((x) => x.colaboradorId === c.id && !x.cancelado).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0]
  abrirConstancia({ k, c, e, contrato })
}

export const detalleConstancia = (k: Constancia) =>
  k.tipo === 'Carta para visa' ? `${k.pais ?? ''} · ${fmtFecha(k.viajeDesde)} al ${fmtFecha(k.viajeHasta)}`
    : k.tipo === 'Carta para beca' ? k.institucion ?? ''
      : k.tipo === 'Carta patronal' ? k.tramite || k.dirigidoA || 'A quien corresponda'
        : k.dirigidoA || 'A quien corresponda'

export default function Constancias() {
  const { deEmpresa, db, eliminarItem, empresa } = useStore()
  const [form, setForm] = useState<{ tipo?: TipoConstancia } | null>(null)
  const [tipo, setTipo] = useState('')
  const [q, setQ] = useState('')
  const lista = deEmpresa('constancias')
  const colMap = new Map(db.colaboradores.map((c) => [c.id, c]))
  const anio = new Date().getFullYear().toString()
  const filas = useMemo(() => lista
    .filter((k) => !tipo || k.tipo === tipo)
    .filter((k) => { const c = colMap.get(k.colaboradorId); return !q || normalizar(`${k.folio} ${c ? nombreCompleto(c) : ''} ${detalleConstancia(k)}`).includes(normalizar(q)) })
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.folio.localeCompare(a.folio)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [lista, tipo, q, db.colaboradores])

  const exportar = () => descargarCSV(`constancias-${empresa.nombre}`, filas.map((k) => {
    const c = colMap.get(k.colaboradorId)
    return { Folio: k.folio, Fecha: k.fecha, Tipo: k.tipo, Colaborador: c ? nombreCompleto(c) : '', Detalle: detalleConstancia(k), Idioma: k.idioma, Firma: k.firmanteNombre, 'Emitida por': k.emitidaPor }
  }))

  return (
    <>
      <PageHeader title="Constancias" subtitle="Constancias laborales, cartas patronales y cartas para visa o beca, con folio de control"
        actions={<>
          <button className="btn-secondary" onClick={exportar} disabled={!filas.length}><Download size={16} /> Exportar</button>
          <button className="btn-accent" onClick={() => setForm({})}><Plus size={16} /> Nueva constancia</button>
        </>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TIPOS_CONSTANCIA.map((t) => {
          const { icon: Icon, desc } = INFO_CONSTANCIA[t]
          const n = lista.filter((k) => k.tipo === t && k.fecha.startsWith(anio)).length
          return (
            <button key={t} onClick={() => setForm({ tipo: t })} className="card group flex flex-col border-b-4 border-b-accent-500 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-white"><Icon size={24} /></span>
                <span className="text-right"><b className="block text-2xl font-extrabold text-primary-700">{n}</b><span className="text-xs text-slate-500">en {anio}</span></span>
              </div>
              <h3 className="mt-3 font-bold text-primary-800">{t}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-700 group-hover:underline"><Plus size={15} /> Generar</span>
            </button>
          )
        })}
      </div>

      <Seccion titulo="Constancias emitidas" icon={FileStack}>
        <div className="grid gap-2 border-b border-slate-200 p-4 sm:grid-cols-[1fr_220px]">
          <Input placeholder="Buscar por folio, colaborador o detalle…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos los tipos</option>{TIPOS_CONSTANCIA.map((t) => <option key={t}>{t}</option>)}</Select>
        </div>
        {filas.length === 0 ? <Empty title="Aún no hay constancias emitidas" text="Elige un tipo de documento arriba para generar la primera." /> : (
          <Table head={<><th className="th">Folio</th><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Colaborador</th><th className="th hidden lg:table-cell">Detalle</th><th className="th hidden xl:table-cell">Emitida por</th><th className="th" /></>}>
            {filas.map((k) => {
              const c = colMap.get(k.colaboradorId)
              return (
                <tr key={k.id} className="hover:bg-accent-50">
                  <td className="td font-mono font-semibold text-primary-700">{k.folio}</td>
                  <td className="td">{fmtFecha(k.fecha)}</td>
                  <td className="td">{k.tipo}{k.idioma === 'Inglés' && <span className="ml-1 rounded bg-primary-50 px-1.5 text-xs font-semibold text-primary-700">EN</span>}</td>
                  <td className="td">{c ? <Link to={`/colaboradores/${c.id}?tab=constancias`} className="flex items-center gap-2 font-semibold hover:text-primary-600"><Avatar c={c} size={28} />{nombreCompleto(c)}</Link> : '—'}</td>
                  <td className="td hidden max-w-xs truncate text-slate-600 lg:table-cell">{detalleConstancia(k)}</td>
                  <td className="td hidden text-slate-500 xl:table-cell">{k.emitidaPor}</td>
                  <td className="td text-right">
                    <button className="btn-ghost" title="Reimprimir" onClick={() => reimprimir(k, db)}><Printer size={16} /></button>
                    <button className="btn-ghost text-rose-600" title="Eliminar del registro" onClick={() => confirmar(`¿Eliminar del registro la constancia ${k.folio}?`) && eliminarItem('constancias', k.id, { colaboradorId: k.colaboradorId, accion: `Constancia ${k.folio} eliminada del registro` })}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </Seccion>
      {form && <ConstanciaForm tipoInicial={form.tipo} onClose={() => setForm(null)} />}
    </>
  )
}
