-- Los préstamos pertenecen al módulo de Nómina (mismo permiso).
create or replace function privado.rh_modulo(p_coleccion text) returns text
language sql immutable set search_path = '' as $$
  select case p_coleccion
    when 'documentos' then 'expedientes'
    when 'nominas' then 'nomina'
    when 'prestamos' then 'nomina'
    when 'empresas' then 'configuracion'
    when 'ajustes' then 'configuracion'
    else p_coleccion
  end
$$;
