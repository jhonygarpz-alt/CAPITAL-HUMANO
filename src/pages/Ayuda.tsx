import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui'

const PASOS = [
  { t: '1. Elige o crea tu empresa', d: 'Usa el selector "Empresa" de la parte superior. En Configuración puedes dar de alta nuevas empresas, sus departamentos y su periodicidad de nómina.', to: '/configuracion' },
  { t: '2. Registra a tus colaboradores', d: 'En Colaboradores pulsa "Nuevo colaborador". Captura sus datos personales y laborales y sube su fotografía.', to: '/colaboradores' },
  { t: '3. Integra su expediente', d: 'En Expedientes verás qué documentos le faltan a cada persona (INE, CURP, acta, comprobante de domicilio, etc.) y podrás subirlos.', to: '/expedientes' },
  { t: '4. Genera su contrato', d: 'En Contratos crea el contrato (indeterminado, determinado, prueba…) y pulsa el icono de impresora para imprimirlo o guardarlo en PDF. El sistema te avisa cuando un contrato está por vencer.', to: '/contratos' },
  { t: '5. Lleva asistencias e incidencias', d: 'Marca asistencias, retardos y faltas cada día. Las faltas, incapacidades, horas extra, bonos y descuentos se registran en Incidencias para que se reflejen en la nómina.', to: '/incidencias' },
  { t: '6. Administra vacaciones', d: 'El sistema calcula automáticamente los días que le corresponden a cada persona según su antigüedad (LFT). Registra solicitudes y apruébalas o recházalas.', to: '/vacaciones' },
  { t: '7. Calcula la nómina', d: 'En Nómina pulsa "Calcular nueva nómina", revisa los importes, imprime los recibos y ciérrala.', to: '/nomina' },
  { t: '8. Consulta reportes', d: 'Plantilla, altas y bajas, cumpleaños, vacaciones, incidencias y más. Puedes ver una empresa o todas a la vez y exportar a Excel.', to: '/reportes' },
]

export default function Ayuda() {
  return (
    <>
      <PageHeader title="Guía rápida" subtitle="Cómo usar el sistema en 8 pasos" />
      <div className="grid gap-4 md:grid-cols-2">
        {PASOS.map((p) => (
          <Link key={p.t} to={p.to} className="card p-5 transition hover:border-primary-200 hover:shadow-md">
            <h3 className="font-semibold text-slate-900">{p.t}</h3>
            <p className="mt-1 text-sm text-slate-600">{p.d}</p>
          </Link>
        ))}
      </div>
      <div className="card mt-6 p-5 text-sm text-slate-600">
        <b>Consejos:</b> usa el buscador superior para encontrar a cualquier colaborador al instante · la campana muestra tus pendientes · descarga respaldos desde Configuración con regularidad.
      </div>
    </>
  )
}
