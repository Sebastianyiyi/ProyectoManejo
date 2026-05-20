-- Fix completo: crea los buses que faltan con sus asientos y viajes
-- Ejecutar en: Supabase > SQL Editor

DO $$
DECLARE
  v_ruta_id   integer;
  v_coop_id   integer;
  v_bus_eco   integer;
  v_bus_pre   integer;
BEGIN
  SELECT id INTO v_coop_id FROM cooperativas LIMIT 1;

  SELECT id INTO v_ruta_id FROM rutas
  WHERE lower(ciudad_origen) LIKE '%quito%'
    AND lower(ciudad_destino) LIKE '%ibarra%'
  LIMIT 1;

  IF v_ruta_id IS NULL THEN
    RAISE NOTICE 'No se encontro ruta Quito->Ibarra';
    RETURN;
  END IF;

  RAISE NOTICE 'Usando cooperativa: %, ruta: %', v_coop_id, v_ruta_id;

  -- ── Bus ECONOMICO (Normal) ──────────────────────────────
  SELECT id INTO v_bus_eco FROM buses WHERE placa = 'ECO-QI23';

  IF v_bus_eco IS NULL THEN
    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'ECO-QI23', 40, 'economico', true, 'EQ23')
    RETURNING id INTO v_bus_eco;
    RAISE NOTICE 'Bus economico creado: id=%', v_bus_eco;

    FOR f IN 1..10 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_eco, (f-1)*4+c, f, c, 'normal', true);
      END LOOP;
    END LOOP;
  ELSE
    RAISE NOTICE 'Bus economico ya existe: id=%', v_bus_eco;
  END IF;

  -- ── Bus PREMIUM (Doble Piso) ────────────────────────────
  SELECT id INTO v_bus_pre FROM buses WHERE placa = 'PRE-QI23';

  IF v_bus_pre IS NULL THEN
    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'PRE-QI23', 60, 'premium', true, 'PQ23')
    RETURNING id INTO v_bus_pre;
    RAISE NOTICE 'Bus premium creado: id=%', v_bus_pre;

    -- Piso 1: normal
    FOR f IN 1..8 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_pre, (f-1)*4+c, f, c, 'normal', true);
      END LOOP;
    END LOOP;

    -- Piso 2: ejecutivo
    FOR f IN 9..15 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_pre, (f-1)*4+c, f, c, 'ejecutivo', true);
      END LOOP;
    END LOOP;
  ELSE
    RAISE NOTICE 'Bus premium ya existe: id=%', v_bus_pre;
  END IF;

  -- ── Viajes del 23 de mayo ───────────────────────────────
  -- chofer_id = 5  -- Viaje Normal (economico) 08:00  →  precio_base: $4.00
  INSERT INTO viajes (bus_id, ruta_id, chofer_id, fecha_salida, fecha_llegada_est, precio_base, estado)
  VALUES (v_bus_eco, v_ruta_id, 5,
    '2026-05-23T08:00:00-05:00',
    '2026-05-23T10:30:00-05:00',
    4.00, 'programado');

  -- Viaje Doble Piso (premium) 14:00  →  precio_base: $6.00
  INSERT INTO viajes (bus_id, ruta_id, chofer_id, fecha_salida, fecha_llegada_est, precio_base, estado)
  VALUES (v_bus_pre, v_ruta_id, 5,
    '2026-05-23T14:00:00-05:00',
    '2026-05-23T16:30:00-05:00',
    6.00, 'programado');

  RAISE NOTICE 'Listo: viajes Normal y Doble Piso creados para el 23 de mayo.';
END $$;
