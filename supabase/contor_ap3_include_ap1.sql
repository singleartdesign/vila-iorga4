-- 21.10.2026: apometrul Ap. 3 inregistreaza si consumul Ap. 1 (teava Ap. 1 trece prin contorul Ap. 3).
-- Consum propriu Ap. 3 = consum contor Ap. 3 - consum Ap. 1, cumulat in timp (citirile lipsa se compenseaza luna urmatoare).
-- De rulat o singura data in Supabase -> SQL Editor (coloana apartamente.contor_include_apartament si functia consum_efectiv exista deja).

CREATE OR REPLACE FUNCTION public.calculeaza_luna(p_luna_id integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
  v_luna luni_facturare%ROWTYPE; v_consum_total NUMERIC(10,3); v_pierdere NUMERIC(10,3); v_nr INTEGER;
  v_c citiri%ROWTYPE; v_pp NUMERIC(10,3); v_proc NUMERIC(5,2); v_ef NUMERIC(10,3);
BEGIN
  SELECT * INTO v_luna FROM luni_facturare WHERE id = p_luna_id;
  DELETE FROM calcule_lunare WHERE luna_id = p_luna_id;
  SELECT COALESCE(SUM(consum_efectiv(p_luna_id, apartament_id)),0), COUNT(*) INTO v_consum_total, v_nr FROM citiri WHERE luna_id = p_luna_id;
  v_pierdere := v_luna.consum_facturat - v_consum_total;
  FOR v_c IN SELECT * FROM citiri WHERE luna_id = p_luna_id ORDER BY apartament_id LOOP
    v_ef := consum_efectiv(p_luna_id, v_c.apartament_id);
    IF v_luna.mod_repartizare = 'egal' THEN
      v_pp := CASE WHEN v_nr > 0 THEN v_pierdere / v_nr ELSE 0 END;
    ELSIF v_luna.mod_repartizare = 'proportional' THEN
      v_pp := CASE WHEN v_consum_total > 0 THEN v_pierdere * (v_ef / v_consum_total) ELSE 0 END;
    ELSE
      SELECT COALESCE(procent,0) INTO v_proc FROM pierdere_atribuiri WHERE luna_id = p_luna_id AND apartament_id = v_c.apartament_id;
      v_pp := v_pierdere * (COALESCE(v_proc,0) / 100.0);
    END IF;
    INSERT INTO calcule_lunare (luna_id, apartament_id, consum_individual, consum_contor, consum_total_bloc, pierdere_totala, pierdere_repartizata, mc_de_plata, suma_calculata)
    VALUES (p_luna_id, v_c.apartament_id, v_ef, v_c.consum, v_consum_total, v_pierdere, v_pp, v_ef + v_pp, (v_ef + v_pp) * v_luna.pret_per_mc);
    INSERT INTO plati (luna_id, apartament_id, suma_calculata, status)
    VALUES (p_luna_id, v_c.apartament_id, ROUND((v_ef + v_pp) * v_luna.pret_per_mc, 2), 'neplatit')
    ON CONFLICT (luna_id, apartament_id) DO UPDATE SET suma_calculata = EXCLUDED.suma_calculata, actualizat_la = NOW();
  END LOOP;
END;
$function$;
