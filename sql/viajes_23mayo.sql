-- Viajes Quito -> Ibarra, 23 de mayo, los 3 tipos de bus
-- Ejecutar en: Supabase > SQL Editor

DO $$
DECLARE
  v_coop_id   integer;
  v_ruta_id   integer;
  v_bus_eco   integer;
  v_bus_eje   integer;
  v_bus_pre   integer;
BEGIN

  -- Cooperativa
  SELECT id INTO v_coop_id FROM cooperativas LIMIT 1;
  IF v_coop_id IS NULL THEN
    RAISE NOTICE 'No hay cooperativas. Agrega una primero.';
    RETURN;
  END IF;

  -- Buscar ruta Quito -> Ibarra (case-insensitive)
  SELECT id INTO v_ruta_id
  FROM rutas
  WHERE lower(ciudad_origen)  LIKE '%quito%'
    AND lower(ciudad_destino) LIKE '%ibarra%'
  LIMIT 1;

  -- Si no existe la ruta, la creamos
  IF v_ruta_id IS NULL THEN
    INSERT INTO rutas (ciudad_origen, ciudad_destino, distancia_km, duracion_minutos)
    VALUES ('Quito', 'Ibarra', 115, 150)
    RETURNING id INTO v_ruta_id;
    RAISE NOTICE 'Ruta Quito->Ibarra creada: id=%', v_ruta_id;
  ELSE
    RAISE NOTICE 'Ruta Quito->Ibarra encontrada: id=%', v_ruta_id;
  END IF;

  -- ── Bus ECONOMICO (Normal) ──────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM buses WHERE placa = 'ECO-QI23') THEN
    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'ECO-QI23', 40, 'economico', true, 'EQ23')
    RETURNING id INTO v_bus_eco;

    FOR f IN 1..10 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_eco, (f-1)*4+c, f, c, 'normal', true);
      END LOOP;
    END LOOP;
  ELSE
    SELECT id INTO v_bus_eco FROM buses WHERE placa = 'ECO-QI23';
  END IF;

  -- ── Bus EJECUTIVO (VIP) ─────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM buses WHERE placa = 'EJE-QI23') THEN
    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'EJE-QI23', 32, 'ejecutivo', true, 'XQ23')
    RETURNING id INTO v_bus_eje;

    FOR f IN 1..8 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_eje, (f-1)*4+c, f, c, 'vip', true);
      END LOOP;
    END LOOP;
  ELSE
    SELECT id INTO v_bus_eje FROM buses WHERE placa = 'EJE-QI23';
  END IF;

  -- ── Bus PREMIUM (Doble Piso) ────────────────────────────
  -- Piso 1: filas 1-8 (normal) | Piso 2: filas 9-15 (vip)
  IF NOT EXISTS (SELECT 1 FROM buses WHERE placa = 'PRE-QI23') THEN
    INSERT INTO buses (cooperativa_id, placa, capacidad, tipo, activo, numero)
    VALUES (v_coop_id, 'PRE-QI23', 60, 'premium', true, 'PQ23')
    RETURNING id INTO v_bus_pre;

    FOR f IN 1..8 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_pre, (f-1)*4+c, f, c, 'normal', true);
      END LOOP;
    END LOOP;

    FOR f IN 9..15 LOOP
      FOR c IN 1..4 LOOP
        INSERT INTO asientos (bus_id, numero, fila, columna, tipo, activo)
        VALUES (v_bus_pre, (f-1)*4+c, f, c, 'vip', true);
      END LOOP;
    END LOOP;
  ELSE
    SELECT id INTO v_bus_pre FROM buses WHERE placa = 'PRE-QI23';
  END IF;

  -- ── 3 Viajes del 23 de mayo Quito -> Ibarra ─────────────
  INSERT INTO viajes (bus_id, ruta_id, fecha_salida, fecha_llegada_est, precio_base, estado)
  VALUES (v_bus_eco, v_ruta_id,
    '2026-05-23T08:00:00-05:00',
    '2026-05-23T10:30:00-05:00',
    8.50, 'programado');

  INSERT INTO viajes (bus_id, ruta_id, fecha_salida, fecha_llegada_est, precio_base, estado)
  VALUES (v_bus_eje, v_ruta_id,
    '2026-05-23T10:00:00-05:00',
    '2026-05-23T12:30:00-05:00',
    14.00, 'programado');

  INSERT INTO viajes (bus_id, ruta_id, fecha_salida, fecha_llegada_est, precio_base, estado)
  VALUES (v_bus_pre, v_ruta_id,
    '2026-05-23T14:00:00-05:00',
    '2026-05-23T16:30:00-05:00',
    11.00, 'programado');

  RAISE NOTICE 'Listo: 3 viajes Quito->Ibarra el 23 de mayo creados.';

END $$;
