import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Printer, Trash2, Upload, UserX } from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, Empty, Table, Tabs, confirmar } from '../components/ui'
import { ColaboradorForm } from '../components/ColaboradorForm'
import { ExpedienteColaborador, ListaDocumentos, SubirDocumento, porcentajeExpediente } from '../components/Documentos'
import { ContratoForm, imprimirContrato } from '../components/Contratos'
import { VacacionForm, saldoVacaciones } from '../components/Vacaciones'
import { IncidenciaForm, cantidadTexto } from '../components/Incidencias'
import { antiguedadTexto, estadoContrato, fmtFecha, fmtMoney, hoy, nombreCompleto } from '../lib/utils'

type Tab = 'general' | 'expediente' | 'documentos' | 'contratos' | 'vacaciones' | 'incidencias' | 'nomina' | 'historial'

export default function ColaboradorDetalle() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const { db, guardarItem, eliminarItem } = useStore()
  const [modal, setModal] = useState<null | 'editar' | 'doc' | 'contrato' | 'vac' | 'inc'>(null)
  const c = db.colaboradores.find((x) => x.id === id)
  if (!c) return <Empty title="Colaborador no encontrado" action={<Link to="/colaboradores" className="btn-primary">Volver</Link>} />

  const tab = (sp.get('tab') as Tab) || 'general'
  const docs = db.documentos.filter((d) => d.colaboradorId === c.id)
  const contratos = db.contratos.filter((k) => k.colaboradorId === c.id)
  const vacs = db.vacaciones.filter((v) => v.colaboradorId === c.id)
  const incs = db.incidencias.filter((i) => i.colaboradorId === c.id)
  const recibos = db.nominas.flatMap((n) => n.recibos.filter((r) => r.colaboradorId === c.id).map((r) => ({ n, r })))
  const eventos = db.eventos.filter((e) => e.colaboradorId === c.id).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const saldo = saldoVacaciones(c, db.vacaciones)

  const darDeBaja = () => {
    const motivo = window.prompt('Motivo de la baja (ej. Renuncia voluntaria):', 'Renuncia voluntaria')
    if (motivo === null) return
    guardarItem('colaboradores', { ...c, estatus: 'Baja', fechaBaja: hoy(), motivoBaja: motivo }, { colaboradorId: c.id, accion: `Baja de ${nombreCompleto(c)}: ${motivo}` })
  }
  const eliminar = () => {
    if (!confirmar(`¿Eliminar definitivamente a ${nombreCompleto(c)} y toda su información? Esta acción no se puede deshacer.\n\nSugerencia: usa "Dar de baja" para conservar el historial.`)) return
    eliminarItem('colaboradores', c.id)
    nav('/colaboradores')
  }

  const Dato = ({ l, v }: { l: string; v?: string | number }) => (
    <div><dt className="text-xs text-slate-500">{l}</dt><dd className="mt-0.5 text-sm font-medium text-slate-800">{v || '—'}</dd></div>
  )

  return (
    <>
      <Link to="/colaboradores" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600"><ArrowLeft size={16} /> Colaboradores</Link>
      <div className="card mb-6 flex flex-wrap items-center gap-5 p-5">
        <Avatar c={c} size={84} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-slate-900">{nombreCompleto(c)}</h1><Badge>{c.estatus}</Badge></div>
          <p className="text-sm text-slate-600">{c.puesto} · {c.departamento}</p>
          <p className="mt-1 text-xs text-slate-500">{c.numero} · Ingreso {fmtFecha(c.fechaIngreso)} · {antiguedadTexto(c.fechaIngreso)} de antigüedad</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => setModal('editar')}><Pencil size={16} /> Editar</button>
          {c.estatus !== 'Baja' && <button className="btn-secondary" onClick={darDeBaja}><UserX size={16} /> Dar de baja</button>}
          <button className="btn-ghost text-rose-600" onClick={eliminar} aria-label="Eliminar"><Trash2 size={16} /></button>
        </div>
      </div>

      <Tabs<Tab> value={tab} onChange={(t) => setSp({ tab: t }, { replace: true })} tabs={[
        { id: 'general', label: 'Datos generales' },
        { id: 'expediente', label: `Expediente ${porcentajeExpediente(db.documentos, c.id)}%` },
        { id: 'documentos', label: 'Documentos', count: docs.length },
        { id: 'contratos', label: 'Contratos', count: contratos.length },
        { id: 'vacaciones', label: 'Vacaciones', count: vacs.length },
        { id: 'incidencias', label: 'Incidencias', count: incs.length },
        { id: 'nomina', label: 'Nómina', count: recibos.length },
        { id: 'historial', label: 'Historial' },
      ]} />

      <div className="mt-6">
        {tab === 'general' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5"><h3 className="mb-4 font-semibold">Datos personales</h3>
              <dl className="grid grid-cols-2 gap-4">
                <Dato l="Fecha de nacimiento" v={fmtFecha(c.fechaNacimiento)} /><Dato l="Género" v={c.genero} />
                <Dato l="CURP" v={c.curp} /><Dato l="RFC" v={c.rfc} /><Dato l="NSS" v={c.nss} /><Dato l="Teléfono" v={c.telefono} />
                <div className="col-span-2"><Dato l="Correo" v={c.email} /></div><div className="col-span-2"><Dato l="Domicilio" v={c.direccion} /></div>
              </dl>
            </div>
            <div className="card p-5"><h3 className="mb-4 font-semibold">Datos laborales</h3>
              <dl className="grid grid-cols-2 gap-4">
                <Dato l="Puesto" v={c.puesto} /><Dato l="Departamento" v={c.departamento} />
                <Dato l="Fecha de ingreso" v={fmtFecha(c.fechaIngreso)} /><Dato l="Antigüedad" v={antiguedadTexto(c.fechaIngreso)} />
                <Dato l="Salario diario" v={fmtMoney(c.salarioDiario)} /><Dato l="Salario mensual aprox." v={fmtMoney(c.salarioDiario * 30.4)} />
                <Dato l="Banco" v={c.banco} /><Dato l="Cuenta / CLABE" v={c.cuenta} />
                <Dato l="Contacto de emergencia" v={c.contactoEmergencia} /><Dato l="Tel. emergencia" v={c.telefonoEmergencia} />
                {c.estatus === 'Baja' && <><Dato l="Fecha de baja" v={fmtFecha(c.fechaBaja)} /><Dato l="Motivo de baja" v={c.motivoBaja} /></>}
              </dl>
            </div>
          </div>
        )}

        {tab === 'expediente' && <ExpedienteColaborador c={c} />}

        {tab === 'documentos' && (
          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="font-semibold">Documentos</h3><button className="btn-primary" onClick={() => setModal('doc')}><Upload size={16} /> Agregar</button></div>
            <ListaDocumentos docs={docs} onAgregar={() => setModal('doc')} />
          </div>
        )}

        {tab === 'contratos' && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="font-semibold">Contratos</h3><button className="btn-primary" onClick={() => setModal('contrato')}><Plus size={16} /> Nuevo contrato</button></div>
            {contratos.length === 0 ? <Empty title="Sin contratos registrados" /> : (
              <Table head={<><th className="th">Tipo</th><th className="th">Puesto</th><th className="th">Salario</th><th className="th">Vigencia</th><th className="th">Estado</th><th className="th" /></>}>
                {contratos.map((k) => (
                  <tr key={k.id}>
                    <td className="td font-medium">{k.tipo}</td><td className="td">{k.puesto}</td><td className="td">{fmtMoney(k.salarioDiario)}/día</td>
                    <td className="td text-slate-500">{fmtFecha(k.fechaInicio)} – {k.fechaFin ? fmtFecha(k.fechaFin) : 'Indefinido'}</td>
                    <td className="td"><Badge>{estadoContrato(k)}</Badge></td>
                    <td className="td text-right"><button className="btn-ghost" onClick={() => imprimirContrato(k, db)}><Printer size={16} /> Imprimir</button></td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        )}

        {tab === 'vacaciones' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              {[['Años cumplidos', saldo.anios], ['Días que corresponden', saldo.dias], ['Días tomados', saldo.usados], ['Días disponibles', saldo.disponibles]].map(([l, v]) => (
                <div key={l} className="card p-4"><div className="text-2xl font-bold text-primary-700">{v}</div><div className="text-xs text-slate-500">{l}</div></div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Periodo vigente: {fmtFecha(saldo.inicio)} – {fmtFecha(saldo.fin)} (según Ley Federal del Trabajo, reforma 2023).</p>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="font-semibold">Solicitudes</h3><button className="btn-primary" onClick={() => setModal('vac')}><Plus size={16} /> Nueva solicitud</button></div>
              {vacs.length === 0 ? <Empty title="Sin solicitudes de vacaciones" /> : (
                <Table head={<><th className="th">Periodo</th><th className="th">Días</th><th className="th">Solicitada</th><th className="th">Estatus</th></>}>
                  {vacs.sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)).map((v) => (
                    <tr key={v.id}><td className="td">{fmtFecha(v.fechaInicio)} – {fmtFecha(v.fechaFin)}</td><td className="td">{v.dias}</td><td className="td text-slate-500">{fmtFecha(v.fechaSolicitud)}</td><td className="td"><Badge>{v.estatus}</Badge></td></tr>
                  ))}
                </Table>
              )}
            </div>
          </div>
        )}

        {tab === 'incidencias' && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="font-semibold">Incidencias</h3><button className="btn-primary" onClick={() => setModal('inc')}><Plus size={16} /> Registrar</button></div>
            {incs.length === 0 ? <Empty title="Sin incidencias" /> : (
              <Table head={<><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Cantidad</th><th className="th">Descripción</th><th className="th">Estatus</th></>}>
                {incs.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((i) => (
                  <tr key={i.id}><td className="td">{fmtFecha(i.fecha)}</td><td className="td font-medium">{i.tipo}</td><td className="td">{cantidadTexto(i)}</td><td className="td max-w-xs truncate text-slate-500">{i.descripcion}</td><td className="td"><Badge>{i.estatus}</Badge></td></tr>
                ))}
              </Table>
            )}
          </div>
        )}

        {tab === 'nomina' && (
          <div className="card overflow-hidden">
            {recibos.length === 0 ? <Empty title="Sin recibos de nómina" text="Los recibos aparecen aquí cuando se calcula una nómina que incluye a este colaborador." /> : (
              <Table head={<><th className="th">Periodo</th><th className="th">Percepciones</th><th className="th">Deducciones</th><th className="th">Neto</th><th className="th">Estatus</th></>}>
                {recibos.map(({ n, r }) => (
                  <tr key={n.id}><td className="td"><Link className="font-medium text-primary-700 hover:underline" to={`/nomina/${n.id}`}>{n.nombre}</Link></td><td className="td">{fmtMoney(r.totalPercepciones)}</td><td className="td">{fmtMoney(r.totalDeducciones)}</td><td className="td font-semibold">{fmtMoney(r.neto)}</td><td className="td"><Badge>{n.estatus}</Badge></td></tr>
                ))}
              </Table>
            )}
          </div>
        )}

        {tab === 'historial' && (
          <div className="card p-5">
            {eventos.length === 0 ? <Empty title="Sin movimientos registrados" /> : (
              <ol className="relative space-y-5 border-l border-slate-200 pl-6">
                {eventos.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary-500" />
                    <p className="text-sm font-medium text-slate-800">{e.accion}</p>
                    <p className="text-xs text-slate-500">{fmtFecha(e.fecha.slice(0, 10))}{e.fecha.length > 10 ? ` · ${e.fecha.slice(11, 16)}` : ''} · {e.modulo}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {modal === 'editar' && <ColaboradorForm open inicial={c} onClose={() => setModal(null)} />}
      {modal === 'doc' && <SubirDocumento open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'contrato' && <ContratoForm open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'vac' && <VacacionForm open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'inc' && <IncidenciaForm open colaboradorId={c.id} onClose={() => setModal(null)} />}
    </>
  )
}
