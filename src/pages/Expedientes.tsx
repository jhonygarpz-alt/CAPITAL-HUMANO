import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Input, PageHeader, Progress, Select, Table, Tabs } from '../components/ui'
import { ListaDocumentos, SubirDocumento, porcentajeExpediente } from '../components/Documentos'
import { DOCUMENTOS_REQUERIDOS } from '../types'
import { nombreCompleto, normalizar } from '../lib/utils'

export default function Expedientes() {
  const { deEmpresa, db } = useStore()
  const [tab, setTab] = useState<'expedientes' | 'documentos'>('expedientes')
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('')
  const [subir, setSubir] = useState(false)
  const cols = deEmpresa('colaboradores').filter((c) => c.estatus !== 'Baja')
  const docs = deEmpresa('documentos')

  const filas = useMemo(() => cols
    .map((c) => ({ c, pct: porcentajeExpediente(db.documentos, c.id), faltan: DOCUMENTOS_REQUERIDOS.filter((t) => !db.documentos.some((d) => d.colaboradorId === c.id && d.tipo === t)) }))
    .filter((f) => !q || normalizar(nombreCompleto(f.c)).includes(normalizar(q)))
    .filter((f) => !filtro || (filtro === 'completos' ? f.pct === 100 : f.pct < 100))
    .sort((a, b) => a.pct - b.pct), [cols, db.documentos, q, filtro])

  const completos = cols.filter((c) => porcentajeExpediente(db.documentos, c.id) === 100).length

  return (
    <>
      <PageHeader title="Expedientes" subtitle={`${completos} de ${cols.length} expedientes completos · ${docs.length} documentos`}
        actions={<button className="btn-primary" onClick={() => setSubir(true)}><Upload size={16} /> Agregar documento</button>} />
      <div className="card overflow-hidden">
        <div className="px-4 pt-2"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'expedientes', label: 'Por colaborador' }, { id: 'documentos', label: 'Todos los documentos', count: docs.length }]} /></div>
        {tab === 'expedientes' ? (
          <>
            <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[1fr_200px]">
              <Input placeholder="Buscar colaborador…" value={q} onChange={(e) => setQ(e.target.value)} />
              <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="">Todos</option><option value="incompletos">Incompletos</option><option value="completos">Completos</option></Select>
            </div>
            {filas.length === 0 ? <Empty title="Sin resultados" /> : (
              <Table head={<><th className="th">Colaborador</th><th className="th w-48">Avance</th><th className="th hidden lg:table-cell">Documentos faltantes</th><th className="th">Estado</th></>}>
                {filas.map(({ c, pct, faltan }) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="td"><Link to={`/colaboradores/${c.id}?tab=expediente`} className="flex items-center gap-3 font-medium hover:text-primary-600"><Avatar c={c} size={30} />{nombreCompleto(c)}</Link></td>
                    <td className="td"><div className="flex items-center gap-2"><Progress value={pct} /><span className="w-10 text-xs text-slate-500">{pct}%</span></div></td>
                    <td className="td hidden max-w-sm truncate text-xs text-slate-500 lg:table-cell">{faltan.join(', ') || '—'}</td>
                    <td className="td"><Badge>{pct === 100 ? 'Completo' : 'Incompleto'}</Badge></td>
                  </tr>
                ))}
              </Table>
            )}
          </>
        ) : <ListaDocumentos docs={docs} mostrarColaborador onAgregar={() => setSubir(true)} />}
      </div>
      {subir && <SubirDocumento open onClose={() => setSubir(false)} />}
    </>
  )
}
