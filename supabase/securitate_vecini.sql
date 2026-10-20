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
