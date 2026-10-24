-- Vecinii (rol proprietar) doar vad datele. Doar administratorul/managerul scrie.
-- De rulat o singura data in Supabase -> SQL Editor.
-- calculeaza_luna() e SECURITY DEFINER, deci recalcularea automata merge in continuare.

drop policy if exists "Sistemul gestioneaza calculele" on calcule_lunare;
create policy "Admin gestioneaza calculele" on calcule_lunare for all
  using (get_rol() = any (array['administrator','manager']))
  with check (get_rol() = any (array['administrator','manager']));

drop policy if exists "Proprietarul introduce citiri pentru apartamentul sau" on citiri;
drop policy if exists "Proprietarul modifica citiri pentru apartamentul sau" on citiri;
create policy "Admin si manager introduc citiri" on citiri for insert
  with check (get_rol() = any (array['administrator','manager']));
create policy "Admin si manager modifica citiri" on citiri for update
  using (get_rol() = any (array['administrator','manager']));

-- 21.10.2026: toti vecinii vad situatia platilor (aceleasi sume ca in PDF-ul de pe grup). Scrierea ramane doar la admin.
create policy "Toti vad platile" on plati for select to authenticated using (true);

-- 24.10.2026: proprietarii isi introduc singuri citirea (doar apartamentul lor, doar luna curenta nevalidata, index nou >= vechi)
create or replace function public.e_luna_deschisa(p_luna_id integer) returns boolean language sql stable security definer as $$
  select coalesce((select not coalesce(l.validata,false) and (l.an*12+l.luna) = (select max(an*12+luna) from luni_facturare) from luni_facturare l where l.id = p_luna_id), false);
$$;
create policy "Proprietarul introduce citirea lui in luna deschisa" on citiri for insert to authenticated
  with check (get_rol() = 'proprietar' and apartament_id = get_apartament() and e_luna_deschisa(luna_id) and index_nou >= index_vechi);
create policy "Proprietarul corecteaza citirea lui in luna deschisa" on citiri for update to authenticated
  using (get_rol() = 'proprietar' and apartament_id = get_apartament() and e_luna_deschisa(luna_id))
  with check (get_rol() = 'proprietar' and apartament_id = get_apartament() and e_luna_deschisa(luna_id) and index_nou >= index_vechi);
-- poze citiri: bucket privat citiri-poze, cale {luna_id}/{apartament_id}/{fisier}
alter table citiri add column if not exists poza_path text;
create policy "Toti vad pozele citirilor" on storage.objects for select to authenticated using (bucket_id = 'citiri-poze');
create policy "Admin gestioneaza pozele citirilor" on storage.objects for all to authenticated using (bucket_id = 'citiri-poze' and get_rol() = any (array['administrator','manager'])) with check (bucket_id = 'citiri-poze' and get_rol() = any (array['administrator','manager']));
create policy "Proprietarul incarca poza lui" on storage.objects for insert to authenticated with check (bucket_id = 'citiri-poze' and (storage.foldername(name))[2] = get_apartament()::text and e_luna_deschisa(((storage.foldername(name))[1])::integer));
