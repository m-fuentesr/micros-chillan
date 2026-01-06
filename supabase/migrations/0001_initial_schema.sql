


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."actor_tipo_enum" AS ENUM (
    'admin',
    'chofer'
);


ALTER TYPE "public"."actor_tipo_enum" OWNER TO "postgres";


CREATE TYPE "public"."alerta_estado_enum" AS ENUM (
    'activa',
    'resuelta'
);


ALTER TYPE "public"."alerta_estado_enum" OWNER TO "postgres";


CREATE TYPE "public"."alerta_origen_tipo_enum" AS ENUM (
    'maquina',
    'chofer',
    'registro_diario',
    'pago'
);


ALTER TYPE "public"."alerta_origen_tipo_enum" OWNER TO "postgres";


CREATE TYPE "public"."alerta_severidad_enum" AS ENUM (
    'critica',
    'advertencia',
    'informativa'
);


ALTER TYPE "public"."alerta_severidad_enum" OWNER TO "postgres";


CREATE TYPE "public"."alerta_tipo_enum" AS ENUM (
    'incidente_critico',
    'registro_faltante',
    'doc_vencida',
    'doc_por_vencer',
    'licencia_vencida',
    'licencia_por_vencer',
    'asignacion_maquina',
    'confirmacion_pago',
    'registro_diario'
);


ALTER TYPE "public"."alerta_tipo_enum" OWNER TO "postgres";


CREATE TYPE "public"."chofer_estado_enum" AS ENUM (
    'activo',
    'inactivo',
    'eliminado'
);


ALTER TYPE "public"."chofer_estado_enum" OWNER TO "postgres";


CREATE TYPE "public"."documento_maquina_tipo_enum" AS ENUM (
    'revision_tecnica',
    'permiso_circulacion',
    'seguro_obligatorio'
);


ALTER TYPE "public"."documento_maquina_tipo_enum" OWNER TO "postgres";


CREATE TYPE "public"."liquidacion_estado_pago_enum" AS ENUM (
    'pendiente',
    'pagado'
);


ALTER TYPE "public"."liquidacion_estado_pago_enum" OWNER TO "postgres";


CREATE TYPE "public"."liquidacion_metodo_pago_enum" AS ENUM (
    'transferencia',
    'efectivo'
);


ALTER TYPE "public"."liquidacion_metodo_pago_enum" OWNER TO "postgres";


CREATE TYPE "public"."mantenimiento_categoria_enum" AS ENUM (
    'preventivo',
    'correctivo'
);


ALTER TYPE "public"."mantenimiento_categoria_enum" OWNER TO "postgres";


CREATE TYPE "public"."maquina_estado_operativo_enum" AS ENUM (
    'operativa',
    'inactiva',
    'en_taller'
);


ALTER TYPE "public"."maquina_estado_operativo_enum" OWNER TO "postgres";


CREATE TYPE "public"."motivo_no_trabajado_enum" AS ENUM (
    'descanso_semanal',
    'vacaciones',
    'licencia_medica',
    'permiso_personal',
    'maquina_en_mantenimiento',
    'sin_asignacion_ruta',
    'otro'
);


ALTER TYPE "public"."motivo_no_trabajado_enum" OWNER TO "postgres";


CREATE TYPE "public"."registro_diario_estado_enum" AS ENUM (
    'pendiente_trabajador',
    'completo',
    'faltante',
    'incidente_reportado',
    'no_trabajado'
);


ALTER TYPE "public"."registro_diario_estado_enum" OWNER TO "postgres";


CREATE TYPE "public"."usuario_estado_enum" AS ENUM (
    'activo',
    'inactivo'
);


ALTER TYPE "public"."usuario_estado_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_saldo_cuenta"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si es CARGO (Préstamo), RESTAMOS al saldo (se hace más negativo)
    IF (NEW.tipo = 'CARGO') THEN
        UPDATE public.cuentas_corrientes 
        SET saldo_actual = saldo_actual - NEW.monto,
            updated_at = now()
        WHERE id = NEW.cuenta_id;
    
    -- Si es ABONO (Pago), SUMAMOS al saldo (se acerca a cero o positivo)
    ELSIF (NEW.tipo = 'ABONO') THEN
        UPDATE public.cuentas_corrientes 
        SET saldo_actual = saldo_actual + NEW.monto,
            updated_at = now()
        WHERE id = NEW.cuenta_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."actualizar_saldo_cuenta"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."actor_auditoria" (
    "id" integer NOT NULL,
    "tipo_actor" "public"."actor_tipo_enum" NOT NULL,
    "usuario_id" integer,
    "chofer_id" integer,
    "nombre_completo" "text" NOT NULL,
    "rol_nombre" "text" NOT NULL,
    "rut" "text",
    "correo" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."actor_auditoria" OWNER TO "postgres";


ALTER TABLE "public"."actor_auditoria" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."actor_auditoria_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."alertas" (
    "id" integer NOT NULL,
    "tipo" "public"."alerta_tipo_enum" NOT NULL,
    "severidad" "public"."alerta_severidad_enum" NOT NULL,
    "mensaje" "text" NOT NULL,
    "origen_tipo" "public"."alerta_origen_tipo_enum" NOT NULL,
    "origen_id" integer NOT NULL,
    "fecha_generada" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estado" "public"."alerta_estado_enum" DEFAULT 'activa'::"public"."alerta_estado_enum" NOT NULL,
    "fecha_resuelta" timestamp with time zone,
    "resuelta_por" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."alertas" REPLICA IDENTITY FULL;


ALTER TABLE "public"."alertas" OWNER TO "postgres";


ALTER TABLE "public"."alertas" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."alertas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."asignaciones_chofer_maquina" (
    "id" integer NOT NULL,
    "maquina_id" integer NOT NULL,
    "chofer_id" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_termino" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."asignaciones_chofer_maquina" OWNER TO "postgres";


ALTER TABLE "public"."asignaciones_chofer_maquina" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."asignaciones_chofer_maquina_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."choferes" (
    "id" integer NOT NULL,
    "primer_nombre" "text" NOT NULL,
    "segundo_nombre" "text",
    "apellido_paterno" "text" NOT NULL,
    "apellido_materno" "text" NOT NULL,
    "rut" "text" NOT NULL,
    "telefono" "text" NOT NULL,
    "porcentaje_pago" numeric(5,2) DEFAULT 0.30 NOT NULL,
    "estado" "public"."chofer_estado_enum" DEFAULT 'activo'::"public"."chofer_estado_enum" NOT NULL,
    "fecha_venc_licencia" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_contrato" "date"
);


ALTER TABLE "public"."choferes" OWNER TO "postgres";


ALTER TABLE "public"."choferes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."choferes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."cierres_mensuales" (
    "id" integer NOT NULL,
    "mes" integer NOT NULL,
    "anio" integer NOT NULL,
    "fecha_cierre" timestamp with time zone NOT NULL,
    "total_pagado" numeric(12,2) NOT NULL,
    "cerrado_por" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cierres_mensuales" OWNER TO "postgres";


ALTER TABLE "public"."cierres_mensuales" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."cierres_mensuales_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."compras_repuestos" (
    "id" integer NOT NULL,
    "maquina_id" integer NOT NULL,
    "item_repuesto_id" integer,
    "item_personalizado" "text",
    "costo" numeric NOT NULL,
    "numero_documento" "text" NOT NULL,
    "categoria" "public"."mantenimiento_categoria_enum",
    "fecha_compra" "date" NOT NULL,
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "compras_repuestos_item_consistency" CHECK (((("item_repuesto_id" IS NOT NULL) AND ("item_personalizado" IS NULL)) OR (("item_repuesto_id" IS NULL) AND ("item_personalizado" IS NOT NULL))))
);


ALTER TABLE "public"."compras_repuestos" OWNER TO "postgres";


ALTER TABLE "public"."compras_repuestos" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."compras_repuestos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."configuracion_general" (
    "id" integer NOT NULL,
    "sueldo_minimo" numeric(12,2) DEFAULT 750000 NOT NULL,
    "porcentaje_default" numeric(5,2) DEFAULT 0.30 NOT NULL,
    "dias_alerta_licencia_por_vencer" integer DEFAULT 30 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dias_alerta_documento_por_vencer" integer DEFAULT 30 NOT NULL
);


ALTER TABLE "public"."configuracion_general" OWNER TO "postgres";


ALTER TABLE "public"."configuracion_general" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."configuracion_general_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."cuentas_corrientes" (
    "id" bigint NOT NULL,
    "chofer_id" integer NOT NULL,
    "saldo_actual" bigint DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."cuentas_corrientes" OWNER TO "postgres";


ALTER TABLE "public"."cuentas_corrientes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."cuentas_corrientes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."documentos_maquina" (
    "id" integer NOT NULL,
    "maquina_id" integer NOT NULL,
    "tipo_documento" "public"."documento_maquina_tipo_enum" NOT NULL,
    "fecha_vencimiento" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documentos_maquina" OWNER TO "postgres";


ALTER TABLE "public"."documentos_maquina" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."documentos_maquina_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."historial_movimientos" (
    "id" bigint NOT NULL,
    "cuenta_id" bigint NOT NULL,
    "tipo" character varying(20) NOT NULL,
    "monto" bigint NOT NULL,
    "descripcion" "text",
    "fecha_movimiento" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "historial_movimientos_monto_check" CHECK (("monto" > 0)),
    CONSTRAINT "historial_movimientos_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['CARGO'::character varying, 'ABONO'::character varying])::"text"[])))
);


ALTER TABLE "public"."historial_movimientos" OWNER TO "postgres";


ALTER TABLE "public"."historial_movimientos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."historial_movimientos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."items_repuesto" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."items_repuesto" OWNER TO "postgres";


ALTER TABLE "public"."items_repuesto" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."items_repuesto_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."liquidaciones" (
    "id" integer NOT NULL,
    "chofer_id" integer NOT NULL,
    "mes" integer NOT NULL,
    "anio" integer NOT NULL,
    "sueldo_minimo" numeric(12,2) NOT NULL,
    "porcentaje_ganado" numeric(12,2),
    "monto_faltante" numeric(12,2),
    "total_final" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."liquidaciones" OWNER TO "postgres";


ALTER TABLE "public"."liquidaciones" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."liquidaciones_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."maquinas" (
    "id" integer NOT NULL,
    "numero_interno" integer NOT NULL,
    "marca" "text" NOT NULL,
    "anio_fabricacion" integer NOT NULL,
    "patente" "text" NOT NULL,
    "descripcion" "text",
    "estado_operativo" "public"."maquina_estado_operativo_enum" DEFAULT 'operativa'::"public"."maquina_estado_operativo_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."maquinas" OWNER TO "postgres";


ALTER TABLE "public"."maquinas" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."maquinas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pagos_semanales" (
    "id" integer NOT NULL,
    "chofer_id" integer NOT NULL,
    "mes" integer NOT NULL,
    "anio" integer NOT NULL,
    "semana" integer NOT NULL,
    "base_ganado" numeric NOT NULL,
    "ajuste_garantizado" numeric DEFAULT 0,
    "total_pagado" numeric NOT NULL,
    "metodo_pago" "text",
    "fecha_pago" "date",
    "codigo_transferencia" "text",
    "estado_pago" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pagos_semanales" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pagos_semanales_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pagos_semanales_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pagos_semanales_id_seq" OWNED BY "public"."pagos_semanales"."id";



CREATE TABLE IF NOT EXISTS "public"."registros_diarios" (
    "id" integer NOT NULL,
    "maquina_id" integer NOT NULL,
    "chofer_id" integer NOT NULL,
    "fecha" "date" NOT NULL,
    "monto_recaudado" numeric(12,2),
    "litros_diesel" numeric(8,2),
    "costo_total_diesel" numeric(12,2),
    "porcentaje_aplicado" numeric(5,2) NOT NULL,
    "monto_porcentaje_chofer" numeric(12,2) NOT NULL,
    "imagen_url" "text",
    "imagen_updated_at" timestamp with time zone,
    "estado" "public"."registro_diario_estado_enum" NOT NULL,
    "es_dia_no_trabajado" boolean DEFAULT false NOT NULL,
    "motivo_no_trabajado" "public"."motivo_no_trabajado_enum",
    "motivo_no_trabajado_otro" "text",
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "imagen_comprobante_diesel_url" "text",
    "imagen_url_updated_at" timestamp with time zone,
    "imagen_comprobante_diesel_url_updated_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."registros_diarios" REPLICA IDENTITY FULL;


ALTER TABLE "public"."registros_diarios" OWNER TO "postgres";


COMMENT ON COLUMN "public"."registros_diarios"."imagen_url_updated_at" IS 'Timestamp de cuándo se actualizó por última vez la imagen del comprobante del registro diario';



COMMENT ON COLUMN "public"."registros_diarios"."imagen_comprobante_diesel_url_updated_at" IS 'Timestamp de cuándo se actualizó por última vez la imagen del comprobante de diésel';



CREATE TABLE IF NOT EXISTS "public"."registros_diarios_auditoria" (
    "id" bigint NOT NULL,
    "registro_diario_id" integer NOT NULL,
    "version" integer NOT NULL,
    "campo" "text" NOT NULL,
    "valor_anterior" "text",
    "valor_nuevo" "text",
    "comentario" "text",
    "fecha_modificacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" integer NOT NULL
);

ALTER TABLE ONLY "public"."registros_diarios_auditoria" REPLICA IDENTITY FULL;


ALTER TABLE "public"."registros_diarios_auditoria" OWNER TO "postgres";


ALTER TABLE "public"."registros_diarios_auditoria" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."registros_diarios_auditoria_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."registros_diarios" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."registros_diarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" integer NOT NULL,
    "supabase_uid" "uuid" NOT NULL,
    "rol_id" integer NOT NULL,
    "nombre" "text",
    "segundo_nombre" "text",
    "apellido" "text",
    "segundo_apellido" "text",
    "correo" "text" NOT NULL,
    "estado" "public"."usuario_estado_enum" DEFAULT 'activo'::"public"."usuario_estado_enum" NOT NULL,
    "chofer_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


ALTER TABLE "public"."usuarios" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."usuarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."v_compras_repuestos" WITH ("security_invoker"='on') AS
 SELECT "cr"."id",
    "cr"."maquina_id",
    "cr"."fecha_compra",
    COALESCE("cr"."item_personalizado", "ir"."nombre", 'Sin nombre'::"text") AS "item_final",
    "extensions"."unaccent"("lower"(COALESCE("cr"."item_personalizado", "ir"."nombre", 'Sin nombre'::"text"))) AS "item_final_normalizado",
    "cr"."categoria",
    "cr"."costo",
    "cr"."numero_documento"
   FROM ("public"."compras_repuestos" "cr"
     LEFT JOIN "public"."items_repuesto" "ir" ON (("ir"."id" = "cr"."item_repuesto_id")));


ALTER VIEW "public"."v_compras_repuestos" OWNER TO "postgres";


ALTER TABLE ONLY "public"."pagos_semanales" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pagos_semanales_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."actor_auditoria"
    ADD CONSTRAINT "actor_auditoria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alertas"
    ADD CONSTRAINT "alertas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asignaciones_chofer_maquina"
    ADD CONSTRAINT "asignaciones_chofer_maquina_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."choferes"
    ADD CONSTRAINT "choferes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."choferes"
    ADD CONSTRAINT "choferes_rut_key" UNIQUE ("rut");



ALTER TABLE ONLY "public"."cierres_mensuales"
    ADD CONSTRAINT "cierres_mensuales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cierres_mensuales"
    ADD CONSTRAINT "cierres_mensuales_unicos" UNIQUE ("mes", "anio");



ALTER TABLE ONLY "public"."compras_repuestos"
    ADD CONSTRAINT "compras_repuestos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracion_general"
    ADD CONSTRAINT "configuracion_general_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cuentas_corrientes"
    ADD CONSTRAINT "cuentas_corrientes_chofer_id_key" UNIQUE ("chofer_id");



ALTER TABLE ONLY "public"."cuentas_corrientes"
    ADD CONSTRAINT "cuentas_corrientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentos_maquina"
    ADD CONSTRAINT "documentos_maquina_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historial_movimientos"
    ADD CONSTRAINT "historial_movimientos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items_repuesto"
    ADD CONSTRAINT "items_repuesto_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."items_repuesto"
    ADD CONSTRAINT "items_repuesto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liquidaciones"
    ADD CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."liquidaciones"
    ADD CONSTRAINT "liquidaciones_unicas_por_periodo" UNIQUE ("chofer_id", "mes", "anio");



ALTER TABLE ONLY "public"."maquinas"
    ADD CONSTRAINT "maquinas_numero_interno_key" UNIQUE ("numero_interno");



ALTER TABLE ONLY "public"."maquinas"
    ADD CONSTRAINT "maquinas_patente_key" UNIQUE ("patente");



ALTER TABLE ONLY "public"."maquinas"
    ADD CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagos_semanales"
    ADD CONSTRAINT "pagos_semanales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registros_diarios_auditoria"
    ADD CONSTRAINT "registros_diarios_auditoria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registros_diarios"
    ADD CONSTRAINT "registros_diarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registros_diarios"
    ADD CONSTRAINT "registros_diarios_unico_chofer_fecha" UNIQUE ("chofer_id", "fecha");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_chofer_id_unique" UNIQUE ("chofer_id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_correo_key" UNIQUE ("correo");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_supabase_uid_key" UNIQUE ("supabase_uid");



CREATE INDEX "idx_alertas_estado" ON "public"."alertas" USING "btree" ("estado");



CREATE INDEX "idx_alertas_origen" ON "public"."alertas" USING "btree" ("origen_tipo", "origen_id");



CREATE INDEX "idx_alertas_severidad" ON "public"."alertas" USING "btree" ("severidad");



CREATE INDEX "idx_asignaciones_chofer_id" ON "public"."asignaciones_chofer_maquina" USING "btree" ("chofer_id");



CREATE INDEX "idx_asignaciones_maquina_id" ON "public"."asignaciones_chofer_maquina" USING "btree" ("maquina_id");



CREATE INDEX "idx_docs_fecha_vencimiento" ON "public"."documentos_maquina" USING "btree" ("fecha_vencimiento");



CREATE INDEX "idx_docs_maquina_id" ON "public"."documentos_maquina" USING "btree" ("maquina_id");



CREATE INDEX "idx_maquinas_estado_operativo" ON "public"."maquinas" USING "btree" ("estado_operativo");



CREATE INDEX "idx_maquinas_identificador" ON "public"."maquinas" USING "btree" ("numero_interno", "patente");



CREATE INDEX "idx_maquinas_marca" ON "public"."maquinas" USING "btree" ("marca");



CREATE INDEX "idx_maquinas_numero_interno" ON "public"."maquinas" USING "btree" ("numero_interno");



CREATE INDEX "idx_maquinas_patente" ON "public"."maquinas" USING "btree" ("patente");



CREATE INDEX "idx_registros_chofer_fecha" ON "public"."registros_diarios" USING "btree" ("chofer_id", "fecha");



CREATE INDEX "idx_registros_chofer_id" ON "public"."registros_diarios" USING "btree" ("chofer_id");



CREATE INDEX "idx_registros_estado" ON "public"."registros_diarios" USING "btree" ("estado");



CREATE INDEX "idx_registros_fecha" ON "public"."registros_diarios" USING "btree" ("fecha");



CREATE INDEX "idx_registros_maquina_id" ON "public"."registros_diarios" USING "btree" ("maquina_id");



CREATE UNIQUE INDEX "unique_alerta_activa" ON "public"."alertas" USING "btree" ("tipo", "origen_tipo", "origen_id") WHERE ("estado" = 'activa'::"public"."alerta_estado_enum");



CREATE OR REPLACE TRIGGER "trg_alertas_updated_at" BEFORE UPDATE ON "public"."alertas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_asignaciones_updated_at" BEFORE UPDATE ON "public"."asignaciones_chofer_maquina" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_choferes_updated_at" BEFORE UPDATE ON "public"."choferes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_cierres_updated_at" BEFORE UPDATE ON "public"."cierres_mensuales" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_compras_repuestos_updated_at" BEFORE UPDATE ON "public"."compras_repuestos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_config_updated_at" BEFORE UPDATE ON "public"."configuracion_general" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_configuracion_general_updated_at" BEFORE UPDATE ON "public"."configuracion_general" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_documentos_maquina_updated_at" BEFORE UPDATE ON "public"."documentos_maquina" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_items_repuesto_updated_at" BEFORE UPDATE ON "public"."items_repuesto" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_liquidaciones_updated_at" BEFORE UPDATE ON "public"."liquidaciones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_maquinas_updated_at" BEFORE UPDATE ON "public"."maquinas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_pagos_semanales_updated_at" BEFORE UPDATE ON "public"."pagos_semanales" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_registros_diarios_updated_at" BEFORE UPDATE ON "public"."registros_diarios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_usuarios_updated_at" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_saldo_movimiento" AFTER INSERT ON "public"."historial_movimientos" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_saldo_cuenta"();



ALTER TABLE ONLY "public"."actor_auditoria"
    ADD CONSTRAINT "actor_auditoria_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."actor_auditoria"
    ADD CONSTRAINT "actor_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."alertas"
    ADD CONSTRAINT "alertas_resuelta_por_fkey" FOREIGN KEY ("resuelta_por") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asignaciones_chofer_maquina"
    ADD CONSTRAINT "asignaciones_chofer_maquina_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."asignaciones_chofer_maquina"
    ADD CONSTRAINT "asignaciones_chofer_maquina_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "public"."maquinas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."cierres_mensuales"
    ADD CONSTRAINT "cierres_mensuales_cerrado_por_fkey" FOREIGN KEY ("cerrado_por") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."compras_repuestos"
    ADD CONSTRAINT "compras_repuestos_item_repuesto_id_fkey" FOREIGN KEY ("item_repuesto_id") REFERENCES "public"."items_repuesto"("id");



ALTER TABLE ONLY "public"."compras_repuestos"
    ADD CONSTRAINT "compras_repuestos_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "public"."maquinas"("id");



ALTER TABLE ONLY "public"."cuentas_corrientes"
    ADD CONSTRAINT "cuentas_corrientes_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documentos_maquina"
    ADD CONSTRAINT "documentos_maquina_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "public"."maquinas"("id");



ALTER TABLE ONLY "public"."historial_movimientos"
    ADD CONSTRAINT "historial_movimientos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "public"."cuentas_corrientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."liquidaciones"
    ADD CONSTRAINT "liquidaciones_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pagos_semanales"
    ADD CONSTRAINT "pagos_semanales_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id");



ALTER TABLE ONLY "public"."registros_diarios_auditoria"
    ADD CONSTRAINT "registros_diarios_auditoria_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."actor_auditoria"("id");



ALTER TABLE ONLY "public"."registros_diarios_auditoria"
    ADD CONSTRAINT "registros_diarios_auditoria_registro_diario_id_fkey" FOREIGN KEY ("registro_diario_id") REFERENCES "public"."registros_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registros_diarios"
    ADD CONSTRAINT "registros_diarios_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registros_diarios"
    ADD CONSTRAINT "registros_diarios_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "public"."maquinas"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "public"."choferes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE "public"."actor_auditoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alertas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."asignaciones_chofer_maquina" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "backend_full_access_actores_auditoria" ON "public"."actor_auditoria" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_alertas" ON "public"."alertas" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_asignaciones" ON "public"."asignaciones_chofer_maquina" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_choferes" ON "public"."choferes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_cierres" ON "public"."cierres_mensuales" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_configuracion" ON "public"."configuracion_general" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_documentos" ON "public"."documentos_maquina" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_items" ON "public"."items_repuesto" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_liquidaciones" ON "public"."liquidaciones" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_maquinas" ON "public"."maquinas" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_pagos_semanales" ON "public"."pagos_semanales" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_registros" ON "public"."registros_diarios" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_registros_audit" ON "public"."registros_diarios_auditoria" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_repuestos" ON "public"."compras_repuestos" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_roles" ON "public"."roles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "backend_full_access_usuarios" ON "public"."usuarios" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."choferes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cierres_mensuales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compras_repuestos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configuracion_general" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cuentas_corrientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard_realtime_read_alertas" ON "public"."alertas" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard_realtime_read_auditoria" ON "public"."registros_diarios_auditoria" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard_realtime_read_registros" ON "public"."registros_diarios" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."documentos_maquina" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historial_movimientos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items_repuesto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."liquidaciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maquinas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pagos_semanales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registros_diarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registros_diarios_auditoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."alertas";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."registros_diarios";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."registros_diarios_auditoria";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON FUNCTION "public"."actualizar_saldo_cuenta"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_saldo_cuenta"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_saldo_cuenta"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."actor_auditoria" TO "anon";
GRANT ALL ON TABLE "public"."actor_auditoria" TO "authenticated";
GRANT ALL ON TABLE "public"."actor_auditoria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."actor_auditoria_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."actor_auditoria_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."actor_auditoria_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."alertas" TO "anon";
GRANT ALL ON TABLE "public"."alertas" TO "authenticated";
GRANT ALL ON TABLE "public"."alertas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."alertas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."alertas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."alertas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."asignaciones_chofer_maquina" TO "anon";
GRANT ALL ON TABLE "public"."asignaciones_chofer_maquina" TO "authenticated";
GRANT ALL ON TABLE "public"."asignaciones_chofer_maquina" TO "service_role";



GRANT ALL ON SEQUENCE "public"."asignaciones_chofer_maquina_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."asignaciones_chofer_maquina_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."asignaciones_chofer_maquina_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."choferes" TO "anon";
GRANT ALL ON TABLE "public"."choferes" TO "authenticated";
GRANT ALL ON TABLE "public"."choferes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."choferes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."choferes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."choferes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cierres_mensuales" TO "anon";
GRANT ALL ON TABLE "public"."cierres_mensuales" TO "authenticated";
GRANT ALL ON TABLE "public"."cierres_mensuales" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cierres_mensuales_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cierres_mensuales_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cierres_mensuales_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."compras_repuestos" TO "anon";
GRANT ALL ON TABLE "public"."compras_repuestos" TO "authenticated";
GRANT ALL ON TABLE "public"."compras_repuestos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."compras_repuestos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."compras_repuestos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."compras_repuestos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."configuracion_general" TO "anon";
GRANT ALL ON TABLE "public"."configuracion_general" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracion_general" TO "service_role";



GRANT ALL ON SEQUENCE "public"."configuracion_general_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."configuracion_general_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."configuracion_general_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cuentas_corrientes" TO "anon";
GRANT ALL ON TABLE "public"."cuentas_corrientes" TO "authenticated";
GRANT ALL ON TABLE "public"."cuentas_corrientes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cuentas_corrientes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cuentas_corrientes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cuentas_corrientes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."documentos_maquina" TO "anon";
GRANT ALL ON TABLE "public"."documentos_maquina" TO "authenticated";
GRANT ALL ON TABLE "public"."documentos_maquina" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documentos_maquina_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documentos_maquina_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documentos_maquina_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."historial_movimientos" TO "anon";
GRANT ALL ON TABLE "public"."historial_movimientos" TO "authenticated";
GRANT ALL ON TABLE "public"."historial_movimientos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."historial_movimientos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."historial_movimientos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."historial_movimientos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items_repuesto" TO "anon";
GRANT ALL ON TABLE "public"."items_repuesto" TO "authenticated";
GRANT ALL ON TABLE "public"."items_repuesto" TO "service_role";



GRANT ALL ON SEQUENCE "public"."items_repuesto_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."items_repuesto_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."items_repuesto_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."liquidaciones" TO "anon";
GRANT ALL ON TABLE "public"."liquidaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."liquidaciones" TO "service_role";



GRANT ALL ON SEQUENCE "public"."liquidaciones_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."liquidaciones_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."liquidaciones_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."maquinas" TO "anon";
GRANT ALL ON TABLE "public"."maquinas" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."maquinas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."maquinas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."maquinas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pagos_semanales" TO "anon";
GRANT ALL ON TABLE "public"."pagos_semanales" TO "authenticated";
GRANT ALL ON TABLE "public"."pagos_semanales" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pagos_semanales_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pagos_semanales_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pagos_semanales_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."registros_diarios" TO "anon";
GRANT ALL ON TABLE "public"."registros_diarios" TO "authenticated";
GRANT ALL ON TABLE "public"."registros_diarios" TO "service_role";



GRANT ALL ON TABLE "public"."registros_diarios_auditoria" TO "anon";
GRANT ALL ON TABLE "public"."registros_diarios_auditoria" TO "authenticated";
GRANT ALL ON TABLE "public"."registros_diarios_auditoria" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registros_diarios_auditoria_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."registros_diarios_auditoria_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registros_diarios_auditoria_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registros_diarios_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."registros_diarios_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registros_diarios_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON SEQUENCE "public"."usuarios_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."usuarios_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."usuarios_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v_compras_repuestos" TO "anon";
GRANT ALL ON TABLE "public"."v_compras_repuestos" TO "authenticated";
GRANT ALL ON TABLE "public"."v_compras_repuestos" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































