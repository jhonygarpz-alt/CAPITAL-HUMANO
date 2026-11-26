/**
 * PLANTILLAS DE CONSTANCIAS Y CARTAS
 * ----------------------------------
 * Cada plantilla es texto HTML sencillo con variables entre llaves dobles, por ejemplo {{nombre}}.
 * Para adaptar un formato propio basta con cambiar el texto de `titulo` y `cuerpo`.
 *
 * Variables disponibles (ver `variablesConstancia`):
 *   Empresa:      {{empresa_razon_social}} {{empresa_nombre}} {{empresa_rfc}} {{empresa_registro_patronal}} {{empresa_direccion}} {{empresa_telefono}}
 *   Colaborador:  {{nombre}} {{nombre_mayusculas}} {{numero_empleado}} {{puesto}} {{departamento}} {{curp}} {{rfc}} {{nss}}
 *                 {{fecha_ingreso}} {{antiguedad}} {{tipo_contrato}} {{jornada}}
 *                 {{el_la}} ("el"/"la")  {{del_de_la}} ("del"/"de la")  {{c_tratamiento}} ("el C."/"la C.")  {{interesado}} ("interesado"/"interesada")
 *   Salario:      {{salario_diario}} {{salario_mensual}} {{salario_mensual_letra}} {{parrafo_salario}}
 *   Documento:    {{folio}} {{fecha_emision}} {{lugar_emision}} {{dirigido_a}} {{observaciones}} {{firmante_nombre}} {{firmante_puesto}}
 *   Visa:         {{pais}} {{viaje_desde}} {{viaje_hasta}} {{motivo_viaje}}
 *   Beca:         {{institucion}} {{beneficiario}} {{parentesco}}
 *   Patronal:     {{tramite}}
 *   Inglés:       {{fecha_emision_en}} {{fecha_ingreso_en}} {{viaje_desde_en}} {{viaje_hasta_en}} {{mr_ms}} {{he_she}} {{his_her}} {{salario_mensual_usd_texto}}
 */
import type { Colaborador, Constancia, Contrato, Empresa, TipoConstancia } from '../types'
import { antiguedadTexto, fmtFecha, fmtFechaIngles, fmtFechaLarga, fmtMoney, importeEnLetra, nombreCompleto } from './utils'

type Plantilla = { titulo: string; cuerpo: string }

export const PLANTILLAS: Record<TipoConstancia, { es: Plantilla; en?: Plantilla }> = {
  'Constancia laboral': {
    es: {
      titulo: 'CONSTANCIA LABORAL',
      cuerpo: `
<p>Por medio de la presente se hace constar que {{c_tratamiento}} <b>{{nombre_mayusculas}}</b>, con número de empleado {{numero_empleado}}, CURP {{curp}} y número de seguridad social {{nss}}, labora en <b>{{empresa_razon_social}}</b> desde el <b>{{fecha_ingreso}}</b> a la fecha, desempeñando el puesto de <b>{{puesto}}</b> en el área de {{departamento}}, con una antigüedad de {{antiguedad}} y contrato por {{tipo_contrato}}.</p>
{{parrafo_salario}}
<p>Se extiende la presente a petición {{del_de_la}} {{interesado}}, para los fines legales que a su derecho convengan, en {{lugar_emision}}, el {{fecha_emision}}.</p>
{{observaciones}}`,
    },
    en: {
      titulo: 'EMPLOYMENT VERIFICATION LETTER',
      cuerpo: `
<p>This is to certify that {{mr_ms}} <b>{{nombre_mayusculas}}</b>, employee number {{numero_empleado}}, has been employed by <b>{{empresa_razon_social}}</b> since <b>{{fecha_ingreso_en}}</b> to date, currently holding the position of <b>{{puesto}}</b> in the {{departamento}} department, on a full-time basis.</p>
{{parrafo_salario}}
<p>This letter is issued at the request of the employee, for whatever legal purpose it may serve, on {{fecha_emision_en}}.</p>
{{observaciones}}`,
    },
  },

  'Carta patronal': {
    es: {
      titulo: 'CARTA PATRONAL',
      cuerpo: `
<p>Por medio de la presente, <b>{{empresa_razon_social}}</b>, con RFC {{empresa_rfc}} y registro patronal ante el IMSS {{empresa_registro_patronal}}, hace constar que {{c_tratamiento}} <b>{{nombre_mayusculas}}</b>, con RFC {{rfc}} y NSS {{nss}}, es trabajador(a) de esta empresa desde el <b>{{fecha_ingreso}}</b>, ocupando actualmente el puesto de <b>{{puesto}}</b>, con una jornada de {{jornada}}.</p>
{{parrafo_salario}}
<p>La presente se expide para efectos de <b>{{tramite}}</b>, a solicitud {{del_de_la}} {{interesado}}, en {{lugar_emision}}, el {{fecha_emision}}. Para cualquier aclaración o confirmación de la información aquí contenida, favor de comunicarse con el área de Recursos Humanos{{empresa_telefono}}.</p>
{{observaciones}}`,
    },
  },

  'Carta para visa': {
    es: {
      titulo: 'CARTA LABORAL PARA TRÁMITE DE VISA',
      cuerpo: `
<p>Por medio de la presente hacemos constar que {{c_tratamiento}} <b>{{nombre_mayusculas}}</b> labora en <b>{{empresa_razon_social}}</b> desde el <b>{{fecha_ingreso}}</b>, ocupando el puesto de <b>{{puesto}}</b> en el área de {{departamento}}, con contrato por {{tipo_contrato}}.</p>
{{parrafo_salario}}
<p>Le hemos autorizado un periodo de ausencia del <b>{{viaje_desde}}</b> al <b>{{viaje_hasta}}</b> para viajar a <b>{{pais}}</b> con motivo de {{motivo_viaje}}. Al término de dicho periodo, {{el_la}} colaborador(a) se reincorporará a sus labores habituales en esta empresa, donde conserva su empleo.</p>
<p>Se extiende la presente a solicitud {{del_de_la}} {{interesado}} para los fines que estime convenientes, en {{lugar_emision}}, el {{fecha_emision}}.</p>
{{observaciones}}`,
    },
    en: {
      titulo: 'EMPLOYMENT LETTER FOR VISA APPLICATION',
      cuerpo: `
<p>This letter is to confirm that {{mr_ms}} <b>{{nombre_mayusculas}}</b> has been employed by <b>{{empresa_razon_social}}</b> since <b>{{fecha_ingreso_en}}</b>, currently holding the position of <b>{{puesto}}</b> in the {{departamento}} department.</p>
{{parrafo_salario}}
<p>{{his_her}} leave of absence has been approved from <b>{{viaje_desde_en}}</b> to <b>{{viaje_hasta_en}}</b> in order to travel to <b>{{pais}}</b> for {{motivo_viaje}}. Upon the conclusion of this period, {{he_she}} will return to {{his_her_min}} regular duties with our company, where {{his_her_min}} position is guaranteed.</p>
<p>Should you require any further information, please do not hesitate to contact our Human Resources department{{empresa_telefono}}.</p>
{{observaciones}}`,
    },
  },

  'Carta para beca': {
    es: {
      titulo: 'CONSTANCIA LABORAL PARA TRÁMITE DE BECA',
      cuerpo: `
<p>Por medio de la presente se hace constar que {{c_tratamiento}} <b>{{nombre_mayusculas}}</b> presta sus servicios en <b>{{empresa_razon_social}}</b> desde el <b>{{fecha_ingreso}}</b>, desempeñando el puesto de <b>{{puesto}}</b>, con una antigüedad de {{antiguedad}}.</p>
{{parrafo_salario}}
<p>La presente se expide para el trámite de beca ante <b>{{institucion}}</b> a favor de <b>{{beneficiario}}</b>{{parentesco}}, a solicitud {{del_de_la}} {{interesado}}, en {{lugar_emision}}, el {{fecha_emision}}.</p>
{{observaciones}}`,
    },
  },
}

export const PREFIJO_FOLIO: Record<TipoConstancia, string> = {
  'Constancia laboral': 'CL',
  'Carta patronal': 'CP',
  'Carta para visa': 'CV',
  'Carta para beca': 'CB',
}

/** Tipos que tienen versión en inglés. */
export const TIENE_INGLES = (t: TipoConstancia) => Boolean(PLANTILLAS[t].en)

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Ciudad tomada de la última parte del domicilio de la empresa ("..., Monterrey, N.L." → "Monterrey, N.L."). */
function lugar(direccion: string) {
  const partes = direccion.split(',').map((x) => x.trim()).filter(Boolean)
  if (partes.length >= 2) return partes.slice(-2).join(', ').replace(/^\d+\s*/, '')
  return partes[0] || '—'
}

export interface ContextoConstancia { k: Constancia; c: Colaborador; e: Empresa; contrato?: Contrato }

export function variablesConstancia({ k, c, e, contrato }: ContextoConstancia): Record<string, string> {
  const fem = c.genero === 'Femenino'
  const en = k.idioma === 'Inglés'
  const mensual = c.salarioDiario * 30.4
  const tipoContrato = (contrato?.tipo ?? 'Tiempo indeterminado').toLowerCase()
  const salario = !k.incluirSalario ? ''
    : en
      ? `<p>${fem ? 'Her' : 'His'} current gross monthly salary is <b>${esc(fmtMoney(mensual))} MXN</b> (Mexican pesos).</p>`
      : `<p>Percibe actualmente un salario mensual bruto de <b>${esc(fmtMoney(mensual))}</b> (${esc(importeEnLetra(mensual))}), equivalente a un salario diario de ${esc(fmtMoney(c.salarioDiario))}.</p>`
  return {
    empresa_nombre: esc(e.nombre),
    empresa_razon_social: esc(e.razonSocial || e.nombre),
    empresa_rfc: esc(e.rfc || '—'),
    empresa_registro_patronal: esc(e.registroPatronal || '—'),
    empresa_direccion: esc(e.direccion || '—'),
    empresa_telefono: e.telefono ? (en ? ` at ${esc(e.telefono)}` : ` al teléfono ${esc(e.telefono)}`) : '',
    nombre: esc(nombreCompleto(c)),
    nombre_mayusculas: esc(nombreCompleto(c).toUpperCase()),
    numero_empleado: esc(c.numero),
    puesto: esc(c.puesto),
    departamento: esc(c.departamento),
    curp: esc(c.curp || '—'),
    rfc: esc(c.rfc || '—'),
    nss: esc(c.nss || '—'),
    fecha_ingreso: esc(fmtFechaLarga(c.fechaIngreso)),
    fecha_ingreso_en: esc(fmtFechaIngles(c.fechaIngreso)),
    antiguedad: esc(antiguedadTexto(c.fechaIngreso)),
    tipo_contrato: esc(tipoContrato),
    jornada: esc(contrato?.jornada || 'tiempo completo'),
    el_la: fem ? 'la' : 'el',
    del_de_la: fem ? 'de la' : 'del',
    c_tratamiento: fem ? 'la C.' : 'el C.',
    interesado: fem ? 'interesada' : 'interesado',
    mr_ms: fem ? 'Ms.' : 'Mr.',
    he_she: fem ? 'she' : 'he',
    his_her: fem ? 'Her' : 'His',
    his_her_min: fem ? 'her' : 'his',
    salario_diario: esc(fmtMoney(c.salarioDiario)),
    salario_mensual: esc(fmtMoney(mensual)),
    salario_mensual_letra: esc(importeEnLetra(mensual)),
    parrafo_salario: salario,
    folio: esc(k.folio),
    fecha_emision: esc(fmtFechaLarga(k.fecha)),
    fecha_emision_en: esc(fmtFechaIngles(k.fecha)),
    lugar_emision: esc(lugar(e.direccion)),
    dirigido_a: esc(k.dirigidoA || (en ? 'To whom it may concern' : 'A quien corresponda')),
    observaciones: k.observaciones ? `<p>${esc(k.observaciones)}</p>` : '',
    firmante_nombre: esc(k.firmanteNombre || ''),
    firmante_puesto: esc(k.firmantePuesto || ''),
    pais: esc(k.pais || '—'),
    viaje_desde: esc(fmtFechaLarga(k.viajeDesde)),
    viaje_hasta: esc(fmtFechaLarga(k.viajeHasta)),
    viaje_desde_en: esc(fmtFechaIngles(k.viajeDesde)),
    viaje_hasta_en: esc(fmtFechaIngles(k.viajeHasta)),
    motivo_viaje: esc(k.motivoViaje || (en ? 'tourism' : 'turismo')),
    institucion: esc(k.institucion || '—'),
    beneficiario: esc(k.beneficiario || nombreCompleto(c)),
    parentesco: k.parentesco ? `, ${esc(k.parentesco)} ${fem ? 'de la trabajadora' : 'del trabajador'}` : '',
    tramite: esc(k.tramite || 'los trámites que a su interés convengan'),
  }
}

export const rellenar = (texto: string, v: Record<string, string>) => texto.replace(/\{\{(\w+)\}\}/g, (_, n) => v[n] ?? '')

/** Documento HTML completo (membrete, cuerpo y firma) listo para imprimir o guardar como PDF. */
export function htmlConstancia(ctx: ContextoConstancia, opciones: { boton?: boolean } = {}) {
  const { k, e } = ctx
  const en = k.idioma === 'Inglés' && TIENE_INGLES(k.tipo)
  const p = (en ? PLANTILLAS[k.tipo].en : PLANTILLAS[k.tipo].es)!
  const v = variablesConstancia({ ...ctx, k: { ...k, idioma: en ? 'Inglés' : 'Español' } })
  // Colores institucionales en todos los documentos
  const color = '#064467'
  return `<!doctype html><html lang="${en ? 'en' : 'es'}"><head><meta charset="utf-8"><title>${v.folio} · ${esc(k.tipo)}</title>
<style>
@page{size:letter;margin:18mm 20mm}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:0;background:#e5e7eb}
.hoja{background:#fff;max-width:816px;min-height:1056px;margin:24px auto;padding:56px 72px;box-shadow:0 4px 24px rgba(0,0,0,.12);position:relative}
.membrete{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid ${color};padding-bottom:14px}
.membrete .rs{font-size:18px;font-weight:800;color:${color}}
.membrete .dato{font-size:11px;color:#4b5563;line-height:1.5}
.acento{height:4px;background:#7CC142;margin-top:3px}
.folio{text-align:right;font-size:11px;color:#4b5563}
.fecha{text-align:right;margin:34px 0 26px;font-size:13px}
.dest{font-size:13px;font-weight:700;margin-bottom:22px;text-transform:uppercase}
h1{font-size:16px;text-align:center;letter-spacing:.5px;color:${color};margin:6px 0 26px}
p{font-size:13.5px;line-height:1.75;text-align:justify;margin:0 0 14px}
.firma{margin-top:70px;text-align:center;font-size:13px}
.firma .linea{width:280px;border-top:1.5px solid #111;margin:0 auto 6px}
.firma b{display:block;font-size:13.5px}
.pie{position:absolute;left:72px;right:72px;bottom:36px;border-top:1px solid #d1d5db;padding-top:8px;font-size:10px;color:#6b7280;display:flex;justify-content:space-between}
.barra{position:sticky;top:0;background:#064467;padding:10px;text-align:center}
.barra button{background:#7CC142;color:#03253a;border:0;border-radius:6px;padding:9px 18px;font-weight:700;font-size:14px;cursor:pointer}
@media print{body{background:#fff}.hoja{box-shadow:none;margin:0;padding:0;max-width:none;min-height:auto}.pie{position:fixed;left:0;right:0;bottom:0}.barra{display:none}}
</style></head><body>
${opciones.boton ? '<div class="barra"><button onclick="print()">Imprimir / Guardar como PDF</button></div>' : ''}
<div class="hoja">
  <div class="membrete">
    <div><div class="rs">${v.empresa_razon_social}</div><div class="dato">RFC: ${v.empresa_rfc} · Registro patronal: ${v.empresa_registro_patronal}<br>${v.empresa_direccion}${e.telefono ? ` · Tel. ${esc(e.telefono)}` : ''}</div></div>
    <div class="folio">${en ? 'Reference' : 'Folio'}: <b>${v.folio}</b></div>
  </div>
  <div class="acento"></div>
  <div class="fecha">${en ? v.fecha_emision_en : `${v.lugar_emision}, a ${v.fecha_emision}`}</div>
  <div class="dest">${v.dirigido_a}${k.tipo === 'Carta para visa' && k.pais ? `<br>${en ? 'Embassy / Consulate of' : 'Embajada / Consulado de'} ${v.pais}` : ''}${k.tipo === 'Carta para beca' && k.institucion ? `<br>${v.institucion}` : ''}<br>${en ? 'Present' : 'Presente'}</div>
  <h1>${rellenar(p.titulo, v)}</h1>
  ${rellenar(p.cuerpo, v)}
  <div class="firma">${en ? 'Sincerely,' : 'A t e n t a m e n t e'}<div style="height:60px"></div><div class="linea"></div><b>${v.firmante_nombre}</b>${v.firmante_puesto}<br>${v.empresa_razon_social}</div>
  <div class="pie"><span>${en ? 'Reference' : 'Folio de control'}: ${v.folio} · ${en ? 'Issued' : 'Emitida'}: ${esc(fmtFecha(k.fecha))}</span><span>${v.empresa_nombre} · Recursos Humanos</span></div>
</div></body></html>`
}

export function abrirConstancia(ctx: ContextoConstancia) {
  const w = window.open('', '_blank')
  if (!w) return alert('Permite las ventanas emergentes para imprimir la constancia.')
  w.document.write(htmlConstancia(ctx, { boton: true }))
  w.document.close()
}
