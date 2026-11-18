# Capital Humano · RH Multiempresa

Sistema web para administrar los procesos de **Recursos Humanos de varias empresas** desde un solo lugar. Pensado para ser claro, fácil de usar y adaptable.

## Módulos

| Módulo | Qué hace |
|---|---|
| **Inicio** | Resumen de la empresa: colaboradores activos, altas del mes, vacaciones, incidencias, contratos por vencer, cumpleaños. |
| **Colaboradores** | Alta, edición y baja del personal con **fotografía**, datos personales (CURP, RFC, NSS), laborales, bancarios y de emergencia. Ficha completa con pestañas. |
| **Expedientes** | Lista de documentos requeridos por colaborador con % de avance; carga de archivos (PDF, imágenes, Word, Excel). |
| **Contratos** | Indeterminado, determinado, prueba, capacitación inicial y honorarios. Alertas de vencimiento e **impresión / PDF** del contrato. |
| **Nómina** | Cálculo semanal, quincenal o mensual con base en salario diario e incidencias (faltas, horas extra dobles, bonos, descuentos). ISR (tarifa Art. 96 LISR) e IMSS estimados. Recibos imprimibles y exportación. |
| **Asistencias** | Registro diario (asistencia, retardo, falta, permiso, home office) con horario de entrada y salida y vista de los últimos 7 días. |
| **Vacaciones** | Saldos automáticos según la **LFT (reforma 2023)**, solicitudes, aprobación y rechazo. |
| **Incidencias** | Faltas, retardos, incapacidades, permisos, horas extra, bonos, descuentos y amonestaciones. |
| **Reportes** | Plantilla, plantilla por departamento, altas y bajas, cumpleaños, contratos por vencer, vacaciones, incidencias, expedientes incompletos y nóminas. Por empresa o **consolidado de todas**. Exportación a Excel (CSV) e impresión. |
| **Configuración** | Alta de empresas (razón social, RFC, registro patronal, departamentos, periodicidad de nómina), respaldo y restauración de información. |
| **Ayuda** | Guía rápida en 8 pasos. |

Además: **Vacantes** (reclutamiento), buscador global de colaboradores, campana de pendientes, historial de movimientos por colaborador, menú lateral compacto y diseño adaptable a celular.

## Todo en la web (sin instalar nada)

- **Datos y archivos:** Supabase, proyecto `capital-humano` (organización Soluciones Óptima). Tabla `rh_registros` + bucket privado `rh-archivos`, protegidos con RLS. Esquema en `supabase/migrations/`.
- **Aplicación:** Vercel, conectado a este repositorio de GitHub. Cada cambio que se sube se publica solo.
- **Usuarios:** inicio de sesión con correo y contraseña (Supabase Auth). El **primer usuario que crea su cuenta queda como administrador**; él invita a los demás desde *Configuración → Usuarios*.
- **Tiempo real:** si varias personas trabajan a la vez, ven los cambios de los demás al instante.

### Publicar en Vercel (una sola vez)

1. Entra a vercel.com → **Add New… → Project** → importa el repositorio `CAPITAL-HUMANO`.
2. Vercel detecta Vite automáticamente (`vercel.json`). No hace falta configurar variables: la app ya apunta al proyecto de Supabase.
3. Pulsa **Deploy** y abre la liga que te da Vercel.

### Configurar Supabase para la liga de Vercel (una sola vez)

En Supabase → proyecto `capital-humano` → **Authentication → URL Configuration**:
- **Site URL:** la liga de Vercel (ej. `https://capital-humano.vercel.app`).
- **Redirect URLs:** agrega la misma liga.

Así los correos de confirmación y de "olvidé mi contraseña" regresan a tu sistema.

## Datos

- La base inicia vacía; el administrador elige "Empezar con mi empresa" o "Cargar datos de demostración".
- En *Configuración → Respaldo* se puede descargar una copia (JSON) y restaurarla.
- Los cálculos de ISR e IMSS son estimaciones de referencia; valídalos con tu contador antes de timbrar CFDI.

## Tecnología

React 18 + TypeScript + Vite + Tailwind CSS + React Router + Lucide icons + Supabase (Postgres, Auth, Storage, Realtime).

```
src/
  types.ts            Modelo de datos (empresas, colaboradores, documentos, contratos, vacantes…)
  store/              Estado global sincronizado con Supabase y datos de demostración
  lib/                Supabase, fechas, moneda, vacaciones LFT, ISR/IMSS, nómina, CSV
  components/         Componentes reutilizables (layout, acceso, formularios, tablas, modales)
  pages/              Una página por módulo
supabase/migrations/  Esquema de base de datos, seguridad (RLS) y almacenamiento
```
