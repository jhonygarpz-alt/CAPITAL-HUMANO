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
  /** Persona que firma las constancias (ej. "Lic. Laura Pérez") */
  firmanteNombre?: string
  firmantePuesto?: string
  telefono?: string
  /** Configuración predeterminada del cálculo de aguinaldo */
  configAguinaldo?: ConfigAguinaldo
  configPrima?: ConfigPrima
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
  /** Contenido embebido (versiones antiguas / datos de demostración). */
  archivo?: string
  /** Ruta del archivo en Supabase Storage. */
  ruta?: string
  /** Fecha de vencimiento del documento (INE, licencia, certificados…) */
  vencimiento?: string
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

export interface Vacante {
  id: ID
  empresaId: ID
  puesto: string
  departamento: string
  posiciones: number
  salarioOfrecido: number
  fechaApertura: string
  responsable: string
  descripcion: string
  estatus: 'Abierta' | 'En proceso' | 'Cubierta' | 'Cancelada'
  candidatos: number
}

export const TIPOS_CONSTANCIA = ['Constancia laboral', 'Carta patronal', 'Carta para visa', 'Carta para beca'] as const
export type TipoConstancia = (typeof TIPOS_CONSTANCIA)[number]

export interface Constancia {
  id: ID
  empresaId: ID
  colaboradorId: ID
  tipo: TipoConstancia
  folio: string
  fecha: string
  dirigidoA: string
  incluirSalario: boolean
  idioma: 'Español' | 'Inglés'
  /** Visa */
  pais?: string
  viajeDesde?: string
  viajeHasta?: string
  motivoViaje?: string
  /** Beca */
  institucion?: string
  beneficiario?: string
  parentesco?: string
  /** Carta patronal */
  tramite?: string
  observaciones?: string
  firmanteNombre: string
  firmantePuesto: string
  emitidaPor: string
}

export interface ConfigAguinaldo {
  /** Días de salario que otorga la empresa (mínimo de ley: 15) */
  dias: number
  /** Salario base para el cálculo */
  base: 'Salario diario' | 'Salario diario integrado'
  /** Factor de integración cuando la base es el salario integrado */
  factorIntegracion: number
  /** Inicio y fin del periodo de cómputo (MM-DD) */
  inicioPeriodo: string
  finPeriodo: string
  /** Fecha de pago (MM-DD). Límite legal: 20 de diciembre */
  fechaPago: string
  /** Días que se descuentan de los días trabajados */
  descontarFaltas: boolean
  descontarPermisosSinGoce: boolean
  descontarIncapacidades: boolean
  /** Incluir a quienes causaron baja en el año (aguinaldo proporcional / finiquito) */
  incluirBajas: boolean
  /** ISR */
  valorUMA: number
  diasExentos: number
  metodoISR: 'Art. 96 LISR' | 'Art. 174 RLISR'
  /** No retener ISR (la empresa absorbe el impuesto) */
  noRetenerISR: boolean
}

export interface ConfigPrima {
  /** Porcentaje sobre los salarios de vacaciones (mínimo de ley: 25%) */
  porcentaje: number
  base: 'Salario diario' | 'Salario diario integrado'
  factorIntegracion: number
  /** Cuándo se paga la prima */
  momentoPago: 'Al disfrutar las vacaciones' | 'En el aniversario'
  /** Días de vacaciones por año: tabla de ley o días fijos superiores */
  tablaVacaciones: 'Ley (reforma 2023)' | 'Días adicionales'
  diasAdicionales: number
  valorUMA: number
  umasExentas: number
  metodoISR: 'Art. 96 LISR' | 'Art. 174 RLISR'
  noRetenerISR: boolean
}

export interface AvisoConfig { activo: boolean; dias: number }
export interface ConfigNotificaciones {
  primaVacacional: AvisoConfig
  cumpleanos: AvisoConfig
  documentos: AvisoConfig
  contratos: AvisoConfig
  aniversarios: AvisoConfig
  vacacionesPendientes: AvisoConfig
  incidenciasPendientes: AvisoConfig
}

/** Ajustes generales del sistema (un solo registro con id "general"). */
export interface Ajustes {
  id: 'general'
  notificaciones: ConfigNotificaciones
}

export interface ReciboAguinaldo {
  colaboradorId: ID
  desde: string
  hasta: string
  diasTrabajados: number
  diasDescontados: number
  diasComputables: number
  diasAguinaldo: number
  salarioBase: number
  importe: number
  exento: number
  gravado: number
  isr: number
  neto: number
  completo: boolean
}

export interface PeriodoAguinaldo {
  id: ID
  empresaId: ID
  anio: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  fechaPago: string
  config: ConfigAguinaldo
  recibos: ReciboAguinaldo[]
  estatus: 'Borrador' | 'Cerrado'
  fechaCreacion: string
}

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
  vacantes: Vacante[]
  constancias: Constancia[]
  aguinaldos: PeriodoAguinaldo[]
  ajustes: Ajustes[]
  asistencias: Asistencia[]
  incidencias: Incidencia[]
  nominas: PeriodoNomina[]
  eventos: Evento[]
}

export type Coleccion = Exclude<keyof DB, 'version' | 'empresaActualId'>
