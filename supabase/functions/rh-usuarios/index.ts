// Administración de usuarios del sistema de RH (solo administradores).
// Acciones: listar, crear, restablecer, eliminar.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // Identifica a quien llama con su propio token y verifica que sea administrador activo
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: quien, error: errQuien } = await admin.auth.getUser(token)
  if (errQuien || !quien.user) return json({ error: 'Sesión no válida' }, 401)
  const { data: yo } = await admin.from('rh_miembros').select('rol, activo').eq('user_id', quien.user.id).maybeSingle()
  if (!yo || !yo.activo || yo.rol !== 'admin') return json({ error: 'Solo un administrador puede administrar usuarios' }, 403)

  let body: Record<string, string>
  try { body = await req.json() } catch { return json({ error: 'Solicitud inválida' }, 400) }
  const accion = body.accion

  if (accion === 'listar') {
    const { data: miembros, error } = await admin.from('rh_miembros').select('user_id, email, nombre, rol, activo, created_at').order('created_at')
    if (error) return json({ error: error.message }, 500)
    const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const info = new Map((lista?.users ?? []).map((u) => [u.id, u]))
    return json({ usuarios: (miembros ?? []).map((m) => ({ ...m, ultimo_acceso: info.get(m.user_id)?.last_sign_in_at ?? null, confirmado: !!info.get(m.user_id)?.email_confirmed_at })) })
  }

  if (accion === 'crear') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const nombre = String(body.nombre ?? '').trim()
    const rol = String(body.rol ?? 'rh')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Correo no válido' }, 400)
    if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
    const { data: existeRol } = await admin.from('rh_roles').select('id').eq('id', rol).maybeSingle()
    if (!existeRol) return json({ error: 'El rol no existe' }, 400)
    const { data: creado, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre } })
    if (error || !creado.user) {
      const msg = error?.message ?? ''
      return json({ error: /already|registered|exists/i.test(msg) ? 'Ya existe una cuenta con ese correo. Usa una invitación o restablece su contraseña.' : msg || 'No se pudo crear el usuario' }, 400)
    }
    const { error: errM } = await admin.from('rh_miembros').insert({ user_id: creado.user.id, email, nombre: nombre || null, rol })
    if (errM) { await admin.auth.admin.deleteUser(creado.user.id); return json({ error: errM.message }, 500) }
    await admin.from('rh_invitaciones').delete().eq('email', email)
    return json({ ok: true, user_id: creado.user.id })
  }

  if (accion === 'restablecer') {
    const password = String(body.password ?? '')
    if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
    const { error } = await admin.auth.admin.updateUserById(String(body.user_id), { password })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (accion === 'eliminar') {
    if (body.user_id === quien.user.id) return json({ error: 'No puedes eliminar tu propia cuenta' }, 400)
    const { error } = await admin.auth.admin.deleteUser(String(body.user_id))
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: 'Acción no reconocida' }, 400)
})
