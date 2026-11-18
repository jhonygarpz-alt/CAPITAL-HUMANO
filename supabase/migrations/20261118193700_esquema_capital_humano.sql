-- Esquema de Capital Humano (aplicado en el proyecto Supabase "capital-humano").
-- Se conserva aquí como referencia / para recrear la base en otro proyecto.

-- Miembros con acceso al sistema
create table public.rh_miembros (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  rol text not null default 'usuario' check (rol in ('admin','usuario')),
  created_at timestamptz not null default now()
);

-- Invitaciones por correo (las crea un administrador)
create table public.rh_invitaciones (
  email text primary key,
  rol text not null default 'usuario' check (rol in ('admin','usuario')),
  created_at timestamptz not null default now()
);

-- Todos los registros del sistema (empresas, colaboradores, contratos, etc.)
create table public.rh_registros (
  coleccion text not null,
  id text not null,
  empresa_id text,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (coleccion, id)
);
create index rh_registros_empresa_idx on public.rh_registros (empresa_id);

-- Funciones auxiliares en un esquema no expuesto por la API
create schema if not exists privado;
grant usage on schema privado to authenticated;

create or replace function privado.rh_es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rh_miembros where user_id = auth.uid())
$$;

create or replace function privado.rh_es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rh_miembros where user_id = auth.uid() and rol = 'admin')
$$;

revoke execute on function privado.rh_es_miembro() from anon, public;
grant execute on function privado.rh_es_miembro() to authenticated;
revoke execute on function privado.rh_es_admin() from anon, public;
grant execute on function privado.rh_es_admin() to authenticated;

-- Da acceso al usuario actual: el primero es admin; los demás solo si fueron invitados
create or replace function public.rh_reclamar_acceso() returns text
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_rol text;
begin
  if auth.uid() is null then return 'sin_sesion'; end if;
  if exists (select 1 from rh_miembros where user_id = auth.uid()) then return 'ok'; end if;
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

revoke execute on function public.rh_reclamar_acceso() from anon, public;
grant execute on function public.rh_reclamar_acceso() to authenticated;

alter table public.rh_miembros enable row level security;
alter table public.rh_invitaciones enable row level security;
alter table public.rh_registros enable row level security;

create policy "miembros leen miembros" on public.rh_miembros for select to authenticated using (privado.rh_es_miembro());
create policy "admin modifica miembros" on public.rh_miembros for update to authenticated using (privado.rh_es_admin()) with check (privado.rh_es_admin());
create policy "admin elimina miembros" on public.rh_miembros for delete to authenticated using (privado.rh_es_admin() and user_id <> auth.uid());

create policy "admin lee invitaciones" on public.rh_invitaciones for select to authenticated using (privado.rh_es_admin());
create policy "admin crea invitaciones" on public.rh_invitaciones for insert to authenticated with check (privado.rh_es_admin());
create policy "admin elimina invitaciones" on public.rh_invitaciones for delete to authenticated using (privado.rh_es_admin());

create policy "miembros leen registros" on public.rh_registros for select to authenticated using (privado.rh_es_miembro());
create policy "miembros crean registros" on public.rh_registros for insert to authenticated with check (privado.rh_es_miembro());
create policy "miembros actualizan registros" on public.rh_registros for update to authenticated using (privado.rh_es_miembro()) with check (privado.rh_es_miembro());
create policy "miembros eliminan registros" on public.rh_registros for delete to authenticated using (privado.rh_es_miembro());

-- Tiempo real
alter publication supabase_realtime add table public.rh_registros;
alter table public.rh_registros replica identity full;

-- Archivos de expedientes (privado, máx. 10 MB)
insert into storage.buckets (id, name, public, file_size_limit) values ('rh-archivos', 'rh-archivos', false, 10485760)
on conflict (id) do nothing;

create policy "miembros leen archivos" on storage.objects for select to authenticated using (bucket_id = 'rh-archivos' and privado.rh_es_miembro());
create policy "miembros suben archivos" on storage.objects for insert to authenticated with check (bucket_id = 'rh-archivos' and privado.rh_es_miembro());
create policy "miembros actualizan archivos" on storage.objects for update to authenticated using (bucket_id = 'rh-archivos' and privado.rh_es_miembro());
create policy "miembros eliminan archivos" on storage.objects for delete to authenticated using (bucket_id = 'rh-archivos' and privado.rh_es_miembro());
