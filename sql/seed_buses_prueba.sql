-- ============================================================
-- SEED: Buses de prueba para los 3 tipos (normal, vip, doble_piso)
-- Seguro: solo inserta si las placas SEED-* no existen aun.
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

DO $$
DECLARE
  v_coop_id    integer;
  v_ruta_id    integer;
  v_bus_norm   integer;
  v_bus_vip    integer;
  v_bus_doble  integer;
  fila         integer;
  col          integer;
BEGIN

  -- 1) Obtener la primera cooperativa activa
  SELECT id INTO v_coop_id
  FROM cooperativas
  WHERE estado = 'activa'
  LIMIT 1;

  IF v_coop_id IS NULL THEN
    RAISE NOTICE 'No hay cooperativas activas. Cancela el seed.';
    RETURN;
  END IF;

  -- 2) Obtener la primera ruta disponible
  SELECT id INTO v_ruta_id
  FROM rutas
  LIMIT 1;

  IF v_ruta_id IS NULL THEN
    RAISE NOTICE 'No hay rutas. Cancela el seed.';
    RETURN;
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- BUS NORMAL  (placa SEED-NORM-01)
  -- 10 filas x 4 columnas = 40 asientos
  -- ──────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM buses WHERE placa = 'SEED-NORM-01') THEN

    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'SEED-NORM-01', 40, 'normal', true, 'SEED-N01')
    RETURNING id INTO v_bus_norm;

    FOR fila IN 1..10 LOOP
      FOR col IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_norm, (fila - 1) * 4 + col, fila, col, 'normal', true);
      END LOOP;
    END LOOP;

    INSERT INTO viajes (bus_id, ruta_id, fecha_salida, fecha_llegada_est, precio_base, estado)
    VALUES (
      v_bus_norm,
      v_ruta_id,
      NOW() + INTERVAL '1 day 8 hours',
      NOW() + INTERVAL '1 day 11 hours',
      8.50,
      'programado'
    );

    RAISE NOTICE 'Bus normal creado: id=%', v_bus_norm;
  ELSE
    RAISE NOTICE 'Bus SEED-NORM-01 ya existe, omitido.';
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- BUS VIP  (placa SEED-VIP-01)
  -- 8 filas x 4 columnas = 32 asientos tipo vip
  -- ──────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM buses WHERE placa = 'SEED-VIP-01') THEN

    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'SEED-VIP-01', 32, 'vip', true, 'SEED-V01')
    RETURNING id INTO v_bus_vip;

    FOR fila IN 1..8 LOOP
      FOR col IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_vip, (fila - 1) * 4 + col, fila, col, 'vip', true);
      END LOOP;
    END LOOP;

    INSERT INTO viajes (bus_id, ruta_id, fecha_salida, fecha_llegada_est, precio_base, estado)
    VALUES (
      v_bus_vip,
      v_ruta_id,
      NOW() + INTERVAL '1 day 10 hours',
      NOW() + INTERVAL '1 day 13 hours',
      14.00,
      'programado'
    );

    RAISE NOTICE 'Bus VIP creado: id=%', v_bus_vip;
  ELSE
    RAISE NOTICE 'Bus SEED-VIP-01 ya existe, omitido.';
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- BUS DOBLE PISO  (placa SEED-DBL-01)
  -- Piso 1: filas 1-8  x 4 cols = 32 asientos normales
  -- Piso 2: filas 9-15 x 4 cols = 28 asientos vip
  -- Total: 60 asientos
  -- ──────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM buses WHERE placa = 'SEED-DBL-01') THEN

    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'SEED-DBL-01', 60, 'doble_piso', true, 'SEED-D01')
    RETURNING id INTO v_bus_doble;

    -- Piso 1 (normal)
    FOR fila IN 1..8 LOOP
      FOR col IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_doble, (fila - 1) * 4 + col, fila, col, 'normal', true);
      END LOOP;
    END LOOP;

    -- Piso 2 (vip / premium)
    FOR fila IN 9..15 LOOP
      FOR col IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_doble, (fila - 1) * 4 + col, fila, col, 'vip', true);
      END LOOP;
    END LOOP;

    INSERT INTO viajes (bus_id, ruta_id, fecha_salida, fecha_llegada_est, precio_base, estado)
    VALUES (
      v_bus_doble,
      v_ruta_id,
      NOW() + INTERVAL '1 day 12 hours',
      NOW() + INTERVAL '1 day 15 hours',
      11.00,
      'programado'
    );

    RAISE NOTICE 'Bus doble piso creado: id=%', v_bus_doble;
  ELSE
    RAISE NOTICE 'Bus SEED-DBL-01 ya existe, omitido.';
  END IF;

  RAISE NOTICE 'Seed finalizado sin errores.';

END $$;
