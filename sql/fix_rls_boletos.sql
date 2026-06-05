-- Script para corregir políticas RLS (Row Level Security) para roles administrativos (oficinistas y administradores)
-- Ejecutar este script en: Supabase Dashboard > SQL Editor > New query -> Run

-- Habilitar RLS en las tablas implicadas por seguridad (en caso de que no lo estén)
ALTER TABLE "public"."reservas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pagos" ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: La tabla "usuarios" NO tenía RLS activo en el esquema original.
-- Al habilitarlo, se bloquearon las consultas de autenticación para pasajeros y choferes.
-- Deshabilitamos RLS en la tabla "usuarios" para restaurar el comportamiento original.
ALTER TABLE "public"."usuarios" DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. POLÍTICAS PARA LA TABLA "reservas"
-- ==========================================

-- Permitir SELECT (ver historial de boletos) a administradores y oficinistas
DROP POLICY IF EXISTS "admins_oficinistas_select_reservas" ON "public"."reservas";
CREATE POLICY "admins_oficinistas_select_reservas" ON "public"."reservas"
FOR SELECT TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."usuarios" "u"
    WHERE "lower"("u"."email") = "lower"("auth"."jwt"() ->> 'email')
      AND "u"."activo" = true
      AND "u"."rol" IN ('administrador', 'oficinista')
  )
);

-- Permitir UPDATE (cambiar estado a confirmada/rechazada) a administradores y oficinistas
DROP POLICY IF EXISTS "admins_oficinistas_update_reservas" ON "public"."reservas";
CREATE POLICY "admins_oficinistas_update_reservas" ON "public"."reservas"
FOR UPDATE TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."usuarios" "u"
    WHERE "lower"("u"."email") = "lower"("auth"."jwt"() ->> 'email')
      AND "u"."activo" = true
      AND "u"."rol" IN ('administrador', 'oficinista')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."usuarios" "u"
    WHERE "lower"("u"."email") = "lower"("auth"."jwt"() ->> 'email')
      AND "u"."activo" = true
      AND "u"."rol" IN ('administrador', 'oficinista')
  )
);


-- ==========================================
-- 2. POLÍTICAS PARA LA TABLA "pagos"
-- ==========================================

-- Permitir SELECT (ver comprobante de pago en el modal) a administradores y oficinistas
DROP POLICY IF EXISTS "admins_oficinistas_select_pagos" ON "public"."pagos";
CREATE POLICY "admins_oficinistas_select_pagos" ON "public"."pagos"
FOR SELECT TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."usuarios" "u"
    WHERE "lower"("u"."email") = "lower"("auth"."jwt"() ->> 'email')
      AND "u"."activo" = true
      AND "u"."rol" IN ('administrador', 'oficinista')
  )
);

-- Permitir UPDATE (validar o rechazar pagos si fuese necesario) a administradores y oficinistas
DROP POLICY IF EXISTS "admins_oficinistas_update_pagos" ON "public"."pagos";
CREATE POLICY "admins_oficinistas_update_pagos" ON "public"."pagos"
FOR UPDATE TO "authenticated"
USING (
  EXISTS (
    SELECT 1 FROM "public"."usuarios" "u"
    WHERE "lower"("u"."email") = "lower"("auth"."jwt"() ->> 'email')
      AND "u"."activo" = true
      AND "u"."rol" IN ('administrador', 'oficinista')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."usuarios" "u"
    WHERE "lower"("u"."email") = "lower"("auth"."jwt"() ->> 'email')
      AND "u"."activo" = true
      AND "u"."rol" IN ('administrador', 'oficinista')
  )
);


-- ==========================================
-- 3. LIMPIEZA DE POLÍTICAS ANTERIORES DE "usuarios"
-- ==========================================
-- Al desactivar RLS en la tabla "usuarios", removemos las políticas anteriores para limpiar el estado.
DROP POLICY IF EXISTS "admins_oficinistas_select_usuarios" ON "public"."usuarios";
DROP POLICY IF EXISTS "admins_oficinistas_insert_usuarios" ON "public"."usuarios";
DROP POLICY IF EXISTS "admins_oficinistas_update_usuarios" ON "public"."usuarios";
DROP POLICY IF EXISTS "usuarios_update_propio_perfil" ON "public"."usuarios";
DROP POLICY IF EXISTS "admins_oficinistas_delete_usuarios" ON "public"."usuarios";
