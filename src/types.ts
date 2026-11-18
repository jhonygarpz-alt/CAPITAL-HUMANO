export type ID = string

export interface Empresa {
  id: ID
  nombre: string
  razonSocial: string
  rfc: string
  registroPatronal: string
  direccion: string
  color: string
  departamentos: string[]
  periodicidadNomina: 'Semanal' | 'Quincenal' | 'Mensual'
}

export type EstatusColaborador = 'Activo' | 'Incapacidad' | 'Baja'

export interface Colaborador {
  id: ID
  empresaId: ID
  numero: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  foto?: string
  email: string
  telefono: string
  fechaNacimiento: string
  genero: 'Femenino' | 'Masculino' | 'Otro'
  curp: string
  rfc: string
  nss: string
  direccion: string
  puesto: string
  departamento: string
  fechaIngreso: string
  salarioDiario: number
  banco: string
  cuenta: string
  contactoEmergencia: string
  telefonoEmergencia: string
  estatus: EstatusColaborador
  fechaBaja?: string
  motivoBaja?: string
}

export const TIPOS_DOCUMENTO = [
  'INE / Identificación',
  'CURP',
  'Acta de nacimiento',
  'Comprobante de domicilio',
  'Constancia RFC',
  'Número de Seguro Social',
  'Comprobante de estudios',
  'Solicitud de empleo / CV',
  'Fotografía',
  'Otro',
] as const
export const DOCUMENTOS_REQUERIDOS = TIPOS_DOCUMENTO.slice(0, 8)

export interface Documento {
  id: ID
  empresaId: ID
  colaboradorId: ID
  tipo: string
  nombre: string
  archivo?: string
  mime?: string
  tamano?: number
  fecha: string
  notas?: string
}

export type TipoContrato = 'Tiempo indeterminado' | 'Tiempo determinado' | 'Periodo de prueba' | 'Capacitación inicial' | 'Honorarios'

export interface Contrato {
  id: ID
  empresaId: ID
  colaboradorId: ID
  tipo: TipoContrato
  puesto: string
  salarioDiario: number
  fechaInicio: string
  fechaFin?: string
  jornada: string
  notas?: string
  cancelado?: boolean
}

export type EstatusSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada'

export interface Vacacion {
  id: ID
  empresaId: ID
  colaboradorId: ID
  fechaInicio: string
  fechaFin: string
  dias: number
  estatus: EstatusSolicitud
  comentario?: string
  fechaSolicitud: string
}

export type TipoAsistencia = 'Asistencia' | 'Retardo' | 'Falta' | 'Permiso' | 'Home office'

export interface Asistencia {
  id: ID
  empresaId: ID
  colaboradorId: ID
  fecha: string
  entrada?: string
  salida?: string
  tipo: TipoAsistencia
}

export const TIPOS_INCIDENCIA = [
  'Falta injustificada',
  'Retardo',
  'Incapacidad',
  'Permiso con goce',
  'Permiso sin goce',
  'Horas extra',
  'Bono',
  'Descuento',
  'Amonestación',
] as const
export type TipoIncidencia = (typeof TIPOS_INCIDENCIA)[number]

export interface Incidencia {
  id: ID
  empresaId: ID
  colaboradorId: ID
  fecha: string
  tipo: TipoIncidencia
  cantidad: number
  descripcion: string
  estatus: 'Pendiente' | 'Aplicada'
}

export interface Recibo {
  colaboradorId: ID
  diasPeriodo: number
  diasFalta: number
  salarioDiario: number
  sueldo: number
  horasExtra: number
  importeHorasExtra: number
  bonos: number
  totalPercepciones: number
  isr: number
  imss: number
  descuentos: number
  descuentoFaltas: number
  totalDeducciones: number
  neto: number
}

export interface PeriodoNomina {
  id: ID
  empresaId: ID
  nombre: string
  tipo: 'Semanal' | 'Quincenal' | 'Mensual'
  fechaInicio: string
  fechaFin: string
  estatus: 'Borrador' | 'Cerrada'
  recibos: Recibo[]
  fechaCreacion: string
}

export interface Evento {
  id: ID
  empresaId: ID
  colaboradorId?: ID
  fecha: string
  modulo: string
  accion: string
}

export interface DB {
  version: number
  empresaActualId: ID
  empresas: Empresa[]
  colaboradores: Colaborador[]
  documentos: Documento[]
  contratos: Contrato[]
  vacaciones: Vacacion[]
  asistencias: Asistencia[]
  incidencias: Incidencia[]
  nominas: PeriodoNomina[]
  eventos: Evento[]
}

export type Coleccion = Exclude<keyof DB, 'version' | 'empresaActualId'>
