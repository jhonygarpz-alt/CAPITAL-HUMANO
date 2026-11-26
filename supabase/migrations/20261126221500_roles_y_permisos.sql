-- Roles con permisos por módulo ('ninguno' | 'ver' | 'editar'), aplicados con RLS.
-- (Aplicado en el proyecto capital-humano. Se conserva como referencia.)
create table public.rh_roles (
  id text primary key,
  nombre text not null,
  descripcion text not null default '',
  permisos jsonb not null default '{}'::jsonb,
  sistema boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.rh_roles (id, nombre, descripcion, permisos, sistema) values
('admin', 'Administrador', 'Acceso total, incluida la configuración, usuarios y permisos.', '{}'::jsonb, true),
('rh', 'Recursos Humanos', 'Administra todo el personal y sus procesos. Consulta la configuración.',
 '{"colaboradores":"editar","expedientes":"editar","contratos":"editar","nomina":"editar","aguinaldos":"editar","asistencias":"editar","vacaciones":"editar","incidencias":"editar","constancias":"editar","vacantes":"editar","reportes":"ver","configuracion":"ver"}', true),
('nomina', 'Nómina', 'Calcula nómina y aguinaldos; registra asistencias e incidencias.',
 '{"colaboradores":"ver","expedientes":"ninguno","contratos":"ver","nomina":"editar","aguinaldos":"editar","asistencias":"editar","vacaciones":"ver","incidencias":"editar","constancias":"ver","vacantes":"ninguno","reportes":"ver","configuracion":"ninguno"}', true),
('consulta', 'Solo consulta', 'Puede ver la información pero no modificar nada.',
 '{"colaboradores":"ver","expedientes":"ver","contratos":"ver","nomina":"ver","aguinaldos":"ver","asistencias":"ver","vacaciones":"ver","incidencias":"ver","constancias":"ver","vacantes":"ver","reportes":"ver","configuracion":"ninguno"}', true);

alter table public.rh_miembros drop constraint if exists rh_miembros_rol_check;
alter table public.rh_invitaciones drop constraint if exists rh_invitaciones_rol_check;
update public.rh_miembros set rol = 'rh' where rol = 'usuario';
update public.rh_invitaciones set rol = 'rh' where rol = 'usuario';
alter table public.rh_miembros alter column rol set default 'rh';
alter table public.rh_invitaciones alter column rol set default 'rh';
alter table public.rh_miembros add column if not exists activo boolean not null default true;
alter table public.rh_miembros add constraint rh_miembros_rol_fk foreign key (rol) references public.rh_roles(id) on update cascade;
alter table public.rh_invitaciones add constraint rh_invitaciones_rol_fk foreign key (rol) references public.rh_roles(id) on update cascade on delete cascade;

create or replace function privado.rh_es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rh_miembros where user_id = auth.uid() and activo)
$$;

create or replace function privado.rh_es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rh_miembros where user_id = auth.uid() and activo and rol = 'admin')
$$;

create or replace function privado.rh_permiso(p_modulo text) returns text
language sql stable security definer set search_path = public as $$
  select case
    when m.user_id is null then 'ninguno'
    when m.rol = 'admin' then 'editar'
    else coalesce(r.permisos ->> p_modulo, 'ninguno')
  end
  from (select 1) x
  left join public.rh_miembros m on m.user_id = auth.uid() and m.activo
  left join public.rh_roles r on r.id = m.rol
$$;

create or replace function privado.rh_modulo(p_coleccion text) returns text
language sql immutable set search_path = '' as $$
  select case p_coleccion
    when 'documentos' then 'expedientes'
    when 'nominas' then 'nomina'
    when 'empresas' then 'configuracion'
    when 'ajustes' then 'configuracion'
    else p_coleccion
  end
$$;

grant execute on function privado.rh_permiso(text) to authenticated;
grant execute on function privado.rh_modulo(text) to authenticated;
revoke execute on function privado.rh_permiso(text) from anon, public;

drop policy if exists "miembros leen registros" on public.rh_registros;
drop policy if exists "miembros crean registros" on public.rh_registros;
drop policy if exists "miembros actualizan registros" on public.rh_registros;
drop policy if exists "miembros eliminan registros" on public.rh_registros;

create policy "leer segun permiso" on public.rh_registros for select to authenticated using (
  privado.rh_es_miembro() and (
    coleccion in ('empresas', 'ajustes', 'colaboradores', 'eventos')
    or privado.rh_permiso(privado.rh_modulo(coleccion)) in ('ver', 'editar')
  )
);
create policy "crear segun permiso" on public.rh_registros for insert to authenticated with check (
  privado.rh_es_miembro() and (coleccion = 'eventos' or privado.rh_permiso(privado.rh_modulo(coleccion)) = 'editar')
);
create policy "actualizar segun permiso" on public.rh_registros for update to authenticated
  using (privado.rh_es_miembro() and (coleccion = 'eventos' or privado.rh_permiso(privado.rh_modulo(coleccion)) = 'editar'))
  with check (privado.rh_es_miembro() and (coleccion = 'eventos' or privado.rh_permiso(privado.rh_modulo(coleccion)) = 'editar'));
create policy "eliminar segun permiso" on public.rh_registros for delete to authenticated using (
  privado.rh_es_miembro() and (coleccion = 'eventos' or privado.rh_permiso(privado.rh_modulo(coleccion)) = 'editar')
);

drop policy if exists "miembros leen archivos" on storage.objects;
drop policy if exists "miembros suben archivos" on storage.objects;
drop policy if exists "miembros actualizan archivos" on storage.objects;
drop policy if exists "miembros eliminan archivos" on storage.objects;
create policy "expedientes leer archivos" on storage.objects for select to authenticated using (bucket_id = 'rh-archivos' and privado.rh_permiso('expedientes') in ('ver', 'editar'));
create policy "expedientes subir archivos" on storage.objects for insert to authenticated with check (bucket_id = 'rh-archivos' and privado.rh_permiso('expedientes') = 'editar');
create policy "expedientes actualizar archivos" on storage.objects for update to authenticated using (bucket_id = 'rh-archivos' and privado.rh_permiso('expedientes') = 'editar');
create policy "expedientes eliminar archivos" on storage.objects for delete to authenticated using (bucket_id = 'rh-archivos' and privado.rh_permiso('expedientes') = 'editar');

alter table public.rh_roles enable row level security;
create policy "miembros leen roles" on public.rh_roles for select to authenticated using (privado.rh_es_miembro());
create policy "admin crea roles" on public.rh_roles for insert to authenticated with check (privado.rh_es_admin() and not sistema);
create policy "admin modifica roles" on public.rh_roles for update to authenticated using (privado.rh_es_admin() and id <> 'admin') with check (privado.rh_es_admin() and id <> 'admin');
create policy "admin elimina roles" on public.rh_roles for delete to authenticated using (privado.rh_es_admin() and not sistema);

drop policy if exists "admin modifica miembros" on public.rh_miembros;
create policy "admin modifica miembros" on public.rh_miembros for update to authenticated
  using (privado.rh_es_admin()) with check (privado.rh_es_admin() and (user_id <> auth.uid() or (rol = 'admin' and activo)));

create or replace function public.rh_reclamar_acceso() returns text
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_rol text;
  v_activo boolean;
begin
  if auth.uid() is null then return 'sin_sesion'; end if;
  select activo into v_activo from rh_miembros where user_id = auth.uid();
  if v_activo is not null then return case when v_activo then 'ok' else 'inactivo' end; end if;
  select email into v_email from auth.users where id = auth.uid();
  if not exists (select 1 from rh_miembros) then
    insert into rh_miembros (user_id, email, rol) values (auth.uid(), v_email, 'admin');
    return 'ok';
  end if;
  select rol into v_rol from rh_invitaciones where lower(email) = lower(v_email);
  if v_rol is null then return 'sin_invitacion'; end if;
  insert into rh_miembros (user_id, email, rol) values (auth.uid(), v_email, v_rol);
  delete from rh_invitaciones where lower(email) = lower(v_email);
  return 'ok';
end $$;
