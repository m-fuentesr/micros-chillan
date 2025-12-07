-- Migración: Agregar campo para imagen del comprobante de diesel
-- Fecha: 2024
-- Descripción: Agrega campo opcional para almacenar la URL de la imagen del comprobante de carga de diesel

ALTER TABLE registros_diarios 
ADD COLUMN IF NOT EXISTS imagen_comprobante_diesel_url TEXT NULL;

-- Comentario en la columna para documentación
COMMENT ON COLUMN registros_diarios.imagen_comprobante_diesel_url IS 'URL de la imagen del comprobante de carga de diesel (opcional)';




