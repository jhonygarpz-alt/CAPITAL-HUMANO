import type { Asistencia, Colaborador, Contrato, DB, Documento, Empresa, Incidencia, Vacacion } from '../types'
import { DOCUMENTOS_REQUERIDOS } from '../types'
import { addDays, hoy, toISO, uid } from '../lib/utils'

const DEPTOS = ['Recursos Humanos', 'Administración', 'Finanzas', 'Ventas', 'Operaciones', 'Tecnología']

export function crearDBDemo(): DB {
  const empresas: Empresa[] = [
    { id: 'emp-a', nombre: 'Empresa A', razonSocial: 'Comercializadora Empresa A, S.A. de C.V.', rfc: 'CEA190101AB1', registroPatronal: 'Y1234567101', direccion: 'Av. Reforma 120, CDMX', color: '#5b2ff5', departamentos: DEPTOS, periodicidadNomina: 'Quincenal' },
    { id: 'emp-b', nombre: 'Empresa B', razonSocial: 'Servicios Industriales B, S.A. de C.V.', rfc: 'SIB180515CD2', registroPatronal: 'Y7654321102', direccion: 'Blvd. Industrial 45, Monterrey, N.L.', color: '#0ea5e9', departamentos: ['Recursos Humanos', 'Producción', 'Calidad', 'Logística', 'Mantenimiento'], periodicidadNomina: 'Semanal' },
    { id: 'emp-c', nombre: 'Empresa C', razonSocial: 'Grupo Corporativo C, S.C.', rfc: 'GCC200301EF3', registroPatronal: 'Y1122334103', direccion: 'Av. Vallarta 3000, Guadalajara, Jal.', color: '#10b981', departamentos: ['Dirección', 'Recursos Humanos', 'Contabilidad', 'Jurídico'], periodicidadNomina: 'Quincenal' },
  ]

  const base: [string, string, string, 'Femenino' | 'Masculino', string, string, number, number][] = [
    // nombre, ap, am, genero, puesto, depto, salarioDiario, añosAntigüedad
    ['Ana Sofía', 'Ramírez', 'Torres', 'Femenino', 'Analista RH', 'Recursos Humanos', 650, 3.2],
    ['Carlos', 'Méndez', 'Aguilar', 'Masculino', 'Coord. de Nómina', 'Recursos Humanos', 820, 5.6],
    ['Mariana', 'López', 'Valencia', 'Femenino', 'Esp. de Capacitación', 'Recursos Humanos', 700, 1.4],
    ['Jorge', 'Hernández', 'Ruiz', 'Masculino', 'Contador General', 'Finanzas', 950, 7.1],
    ['Lucía', 'García', 'Paredes', 'Femenino', 'Ejecutiva de Ventas', 'Ventas', 520, 0.6],
    ['Ricardo', 'Sánchez', 'Ortega', 'Masculino', 'Gerente de Operaciones', 'Operaciones', 1350, 9.3],
    ['Fernanda', 'Morales', 'Castro', 'Femenino', 'Desarrolladora', 'Tecnología', 1100, 2.1],
    ['Miguel', 'Torres', 'Navarro', 'Masculino', 'Auxiliar Administrativo', 'Administración', 400, 0.2],
    ['Daniela', 'Flores', 'Rivera', 'Femenino', 'Ejecutiva de Ventas', 'Ventas', 540, 4.4],
    ['Alejandro', 'Vargas', 'Luna', 'Masculino', 'Soporte Técnico', 'Tecnología', 600, 1.9],
  ]
  const baseB: typeof base = [
    ['Roberto', 'Jiménez', 'Salinas', 'Masculino', 'Supervisor de Producción', 'Producción', 720, 6.2],
    ['Patricia', 'Cruz', 'Medina', 'Femenino', 'Generalista RH', 'Recursos Humanos', 610, 2.8],
    ['Luis', 'Romero', 'Delgado', 'Masculino', 'Operador', 'Producción', 380, 1.1],
    ['Gabriela', 'Reyes', 'Campos', 'Femenino', 'Inspectora de Calidad', 'Calidad', 480, 3.5],
    ['Héctor', 'Domínguez', 'Peña', 'Masculino', 'Almacenista', 'Logística', 400, 0.4],
    ['Sergio', 'Aguirre', 'Ibarra', 'Masculino', 'Técnico de Mantenimiento', 'Mantenimiento', 560, 8.0],
  ]
  const baseC: typeof base = [
    ['Valeria', 'Ortiz', 'Fuentes', 'Femenino', 'Directora General', 'Dirección', 2800, 10.5],
    ['Eduardo', 'Castillo', 'Rojas', 'Masculino', 'Abogado Corporativo', 'Jurídico', 1500, 4.0],
    ['Paola', 'Guerrero', 'Soto', 'Femenino', 'Contadora', 'Contabilidad', 900, 2.3],
    ['Andrés', 'Mendoza', 'Ríos', 'Masculino', 'Reclutador', 'Recursos Humanos', 580, 0.9],
  ]

  const colaboradores: Colaborador[] = []
  const contratos: Contrato[] = []
  const documentos: Documento[] = []
  let consecutivo = 380
  const hoyD = new Date()

  const alta = (empresaId: string, lista: typeof base) =>
    lista.forEach(([nombre, ap, am, genero, puesto, depto, sd, anios], i) => {
      const ingreso = new Date(hoyD.getTime() - anios * 365.25 * 86400000)
      const nac = new Date(1980 + ((i * 7) % 20), (i * 5 + hoyD.getMonth()) % 12, 3 + ((i * 11) % 25))
      const id = uid()
      const c: Colaborador = {
        id, empresaId, numero: `EMP-${String(++consecutivo).padStart(6, '0')}`,
        nombre, apellidoPaterno: ap, apellidoMaterno: am, genero,
        email: `${nombre.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${ap.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@empresa.mx`,
        telefono: `55 ${1000 + i * 137} ${2000 + i * 91}`,
        fechaNacimiento: toISO(nac),
        curp: `${ap.slice(0, 2).toUpperCase()}${am[0]}${nombre[0]}${String(nac.getFullYear()).slice(2)}0101${genero === 'Femenino' ? 'M' : 'H'}DFXXX0${i}`.normalize('NFD').replace(/[̀-ͯ]/g, ''),
        rfc: `${ap.slice(0, 2).toUpperCase()}${am[0]}${nombre[0]}${String(nac.getFullYear()).slice(2)}0101AB${i}`.normalize('NFD').replace(/[̀-ͯ]/g, ''),
        nss: `${12345678900 + consecutivo}`,
        direccion: 'Calle Ejemplo 123, Col. Centro',
        puesto, departamento: depto,
        fechaIngreso: toISO(ingreso),
        salarioDiario: sd,
        banco: ['BBVA', 'Santander', 'Banorte', 'HSBC'][i % 4],
        cuenta: `0${12180000000 + consecutivo * 7}`,
        contactoEmergencia: 'Familiar directo', telefonoEmergencia: '55 0000 0000',
        estatus: i === 7 && empresaId === 'emp-a' ? 'Incapacidad' : 'Activo',
      }
      colaboradores.push(c)
      const prueba = anios < 0.5
      contratos.push({
        id: uid(), empresaId, colaboradorId: id,
        tipo: prueba ? 'Periodo de prueba' : i % 5 === 4 ? 'Tiempo determinado' : 'Tiempo indeterminado',
        puesto, salarioDiario: sd, fechaInicio: c.fechaIngreso,
        fechaFin: prueba ? addDays(c.fechaIngreso, 90) : i % 5 === 4 ? addDays(hoy(), 20 + i) : undefined,
        jornada: 'Lunes a viernes, 9:00 a 18:00',
      })
      DOCUMENTOS_REQUERIDOS.slice(0, 3 + ((i * 3) % 6)).forEach((tipo) =>
        documentos.push({ id: uid(), empresaId, colaboradorId: id, tipo, nombre: `${tipo}.pdf`, fecha: c.fechaIngreso }),
      )
    })
  alta('emp-a', base)
  alta('emp-b', baseB)
  alta('emp-c', baseC)

  const de = (empresaId: string) => colaboradores.filter((c) => c.empresaId === empresaId)
  const A = de('emp-a')
  const t = hoy()

  const vacaciones: Vacacion[] = [
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[1].id, fechaInicio: addDays(t, 10), fechaFin: addDays(t, 14), dias: 5, estatus: 'Pendiente', fechaSolicitud: addDays(t, -2) },
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[3].id, fechaInicio: addDays(t, -40), fechaFin: addDays(t, -36), dias: 5, estatus: 'Aprobada', fechaSolicitud: addDays(t, -60) },
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[0].id, fechaInicio: addDays(t, 25), fechaFin: addDays(t, 27), dias: 3, estatus: 'Pendiente', fechaSolicitud: addDays(t, -1) },
  ]

  const incidencias: Incidencia[] = [
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[4].id, fecha: addDays(t, -3), tipo: 'Falta injustificada', cantidad: 1, descripcion: 'No se presentó', estatus: 'Pendiente' },
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[6].id, fecha: addDays(t, -2), tipo: 'Horas extra', cantidad: 4, descripcion: 'Cierre de proyecto', estatus: 'Pendiente' },
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[7].id, fecha: addDays(t, -5), tipo: 'Incapacidad', cantidad: 3, descripcion: 'Incapacidad por enfermedad general', estatus: 'Pendiente' },
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[2].id, fecha: addDays(t, -1), tipo: 'Retardo', cantidad: 1, descripcion: 'Llegó 9:25', estatus: 'Pendiente' },
    { id: uid(), empresaId: 'emp-a', colaboradorId: A[8].id, fecha: addDays(t, -4), tipo: 'Bono', cantidad: 1500, descripcion: 'Bono por meta de ventas', estatus: 'Pendiente' },
  ]

  const asistencias: Asistencia[] = []
  for (let d = 1; d <= 5; d++) {
    const fecha = addDays(t, -d)
    const w = new Date(fecha + 'T12:00').getDay()
    if (w === 0 || w === 6) continue
    A.forEach((c, i) => {
      if (c.estatus !== 'Activo') return
      const tipo = (i + d) % 9 === 0 ? 'Retardo' : (i + d) % 13 === 0 ? 'Falta' : 'Asistencia'
      asistencias.push({ id: uid(), empresaId: 'emp-a', colaboradorId: c.id, fecha, tipo, entrada: tipo === 'Falta' ? undefined : tipo === 'Retardo' ? '09:22' : '08:5' + (i % 10), salida: tipo === 'Falta' ? undefined : '18:0' + (i % 10) })
    })
  }

  return {
    version: 1,
    empresaActualId: 'emp-a',
    empresas, colaboradores, documentos, contratos, vacaciones, asistencias, incidencias,
    nominas: [],
    eventos: colaboradores.map((c) => ({ id: uid(), empresaId: c.empresaId, colaboradorId: c.id, fecha: c.fechaIngreso + 'T09:00', modulo: 'Colaboradores', accion: `Alta de ${c.nombre} ${c.apellidoPaterno} como ${c.puesto}` })),
  }
}

export function crearDBVacia(): DB {
  return {
    version: 1, empresaActualId: 'emp-1',
    empresas: [{ id: 'emp-1', nombre: 'Mi empresa', razonSocial: '', rfc: '', registroPatronal: '', direccion: '', color: '#5b2ff5', departamentos: ['Recursos Humanos', 'Administración'], periodicidadNomina: 'Quincenal' }],
    colaboradores: [], documentos: [], contratos: [], vacaciones: [], asistencias: [], incidencias: [], nominas: [], eventos: [],
  }
}
