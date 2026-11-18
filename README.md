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

Además: buscador global de colaboradores, campana de pendientes, historial de movimientos por colaborador y diseño adaptable a celular.

## Cómo ejecutarlo

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev        # modo desarrollo en http://localhost:5173
npm run build      # genera la versión para publicar en dist/
npm run preview    # prueba la versión publicada
```

La carpeta `dist/` puede publicarse en cualquier hosting estático (Netlify, Vercel, GitHub Pages, Render, un servidor propio, etc.).

## Datos

- La primera vez se cargan **datos de demostración** (3 empresas y 20 colaboradores). Desde *Configuración* puedes "Empezar desde cero".
- La información se guarda en el navegador (IndexedDB). Usa **Configuración → Descargar respaldo** con regularidad; el respaldo (JSON) se puede restaurar en otra computadora.
- Los cálculos de ISR e IMSS son estimaciones de referencia; valídalos con tu contador antes de timbrar CFDI.

## Tecnología

React 18 + TypeScript + Vite + Tailwind CSS + React Router + Lucide icons.

Estructura:

```
src/
  types.ts            Modelo de datos (empresas, colaboradores, documentos, contratos…)
  store/              Estado global, persistencia (IndexedDB) y datos de demostración
  lib/                Utilidades: fechas, moneda, vacaciones LFT, ISR/IMSS, nómina, CSV
  components/         Componentes reutilizables (layout, formularios, tablas, modales)
  pages/              Una página por módulo
```

### Siguiente paso sugerido

Para uso con varios usuarios simultáneos, conectar la capa `src/store` a una base de datos en la nube (p. ej. Supabase/PostgreSQL) con inicio de sesión y permisos por empresa.
