import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Pencil, Plus, Printer, Trash2, Upload, UserMinus, Info, FolderOpen, FileText, FileSignature, CalendarDays, AlertTriangle, Coins, History,
  Stamp, UserRound, CalendarRange, IdCard, ShieldCheck, Mail, MapPin, Phone, Briefcase, Network, DollarSign, Landmark, CreditCard, Clock, Users, Wallet, LogOut,
} from 'lucide-react'
import { useStore } from '../store/Store'
import { Avatar, Badge, DatoFila, Empty, Seccion, Table, Tabs, confirmar } from '../components/ui'
import { ColaboradorForm } from '../components/ColaboradorForm'
import { ExpedienteColaborador, ListaDocumentos, SubirDocumento, porcentajeExpediente } from '../components/Documentos'
import { ContratoForm, imprimirContrato } from '../components/Contratos'
import { VacacionForm, saldoVacaciones } from '../components/Vacaciones'
import { IncidenciaForm, cantidadTexto } from '../components/Incidencias'
import { ConstanciaForm } from '../components/Constancias'
import { detalleConstancia, reimprimir } from './Constancias'
import { imprimirRecibos } from './Nomina'
import PrestamosPanel from './Prestamos'
import { antiguedadTexto, estadoContrato, fmtFecha, fmtMoney, hoy, nombreCompleto } from '../lib/utils'

type Tab = 'general' | 'expediente' | 'documentos' | 'contratos' | 'constancias' | 'vacaciones' | 'incidencias' | 'nomina' | 'historial'

export default function ColaboradorDetalle() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const { db, guardarItem, eliminarItem } = useStore()
  const [modal, setModal] = useState<null | 'editar' | 'doc' | 'contrato' | 'vac' | 'inc' | 'constancia'>(null)
  const c = db.colaboradores.find((x) => x.id === id)
  if (!c) return <Empty title="Colaborador no encontrado" action={<Link to="/colaboradores" className="btn-primary">Volver</Link>} />

  const tab = (sp.get('tab') as Tab) || 'general'
  const docs = db.documentos.filter((d) => d.colaboradorId === c.id)
  const contratos = db.contratos.filter((k) => k.colaboradorId === c.id)
  const vacs = db.vacaciones.filter((v) => v.colaboradorId === c.id)
  const consts = db.constancias.filter((k) => k.colaboradorId === c.id).sort((a, b) => b.fecha.localeCompare(a.fecha))
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
  const btnSeccion = (label: string, onClick: () => void, Icon = Plus) => (
    <button className="btn border border-accent-600 bg-accent-500 py-1.5 text-sm text-primary-900 hover:bg-accent-400" onClick={onClick}><Icon size={16} /> {label}</button>
  )

  return (
    <>
      {/* Encabezado de la ficha */}
      <div className="relative mb-6 overflow-hidden rounded-xl bg-primary-600 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-5 p-5 sm:gap-7 sm:p-6">
          <Avatar c={c} size={132} cuadrado />
          <span className="hidden h-28 w-px bg-white/30 md:block" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-marca text-2xl font-extrabold sm:text-[34px] sm:leading-tight">{nombreCompleto(c)}</h1>
              <Badge solido className="px-3 py-1 text-sm">{c.estatus}</Badge>
            </div>
            <p className="mt-1 text-lg text-white/90 sm:text-xl">{c.puesto} · {c.departamento}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-white/85">
              <span>ID: {c.numero}</span><span className="hidden text-white/40 sm:inline">|</span>
              <span>Ingreso: {fmtFecha(c.fechaIngreso)}</span><span className="hidden text-white/40 sm:inline">|</span>
              <span>Antigüedad: {antiguedadTexto(c.fechaIngreso)}</span>
            </p>
          </div>
          <span className="hidden h-20 w-px bg-white/30 xl:block" />
          <div className="flex flex-wrap gap-3">
            <button className="btn-accent px-5 py-2.5 text-base" onClick={() => setModal('editar')}><Pencil size={18} /> Editar</button>
            <button className="btn-outline-light px-5 py-2.5 text-base" onClick={() => setModal('constancia')}><Stamp size={18} /> Constancia</button>
            {c.estatus !== 'Baja' && <button className="btn-outline-light px-5 py-2.5 text-base" onClick={darDeBaja}><UserMinus size={18} /> Dar de baja</button>}
            <button className="btn-outline-light px-3 py-2.5" onClick={eliminar} aria-label="Eliminar colaborador" title="Eliminar"><Trash2 size={18} /></button>
          </div>
        </div>
        <div className="h-2 bg-accent-500" />
      </div>

      <Tabs<Tab> value={tab} onChange={(t) => setSp({ tab: t }, { replace: true })} tabs={[
        { id: 'general', label: 'Información', icon: Info },
        { id: 'expediente', label: 'Expediente', icon: FolderOpen, count: `${porcentajeExpediente(db.documentos, c.id)}%` },
        { id: 'documentos', label: 'Documentos', icon: FileText, count: docs.length },
        { id: 'contratos', label: 'Contratos', icon: FileSignature, count: contratos.length },
        { id: 'constancias', label: 'Constancias', icon: Stamp, count: consts.length },
        { id: 'vacaciones', label: 'Vacaciones', icon: CalendarDays, count: vacs.length },
        { id: 'incidencias', label: 'Incidencias', icon: AlertTriangle, count: incs.length },
        { id: 'nomina', label: 'Nómina', icon: Coins, count: recibos.length },
        { id: 'historial', label: 'Historial', icon: History },
      ]} />

      <div className="mt-6 space-y-6">
        {tab === 'general' && (
          <>
            <Seccion titulo="Datos personales" icon={UserRound}>
              <div className="grid gap-x-10 px-5 py-3 lg:grid-cols-2 lg:divide-x lg:divide-slate-200 [&>div+div]:lg:pl-10">
                <div>
                  <DatoFila icon={CalendarRange} label="Fecha de nacimiento" value={fmtFecha(c.fechaNacimiento)} />
                  <DatoFila icon={IdCard} label="CURP" value={c.curp} />
                  <DatoFila icon={ShieldCheck} label="NSS" value={c.nss} />
                  <DatoFila icon={Mail} label="Correo" value={c.email} />
                  <DatoFila icon={MapPin} label="Domicilio" value={c.direccion} />
                </div>
                <div>
                  <DatoFila icon={UserRound} label="Género" value={c.genero} />
                  <DatoFila icon={IdCard} label="RFC" value={c.rfc} />
                  <DatoFila icon={Phone} label="Teléfono" value={c.telefono} />
                </div>
              </div>
            </Seccion>

            <Seccion titulo="Datos laborales" icon={Briefcase}>
              <div className="grid gap-x-10 px-5 py-3 lg:grid-cols-2 lg:divide-x lg:divide-slate-200 [&>div+div]:lg:pl-10">
                <div>
                  <DatoFila icon={UserRound} label="Puesto" value={c.puesto} />
                  <DatoFila icon={CalendarRange} label="Fecha de ingreso" value={fmtFecha(c.fechaIngreso)} />
                  <DatoFila icon={DollarSign} label="Salario diario" value={fmtMoney(c.salarioDiario)} />
                  {c.estatus === 'Baja' && <DatoFila icon={LogOut} label="Fecha de baja" value={fmtFecha(c.fechaBaja)} />}
                </div>
                <div>
                  <DatoFila icon={Network} label="Departamento" value={c.departamento} />
                  <DatoFila icon={Clock} label="Antigüedad" value={antiguedadTexto(c.fechaIngreso)} />
                  <DatoFila icon={Wallet} label="Salario mensual aprox." value={fmtMoney(c.salarioDiario * 30.4)} />
                  {c.estatus === 'Baja' && <DatoFila icon={Info} label="Motivo de baja" value={c.motivoBaja} />}
                </div>
              </div>
            </Seccion>

            <div className="grid gap-6 lg:grid-cols-2">
              <Seccion titulo="Datos bancarios" icon={Landmark}>
                <div className="px-5 py-3">
                  <DatoFila icon={Landmark} label="Banco" value={c.banco} />
                  <DatoFila icon={CreditCard} label="Cuenta / CLABE" value={c.cuenta} />
                </div>
              </Seccion>
              <Seccion titulo="Contacto de emergencia" icon={Phone}>
                <div className="px-5 py-3">
                  <DatoFila icon={Users} label="Contacto de emergencia" value={c.contactoEmergencia} />
                  <DatoFila icon={Phone} label="Tel. emergencia" value={c.telefonoEmergencia} />
                </div>
              </Seccion>
            </div>
          </>
        )}

        {tab === 'expediente' && <ExpedienteColaborador c={c} />}

        {tab === 'documentos' && (
          <Seccion titulo="Documentos" icon={FileText} acciones={btnSeccion('Agregar', () => setModal('doc'), Upload)}>
            <ListaDocumentos docs={docs} onAgregar={() => setModal('doc')} />
          </Seccion>
        )}

        {tab === 'contratos' && (
          <Seccion titulo="Contratos" icon={FileSignature} acciones={btnSeccion('Nuevo contrato', () => setModal('contrato'))}>
            {contratos.length === 0 ? <Empty title="Sin contratos registrados" /> : (
              <Table head={<><th className="th">Tipo</th><th className="th">Puesto</th><th className="th">Salario</th><th className="th">Vigencia</th><th className="th">Estado</th><th className="th" /></>}>
                {contratos.map((k) => (
                  <tr key={k.id}>
                    <td className="td font-semibold text-primary-800">{k.tipo}</td><td className="td">{k.puesto}</td><td className="td">{fmtMoney(k.salarioDiario)}/día</td>
                    <td className="td text-slate-600">{fmtFecha(k.fechaInicio)} – {k.fechaFin ? fmtFecha(k.fechaFin) : 'Indefinido'}</td>
                    <td className="td"><Badge>{estadoContrato(k)}</Badge></td>
                    <td className="td text-right"><button className="btn-ghost" onClick={() => imprimirContrato(k, db)}><Printer size={16} /> Imprimir</button></td>
                  </tr>
                ))}
              </Table>
            )}
          </Seccion>
        )}

        {tab === 'constancias' && (
          <Seccion titulo="Constancias emitidas" icon={Stamp} acciones={btnSeccion('Generar constancia', () => setModal('constancia'))}>
            {consts.length === 0 ? <Empty title="Sin constancias emitidas" /> : (
              <Table head={<><th className="th">Folio</th><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Detalle</th><th className="th" /></>}>
                {consts.map((k) => (
                  <tr key={k.id}>
                    <td className="td font-mono font-semibold text-primary-700">{k.folio}</td><td className="td">{fmtFecha(k.fecha)}</td><td className="td">{k.tipo}</td>
                    <td className="td max-w-xs truncate text-slate-600">{detalleConstancia(k)}</td>
                    <td className="td text-right"><button className="btn-ghost" onClick={() => reimprimir(k, db)}><Printer size={16} /> Reimprimir</button></td>
                  </tr>
                ))}
              </Table>
            )}
          </Seccion>
        )}

        {tab === 'vacaciones' && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[['Años cumplidos', saldo.anios], ['Días que corresponden', saldo.dias], ['Días tomados', saldo.usados], ['Días disponibles', saldo.disponibles]].map(([l, v]) => (
                <div key={l} className="card border-b-4 border-b-accent-500 p-4"><div className="text-3xl font-extrabold text-primary-700">{v}</div><div className="text-sm text-slate-600">{l}</div></div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Periodo vigente: {fmtFecha(saldo.inicio)} – {fmtFecha(saldo.fin)} (según Ley Federal del Trabajo, reforma 2023).</p>
            <Seccion titulo="Solicitudes de vacaciones" icon={CalendarDays} acciones={btnSeccion('Nueva solicitud', () => setModal('vac'))}>
              {vacs.length === 0 ? <Empty title="Sin solicitudes de vacaciones" /> : (
                <Table head={<><th className="th">Periodo</th><th className="th">Días</th><th className="th">Solicitada</th><th className="th">Estatus</th></>}>
                  {vacs.sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)).map((v) => (
                    <tr key={v.id}><td className="td">{fmtFecha(v.fechaInicio)} – {fmtFecha(v.fechaFin)}</td><td className="td">{v.dias}</td><td className="td text-slate-600">{fmtFecha(v.fechaSolicitud)}</td><td className="td"><Badge>{v.estatus}</Badge></td></tr>
                  ))}
                </Table>
              )}
            </Seccion>
          </>
        )}

        {tab === 'incidencias' && (
          <Seccion titulo="Incidencias" icon={AlertTriangle} acciones={btnSeccion('Registrar', () => setModal('inc'))}>
            {incs.length === 0 ? <Empty title="Sin incidencias" /> : (
              <Table head={<><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Cantidad</th><th className="th">Descripción</th><th className="th">Estatus</th></>}>
                {incs.sort((a, b) => b.fecha.localeCompare(a.fecha)).map((i) => (
                  <tr key={i.id}><td className="td">{fmtFecha(i.fecha)}</td><td className="td font-semibold text-primary-800">{i.tipo}</td><td className="td">{cantidadTexto(i)}</td><td className="td max-w-xs truncate text-slate-600">{i.descripcion}</td><td className="td"><Badge>{i.estatus}</Badge></td></tr>
                ))}
              </Table>
            )}
          </Seccion>
        )}

        {tab === 'nomina' && (
          <>
            <Seccion titulo="Recibos de nómina" icon={Coins}>
              {recibos.length === 0 ? <Empty title="Sin recibos de nómina" text="Los recibos aparecen aquí cuando se calcula una nómina que incluye a este colaborador." /> : (
                <Table head={<><th className="th">Periodo</th><th className="th text-right">Percepciones</th><th className="th text-right">Deducciones</th><th className="th text-right">Neto</th><th className="th">Estatus</th><th className="th" /></>}>
                  {recibos.map(({ n, r }) => (
                    <tr key={n.id}>
                      <td className="td"><Link className="font-semibold text-primary-700 hover:underline" to={`/nomina/${n.id}`}>{n.nombre}</Link></td>
                      <td className="td text-right text-accent-700">{fmtMoney(r.totalPercepciones)}</td>
                      <td className="td text-right text-rose-600">{fmtMoney(r.totalDeducciones)}</td>
                      <td className="td text-right font-bold text-primary-900">{fmtMoney(r.neto)}</td>
                      <td className="td"><Badge>{n.estatus}</Badge></td>
                      <td className="td text-right"><button className="btn-ghost" onClick={() => imprimirRecibos(n, [r], db)}><Printer size={16} /> Recibo</button></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Seccion>
            <PrestamosPanel colaboradorId={c.id} />
          </>
        )}

        {tab === 'historial' && (
          <Seccion titulo="Historial de movimientos" icon={History}>
            <div className="p-5">
              {eventos.length === 0 ? <Empty title="Sin movimientos registrados" /> : (
                <ol className="relative space-y-5 border-l-2 border-primary-200 pl-6">
                  {eventos.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[33px] top-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-accent-500 shadow" />
                      <p className="text-sm font-semibold text-primary-900">{e.accion}</p>
                      <p className="text-xs text-slate-500">{fmtFecha(e.fecha.slice(0, 10))}{e.fecha.length > 10 ? ` · ${e.fecha.slice(11, 16)}` : ''} · {e.modulo}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Seccion>
        )}
      </div>

      {modal === 'editar' && <ColaboradorForm open inicial={c} onClose={() => setModal(null)} />}
      {modal === 'doc' && <SubirDocumento open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'contrato' && <ContratoForm open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'vac' && <VacacionForm open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'inc' && <IncidenciaForm open colaboradorId={c.id} onClose={() => setModal(null)} />}
      {modal === 'constancia' && <ConstanciaForm colaboradorId={c.id} onClose={() => setModal(null)} />}
    </>
  )
}
